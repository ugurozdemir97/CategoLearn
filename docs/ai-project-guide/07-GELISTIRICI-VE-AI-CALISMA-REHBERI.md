# Geliştirici ve AI çalışma rehberi

## Yerel çalışma

Gereksinimler: güncel Node.js/npm, Expo'nun desteklediği Android/iOS araçları ve
tercihen gerçek cihaz veya emülatör.

```bash
npm install
npm start
npm run android
npm run ios
```

`npm run ios` komutu Windows'ta yerel iOS simulator çalıştırmaz. Mevcut projede web
script'i tanımlı değildir. `node_modules` kilit dosyasıyla kurulmalıdır.

## Mevcut kalite durumu

Şu anda `package.json` içinde test, lint, format, type-check veya production build
doğrulama script'i yoktur. Bir değişikliği “tamamlandı” saymadan önce en azından:

1. Expo bundle/config kontrolü,
2. Android cihaz/emülatörde ilgili akış,
3. Türkçe ve İngilizce arayüz,
4. en az bir koyu ve Light tema,
5. veritabanı kalıcılığı ve uygulama yeniden başlatma

elle doğrulanmalıdır.

## Yapay zekâ ajanı için hızlı bağlam

- “Subject” ayrı tablo değildir; kökteki normal klasördür.
- Veritabanındaki klasör tipi `Category` string'idir.
- Kart alanındaki içerik `context` kolonunda HTML olarak saklanır.
- Silme çoğunlukla yalnız hedef satırı işaretler; çocuklar etkin kalabilir.
- Sistem geri yükleme öğeleri normal veri gibi tablolardadır ve flag ile ayrılır.
- Listeler SQLite'tan okunup JavaScript'te sıralanır.
- Klasör ekranı klasör ve kartları tek dizide birleştirir ama tipleri ayrı gruplar.
- Pano process-local React state'idir; işletim sistemi panosu değildir.
- `android/` yerelde vardır fakat Git tarafından izlenmez; kaynak gerçekliği kabul
  edilmeden orada kalıcı değişiklik yapmayın.
- Şema değişikliği yalnız `CREATE TABLE IF NOT EXISTS` düzenleyerek tamamlanmış olmaz;
  migration gerekir.

## Değişiklik yaparken güvenli çalışma kuralları

1. Önce ilgili ekranı, ortak modal/hook'u ve `queries.js` iş kuralını birlikte okuyun.
2. UI kontrolünü veri bütünlüğü garantisi saymayın; invariant'ı service/DB
   seviyesinde de koruyun.
3. Birden çok satır yazan her işlem için transaction sınırı tanımlayın.
4. Yumuşak silinmiş ebeveyn ve çocuk senaryosunu ayrıca düşünün.
5. İki locale dosyasına aynı anahtarı ekleyin; anahtarı çevrilmiş metinden türetmeyin.
6. Route parametresindeki nesnenin eski olabileceğini varsayın; doğruluk gereken
   yerde kimlikle yeniden okuyun.
7. Sistem öğesi flag'lerini kopyalama, arama, seçim, düzenleme ve silmede açıkça ele
   alın.
8. Veritabanı dosyası üzerinde işlem yapmadan önce geri dönüş yolunu tasarlayın.
9. `app.json`, `.easignore` ve yerel `android/` arasındaki build etkisini kontrol edin.
10. Kullanıcı verisini etkileyen değişiklikte eski DB fixture'ıyla yükseltme testi
    yapın.

## Özellik bazlı kontrol listeleri

### CRUD veya veri modeli değişikliği

- [ ] Yeni invariant ve izin verilen ebeveyn tipi tanımlandı.
- [ ] Migration hem boş hem dolu eski DB'de çalışıyor.
- [ ] Create/edit/delete/restore/permanent delete yolları güncellendi.
- [ ] Kopyala/kes/yapıştır davranışı güncellendi.
- [ ] Arama ve sıralama yeni alanı doğru ele alıyor.
- [ ] Export/import geriye uyumluluğu kararlaştırıldı.
- [ ] Transaction ve rollback test edildi.

### Yeni ekran veya navigasyon

- [ ] Stack route tanımı ve parametre sözleşmesi yazıldı.
- [ ] Android donanım geri tuşu test edildi.
- [ ] Breadcrumb/alt menü davranışı tutarlı.
- [ ] Ekran focus olduğunda veri yenileniyor.
- [ ] Silinmiş veya artık var olmayan route hedefi ele alınıyor.
- [ ] Küçük ekran, tablet, klavye ve safe-area test edildi.

### Yerelleştirme

- [ ] `en.json` ve `tr.json` anahtarları birebir eşleşiyor.
- [ ] Interpolation parametreleri iki dilde aynı.
- [ ] Türkçe büyük/küçük harf ve alfabetik sıra senaryosu test edildi.
- [ ] Uzun çeviriler buton/modal düzenini bozmuyor.

### Yayın

- [ ] Versiyon ve Android `versionCode` artırıldı.
- [ ] Üretim build kaynağı (managed veya native) net.
- [ ] Release doğru sertifikayla imzalı; debug keystore kullanılmıyor.
- [ ] Yalnız gerekli izinler manifestte.
- [ ] R8/ProGuard açık build'de editor, Reanimated ve SQLite akışları çalışıyor.
- [ ] Temiz kurulum, eski sürümden yükseltme ve yedekten dönüş test edildi.

## Önerilen test piramidi

### Birim testleri

- `validateName`
- `formatDate` (saat dilimi kontrollü sahte zamanla)
- `handleSort` (tüm kipler, renk ve `NULL` sort index)
- benzersiz ad üretimi
- yapıştırma izin matrisi

### SQLite entegrasyon testleri

- şema ve migration'lar
- root/sibling benzersizliği
- foreign key/cascade davranışı
- yumuşak ve kalıcı silme kombinasyonları
- transaction rollback
- restore hedefi ve yeniden adlandırma
- kopyalanan derin ağacın eşdeğerliği
- geçerli/geçersiz import fixture'ları

### UI testleri

- konu → klasör → kart → alan oluşturma
- seçim ve toplu işlem
- özel sıra kalıcılığı
- arama sonucundan tam hedefe gitme
- çöp restore ve kalıcı silme
- dil/tema değişiminin yeniden başlatmada korunması

## Önerilen scriptler

Araç seçimi projeye göre yapılmalı, fakat hedef komut sözleşmesi şu kadar basit
olabilir:

```json
{
  "scripts": {
    "lint": "...",
    "format:check": "...",
    "test": "...",
    "test:db": "...",
    "check": "npm run lint && npm run test",
    "build:preview": "eas build --profile preview --platform android"
  }
}
```

Bu blok öneridir; mevcut `package.json` içinde henüz bulunmaz.

## Bir sonraki ajana bırakılacak görev özeti şablonu

```text
Amaç:
Değiştirilen dosyalar:
Şema/migration etkisi:
Kullanıcı davranışı değişikliği:
Test edilen senaryolar:
Test edilmeyen riskler:
Dokümantasyon güncellemeleri:
```

## Bilinen gerçekleri varsayımlardan ayırma

Yeni analiz veya PR açıklamasında şu etiketler önerilir:

- `Mevcut:` Kodda doğrudan görülen davranış.
- `Doğrulandı:` Cihaz/test çıktısıyla kanıtlanan davranış.
- `Risk:` Koddan çıkarılan fakat çalışma zamanı testi isteyen durum.
- `Öneri:` Henüz ürün kararı veya implementasyon olmayan fikir.

Bu ayrım özellikle backup/import, Android release, tarih ayrıştırma ve WebView
zengin metin davranışlarında önemlidir.

