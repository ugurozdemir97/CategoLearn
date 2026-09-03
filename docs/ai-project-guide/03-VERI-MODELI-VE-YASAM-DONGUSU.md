# Veri modeli ve yaşam döngüsü

## SQLite şeması

Üç ana tablo aynı temel alanları paylaşır:

| Alan | Anlam |
|---|---|
| `id` | Otomatik artan birincil anahtar |
| `parent_id` | Bir üst öğenin kimliği |
| `name` | Zorunlu, veritabanında 1–50 karakter kontrolü |
| `color` | Hex renk veya `NULL` |
| `type` | `Category`, `Card` veya `Field` |
| `sort_index` | Özel sıra; normalde `NULL`, kayıt sırasında 100'ün katları |
| `created_at` | SQLite yerel saat metni |
| `updated_at` | SQLite yerel saat metni |
| `deleted_at` | `NULL` ise etkin; tarih varsa yumuşak silinmiş |

Tabloya özel alanlar:

- `folders.parent_id` → başka bir klasör; kökte `NULL` olabilir.
- `folders.is_system_folder` → geri yükleme sistem klasörünü işaretler.
- `cards.parent_id` → zorunlu klasör kimliği.
- `cards.is_system_card` → geri yüklenen alanların sistem kartını işaretler.
- `fields.parent_id` → zorunlu kart kimliği.
- `fields.context` → Rich Editor'ın ürettiği HTML dizesi.

İlişki modeli:

```text
folders.id 1 ─── n folders.parent_id
folders.id 1 ─── n cards.parent_id
cards.id   1 ─── n fields.parent_id
```

Şemada `ON DELETE CASCADE` tanımlıdır; ancak başlangıç kodu açıkça
`PRAGMA foreign_keys = ON` çalıştırmaz. Bu nedenle cascade davranışı hedef cihazda
doğrulanmadan güvenilir varsayılmamalıdır.

## Benzersizlik kuralları

Kısmi unique indeksler yalnızca etkin ve sistem olmayan öğeleri kapsar:

- klasör: `(parent_id, name)`
- kart: `(parent_id, name)`
- alan: `(parent_id, name)`

Önemli ayrıntılar:

- SQLite unique indeksinde `NULL` değerler birbirine eşit sayılmadığından kök
  klasör adlarının benzersizliği indeks tarafından tam güvenceye alınmaz; mevcut
  UI kontrolüne dayanır.
- Karşılaştırmalar varsayılan olarak büyük/küçük harfe duyarlıdır.
- Silinmiş öğeler ad rezervasyonu yapmaz; aynı adla yeni etkin öğe oluşturulabilir.
- Geri yükleme bu nedenle çakışmada otomatik son ek üretir.

## Sistem öğeleri

Başlangıçta aşağıdaki öğeler yoksa oluşturulur:

- Kök `Restored Items ` klasörü (`is_system_folder = 1`)
- Onun altında `Restored Fields ` kartı (`is_system_card = 1`)

Her iki sabit adın sonunda boşluk vardır. Sistem öğeleri boş olduklarında liste ve
aramadan gizlenir. Normal sorgu API'leri bunların düzenlenmesini, içine normal öğe
oluşturulmasını veya doğrudan silinmesini engellemeye çalışır. Buna karşın UI'da
seçilebilir olmaları bazı hata yollarını açık bırakır.

## Silme davranışı

### Yumuşak silme

- Klasör silindiğinde yalnızca seçilen klasörün `deleted_at` alanı dolar.
  Çocuklarının satırları etkin kalır ancak normal hiyerarşik listede görünmez.
- Kart silindiğinde yalnızca kart işaretlenir; alanları etkin kalır.
- Alan silindiğinde yalnızca alan işaretlenir.
- Sistem klasörü “silinirse” sistem satırı korunur, etkin çocukları yumuşak silinir.
- Sistem kartı “silinirse” kart korunur, etkin alanları yumuşak silinir.

Bu tasarım ebeveyn geri yüklendiğinde çocukların otomatik görünmesini sağlar. Aynı
zamanda arama sorgusu yalnızca öğenin kendi `deleted_at` değerine baktığı için,
silinmiş bir ebeveynin etkin çocuklarının aramada görünmesine yol açabilir.

