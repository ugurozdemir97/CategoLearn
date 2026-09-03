# Ürün ve özellikler

## Ürün amacı

CategoLearn klasik “ön/arka yüz” flashcard yaklaşımından ziyade, öğrenme
bilgilerini kullanıcının kendi hiyerarşisi ve alanlarıyla saklamasına odaklanır.
Dil öğrenimi ana ilham kaynağıdır; aynı yapı ders notları, sanat/tarih arşivi,
kişisel bilgi tabanı veya basit yapılacaklar listesi için de kullanılabilir.

Uygulamanın ayırt edici fikri, bir kartın sabit iki yüz yerine kullanıcı tarafından
adlandırılan birden fazla alana sahip olmasıdır. Örneğin “Unforeseen” kartında
“Açıklama”, “Örnek cümle”, “Türkçe karşılık” ve “Eş anlamlılar” alanları bulunabilir.

## Kullanıcı açısından mevcut özellikler

### Hiyerarşik düzenleme

- Ana ekranda konu niteliğinde kök klasörler oluşturulur.
- Bir klasörün altında sınırsız sayıda alt klasör ve kart bulunabilir.
- Kartların altında başlık ve isteğe bağlı zengin metin içeriği taşıyan alanlar
  bulunur.
- Aynı ebeveyn altında aynı tip ve aynı ada sahip etkin öğe oluşturulması arayüz
  ve kısmen veritabanı tarafından engellenir.
- Breadcrumb, kullanıcının klasör hiyerarşisinde üst seviyelere dönmesini sağlar.

### Kart ve zengin metin

- Kart oluştururken birden fazla alan aynı pencerede eklenebilir.
- Alan içeriğinde kalın, italik, altı çizili, vurgulu metin; madde/numara listesi;
  yatay çizgi; geri al ve yinele araçları vardır.
- Kart detayında alan başlığı görünür, içerik dokunmayla açılıp kapanır.

### Toplu işlemler ve pano

- Uzun basma seçim modunu başlatır; ardından birden fazla öğe seçilebilir.
- Seçilen öğeler silinebilir, renklendirilebilir, kesilebilir veya kopyalanabilir.
- Klasörler yalnızca köke/klasöre, kartlar yalnızca klasöre, alanlar yalnızca
  karta yapıştırılabilir.
- Klasörü kendi içine ya da alt klasörlerinden birine taşıma engellenir.
- Klasör kopyalama alt klasör, kart ve alanları; kart kopyalama alanları da
  kopyalar.
- Pano yalnızca uygulama belleğindedir; uygulama yeniden başlayınca kaybolur.

### Sıralama ve renkler

- Düzenleme zamanı, alfabe, oluşturma zamanı, renk ve özel sıra seçenekleri vardır.
- Klasör ekranında klasörler her zaman kartların önünde tutulur.
- Özel sırada sürükle-bırak veya yukarı/aşağı okları kullanılabilir.
- Dokuz renk seçeneği vardır: sekiz sabit renk ve “renksiz”.
- Renklerin sıralama önceliği ve aynı renk içindeki ikincil sıra ayarlardan
  değiştirilebilir.

### Arama

- Etkin klasör, kart ve alan adları tek ekranda aranır.
- Alanların zengin metin içeriği de düz metin eşleşmesi yerine saklanan HTML dizesi
  üzerinden aranır.
- Sonuca dokunmak ilgili konuma götürür. Mevcut kod kart sonucunda kartı değil
  ebeveyn klasörü açar; kök klasör sonucunda ana ekranı açar.

### Silme ve geri yükleme

- Normal silme, öğeyi `deleted_at` alanıyla yumuşak siler.
- Silinen öğeler tek bir çöp ekranında listelenir.
- Seçili öğeler geri yüklenebilir veya kalıcı silinebilir; çöpün tamamı da
  boşaltılabilir.
- Eski ebeveyni bulunmayan öğeler gizli sistem hedeflerine alınır:
  `Restored Items` klasörü ve `Restored Fields` kartı.
- Hedefte ad çakışması varsa geri yüklenen öğeye `(1)`, `(2)` gibi bir ek verilir.

### Kişiselleştirme ve yerelleştirme

- Dokuz tema tanımlıdır: Midnight, Deep Space, Ocean, Aurora, Wood, Charcoal,
  Slate, Light ve Sunset.
- İngilizce ve Türkçe arayüz vardır.
- İlk dil cihaz dilinden seçilir; daha sonra kullanıcı tercihi saklanır.
- Uygulama genelinde sistem yazı büyütmesi kapatılmıştır.

### Yedekleme

- SQLite veritabanı paylaşım menüsüyle `.db` dosyası olarak dışa aktarılır.
- Dosya seçiciyle bir `.db` dosyası içe alınabilir.
- İçe aktarmadan önce mevcut ana veritabanının uygulama belgeleri alanına bir
  kopyası bırakılır.
- İçe aktarma sonrasında değişikliğin görünmesi için uygulamanın yeniden başlatılması
  gerekir.

## Ekranlar

| Ekran | Görev | Ana giriş noktaları |
|---|---|---|
| `Home` | Kök konuları/klasörleri listeler | Oluştur, düzenle, sırala, toplu işlem |
| `Folder` | Alt klasör ve kartları listeler | Breadcrumb, iki oluşturma düğmesi, pano |
| `CardDetail` | Kart alanlarını listeler | İçerik aç/kapat, alan düzenleme |
| `Search` | Tüm etkin öğelerde istemci tarafı arama | Alt menüdeki arama düğmesi |
| `Deleted` | Çöp kutusu | Geri yükle, kalıcı sil, çöpü boşalt |
| `Settings` | Renk sırası, tema, dil ve yedek | Alt menüdeki ayarlar düğmesi |
| DB yükleme/hata | Başlangıç şema kurulum durumları | Uygulama açılışı |

## Ürünün bilinçli sınırları

Kodda şu anda kullanıcı hesabı, bulut eşitleme, paylaşılmış çalışma alanı, gerçek
flashcard tekrar algoritması, bildirim/hatırlatıcı, ses, ek dosya, etiket, bağlantı
veya ağ tabanlı servis bulunmaz. Kök README; ses, hatırlatıcı, ağaç görünümü ve
eşitlemeyi olası gelecek özellikleri olarak anar, fakat bunlar taahhüt edilmiş
değildir.

## Temel kullanıcı akışları

### Bilgi oluşturma

1. Ana ekranda bir konu oluşturulur.
2. Konu içinde alt klasör veya kart oluşturulur.
3. Kart oluşturma penceresinde isteğe bağlı alanlar eklenir.
4. Alan başlıkları ve zengin metin içerikleri SQLite'a kaydedilir.

### Öğeyi başka yere taşıma

1. Öğe uzun basmayla seçilir ve “Kes” seçilir.
2. Uygun hedef klasör veya kart açılır.
3. Alt menüde “Yapıştır” seçilir.
4. Tip, döngü ve ad çakışması kontrolleri geçerse `parent_id` güncellenir.

### Silinen öğeyi geri getirme

1. Öğe yumuşak silinir.
2. Çöp ekranında seçilir ve geri yüklenir.
3. Eski ebeveyn etkinse aynı yere, değilse sistem geri yükleme alanına taşınır.
4. Ad çakışması varsa otomatik yeniden adlandırılır.