### Kalıcı silme

Klasör ve kart silme fonksiyonları çocukları özyinelemeli siler; fakat yalnızca
`deleted_at IS NULL` çocukları seçer. Daha önce ayrıca yumuşak silinmiş bir çocuk,
foreign key cascade etkin değilse geride kalabilir. Bu işlem transaction içinde
değildir; yarıda kesilirse kısmi sonuç oluşabilir.

## Geri yükleme davranışı

- Eski ebeveyn mevcut ve etkinse öğe aynı yere döner.
- Ebeveyn yok veya silinmişse klasör/kart `Restored Items` altına gider.
- Alanın kartı yok veya silinmişse alan `Restored Fields` kartına gider.
- Aynı adda etkin kardeş varsa `Ad (1)`, `Ad (2)` biçiminde yeni ad aranır.
- Toplu geri yüklemede sıra klasör → kart → alan şeklindedir.

`restoreFolder` ve `restoreCard` yorumları çocukların da geri yüklendiğini söylese
de kod yalnızca seçilen satırın `deleted_at` değerini temizler. Normal ebeveyn
silme çocukları işaretlemediği için çoğu akışta görünür sonuç doğrudur; ayrı ayrı
silinmiş çocuklar otomatik geri yüklenmez.

## Kopyalama ve taşıma

- Taşıma, ilgili satırın `parent_id` değerini değiştirir.
- Klasör kopyalama yeni klasör oluşturur; kartlarını/alanlarını ve alt klasörlerini
  derinlemesine kopyalar.
- Kart kopyalama kartı ve etkin alanlarını kopyalar.
- Alan kopyalama yeni alan satırı oluşturur.
- Kopya işlemleri `sort_index`, oluşturma/düzenleme tarihleri ve sistem işaretlerini
  taşımaz; yeni normal öğeler üretir.
- Çoklu kopyada öğeler tek tek işlenir ve transaction yoktur.

## Sıralama

Sıralama SQL yerine çoğunlukla JavaScript belleğinde yapılır. Normal liste
sorguları başlangıçta ada göre sıralasa da `handleSort` seçili tercihe göre sonucu
yeniden sıralar. Özel sıra `sort_index` değerine; değeri olmayan öğeler ise yeni
oluşturulana öncelik veren `created_at` sırasına göre yerleşir.

Klasör ve kartlar önce ayrı sıralandığı için, sürükleme arayüzü tipler arasında sıra
oluşturmaya izin verse bile yeniden yüklemede klasörler yine kartların üstüne gelir.

## Tarihler

Tarihler `datetime('now', 'localtime')` ile `YYYY-MM-DD HH:MM:SS` biçimine benzer
bir SQLite metni olarak saklanır ve JavaScript `Date` ile ayrıştırılır. Saat dilimi
işareti taşımayan bu biçimin iOS/Hermes davranışı cihaz testiyle doğrulanmalıdır.
Bir alanın düzenlenmesi ebeveyn kartın, kart/alt klasör değişikliği de ebeveyn
klasörün `updated_at` değerini güncellemez.

## Yedek dışa aktarma

1. Kod birkaç olası konumda `app.db` arar.
2. Dosyayı tarih damgalı adla cache alanına kopyalar.
3. Sistem paylaşım menüsünü açar.
4. Geçici kopyayı on saniye sonra silmeye çalışır.

Bu ham dosya kopyasıdır; şema sürümü veya dışa aktarım manifesti yoktur. Açık
veritabanının tutarlı anlık görüntüsü/WAL durumu ayrıca doğrulanmalıdır.

## Yedek içe aktarma

1. Kullanıcıdan herhangi bir dosya seçmesine izin verilir.
2. Ana veritabanı bağlantısı kapatılır.
3. Mevcut dosya `database_backup_<timestamp>.db` adıyla belge alanına kopyalanır.
4. Seçilen dosya ana veritabanının üzerine yazılır.
5. UI kullanıcıdan uygulamayı yeniden başlatmasını ister.

İçe alınan dosyanın SQLite bütünlüğü, beklenen tabloları, şema sürümü veya boyutu
önceden doğrulanmaz. Kopyalama başarısız olduğunda otomatik rollback/reopen yoktur.
Bu nedenle iyileştirme önceliği yüksektir.

