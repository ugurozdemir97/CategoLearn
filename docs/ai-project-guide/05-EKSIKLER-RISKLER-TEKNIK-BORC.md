# Eksikler, riskler ve teknik borç

## Nasıl okunmalı?

Bu liste statik kod incelemesinin sonucudur. `Kesin` koddan doğrudan görülen
davranışı, `Doğrula` ise cihaz/veri senaryosu testi isteyen güçlü riski belirtir.
Öncelikler öneridir:

- **P0:** veri kaybı, güvenlik veya yayın engeli olabilecek konu
- **P1:** kullanıcıya yanlış/bozuk davranış veya bakım riski
- **P2:** performans, kalite ve geliştirici deneyimi
- **P3:** iyileştirme / düşük etkili temizlik

## P0 — önce ele alınması gerekenler

### 1. İçe aktarma doğrulamasız biçimde ana DB'nin üzerine yazıyor — Kesin

`importDatabase`, seçilen dosyanın SQLite bütünlüğünü, tablo/kolonlarını, şema
sürümünü ve uygulamayla uyumunu kontrol etmeden ana dosyanın üzerine kopyalar.
Bağlantı kopyalamadan önce kapatılır; kopya başarısızsa eski dosyayı geri alma ve
bağlantıyı yeniden açma akışı yoktur. Bozuk/yanlış dosya uygulamayı açılmaz veya
kullanılmaz hale getirebilir.

Öneri: geçici konuma al → `PRAGMA integrity_check` → şema/uygulama sürümü doğrula →
transaction benzeri atomik dosya değişimi → başarısızlıkta geri dön → DB yöneticisi
üzerinden yeniden aç.

### 2. Yayın imzalama ve native kaynak stratejisi belirsiz — Kesin/Doğrula

Yerel `android/app/build.gradle`, release tipini debug keystore ile imzalıyor.
`android/` Git'te yok fakat `.easignore` tarafından da dışlanmıyor. Böylece build'in
managed config mi yoksa yerel native çıktı mı kullandığı çalışma ortamına göre
değişebilir.

Öneri: tek yayın stratejisi seçin. Managed/prebuild ise `android/` yüklemesini
dışlayıp her build'de üretin; native klasörü kaynak kabul edilecekse izleyin ve
gerçek release credential/EAS Credentials kullanın. Üretim artifact'inin sertifika
ve manifestini CI'da doğrulayın.

### 3. Şema migration ve sürümleme yok — Kesin

`CREATE TABLE IF NOT EXISTS`, var olan tabloya yeni kolon, constraint veya veri
dönüşümü uygulamaz. Gelecekteki şema değişiklikleri mevcut kullanıcı cihazlarında
sessizce eksik kalabilir.

Öneri: `PRAGMA user_version` tabanlı sıralı migration'lar, her migration için
transaction ve eski DB fixture'larıyla yükseltme testleri.

## P1 — işlevsel doğruluk ve veri bütünlüğü

### 4. Foreign key enforcement açıkça etkinleştirilmiyor — Doğrula

Şema `ON DELETE CASCADE` tanımlasa da `PRAGMA foreign_keys = ON` çağrısı yoktur.
SQLite varsayılanına bağlı kalınırsa orphan satırlar oluşabilir.

### 5. Kalıcı silme daha önce silinmiş çocukları atlayabilir — Kesin

Özyinelemeli kalıcı silme yalnız `deleted_at IS NULL` çocukları seçer. Foreign key
enforcement yoksa, daha önce ayrı silinmiş çocuklar ebeveyn kalıcı silindiğinde
geride kalabilir. Klasör/kart kalıcı silme transaction içinde de değildir.

### 6. Arama, silinmiş ebeveynin etkin çocuklarını gösterebilir — Kesin

Yumuşak silme yalnız ebeveyni işaretler. Arama ise her tablo için yalnız satırın
kendi `deleted_at` alanını filtreler. Silinmiş klasörün kartı veya silinmiş kartın
alanı sonuçlara girebilir ve silinmiş hiyerarşiye navigasyon denenebilir.

### 7. Çok adımlı yazmalar atomik değil — Kesin

Kart + alan oluşturma, kart düzenlerken alan senkronu, derin kopya, toplu yapıştırma,
toplu restore/silme ve sıra kaydı transaction kullanmaz. Hata/uygulama kapanması
kısmi veri bırakabilir.

### 8. Kök klasör benzersizliği DB tarafından tam korunmuyor — Kesin

Köklerde `parent_id = NULL` olduğu için birleşik unique indeks birden çok aynı adlı
kök satıra izin verebilir. UI kontrolü yarış koşulunda veya ileride başka bir yazma
yolunda yeterli değildir.

### 9. Create modal asenkron kaydı beklemiyor ve hataları yakalamıyor — Kesin

`onCreate(...)` await edilmeden modal kapanır. SQL constraint veya dosya/bağlantı
hatası kullanıcıya kontrollü gösterilmez; iki kez kapanma çağrısı da oluşur.

### 10. Sistem öğeleri UI işlemlerinde tutarsız — Kesin/Doğrula

Sistem klasörü/kartı doluyken listede seçilebilir. Sorgu katmanı düzenleme ve bazı
oluşturma işlemlerini hata fırlatarak engeller, fakat ekran handler'larında genel
hata yakalama yoktur. Renk/düzenleme gibi işlemler kullanıcıya açıklama yerine
yakalanmamış hata üretebilir.

### 11. Arama sonucunun hedef davranışı şaşırtıcı — Kesin

Kök klasör sonucu klasörü açmak yerine Home'a, kart sonucu kartı açmak yerine
ebeveyn klasöre gider. Alan sonucu kart detayını açsa da ilgili alan otomatik açılmaz
veya vurgulanmaz.

### 12. İçe aktarımdan sonra DB nesnesi kapalı kalıyor — Kesin

Modül düzeyindeki bağlantı `closeAsync()` ile kapanır ve yeniden açılmaz. UI sadece
yeniden başlatma mesajı gösterir; kullanıcı mesajı kapatıp uygulamada devam ederse
sonraki sorgular hata verebilir.

### 13. Son düzenleme zamanı hiyerarşik değişiklikleri yansıtmıyor — Kesin

Alan değişikliği kartı, kart/alt klasör değişikliği ebeveyn klasörü güncellemez.
Route ile taşınan nesneler de yeniden okunmadığı için başlık tarihleri daha da eski
kalabilir.

### 14. Çöp sıralama state'i tutarsız kullanılıyor — Kesin

`DeletedScreen` ilk yüklemede çöp kipi yerine normal `loadSortMode()` değerini
kullanır. `ListButton` da yalnız normal `sortMode` context'ini okur. Çöp başlığında
seçili kip ile gerçek liste/tarih ikonu farklılaşabilir.

## P2 — performans, erişilebilirlik ve bakım

### 15. N+1 ve seri sorgular — Kesin

Sistem klasörünü gizleme, sistem kartını kontrol, derin kopyalama, ancestry kurma
ve toplu işlemler döngü içinde ardışık sorgu çalıştırır. Veri büyüdükçe gecikme
katlanır.

### 16. Arama tüm veriyi JS belleğine yüklüyor — Kesin

Her odakta üç tablonun tüm etkin satırları okunur; her tuş vuruşunda dizi taranır.
HTML etiketleri de arama metninin parçasıdır. Debounce, normalize edilmiş düz metin,
SQL LIKE/FTS veya sayfalama yoktur.

### 17. Destekleyici indeksler eksik — Kesin

Sık filtrelenen `parent_id`, `deleted_at`, `is_system_*`, `sort_index` ve tarih
alanları için sorgu odaklı indeksler yoktur. Unique indeksler bazı sorgulara yardım
etse de tüm erişim desenlerini kapsamaz.

### 18. Her sıralama çağrısında gereksiz AsyncStorage okuması — Kesin

`handleSort`, kip renk değilken de renk sırası ve ikincil tercih için iki asenkron
okuma yapar. Bu tercihler context/cache içinde tutulabilir veya yalnız renk kipinde
okunabilir.

### 19. Özel sıra tipler arasında yanıltıcı — Kesin

Kullanıcı sürüklerken kartı klasörün üstüne taşıyabilir; kayıttan sonra sıralayıcı
tipleri tekrar ayırır ve görünüm geri değişir. UI tip sınırını göstermeli veya
global sıra gerçekten desteklenmelidir.

### 20. Global font scaling kapalı — Kesin

`Text` ve `TextInput` için `allowFontScaling = false`, büyük yazı kullanan kişiler
için erişilebilirliği düşürür. Dokunma alanları, erişilebilirlik etiketleri ve ekran
okuyucu rolleri de sistematik tanımlı değildir.

### 21. Sabit modal ve renk ızgarası ölçüleri — Kesin/Doğrula

Modal genişliği `%96`, renk ızgarası `170×170`, editör yükseklikleri sabittir.
Küçük ekran, tablet, klavye ve uzun çeviri kombinasyonlarında taşma testi gerekir.
iOS tablet destekli görünse de responsive tasarım katmanı yoktur.

### 22. Tarih saklama/ayrıştırma taşınabilir değil — Doğrula

Saat dilimi işaretsiz SQLite yerel zaman metni doğrudan `new Date()` ile okunur.
Android/iOS ve yaz saati geçişlerinde test edilmelidir. Gösterim de `en-GB`
formatına sabitlenmiştir.

### 23. Hata yönetimi ve gözlemlenebilirlik parçalı — Kesin

Birçok ekran handler'ında `try/catch`, kullanıcı dostu hata ve yeniden deneme yoktur.
Konsol logları dışında merkezi log/crash raporu bulunmaz. DB başlangıç hatası tek
iyi tanımlı hata sınırıdır.

### 24. İş kuralları UI ve SQL arasında dağınık — Kesin

Bazı ekranlar doğrudan DB kullanır; duplicate ve sistem öğesi kuralları hem modal
hem query katmanında farklı uygulanır. Test edilebilir repository/service sınırı
yoktur.

### 25. Otomatik kalite kapıları yok — Kesin

Test, lint, format, type-check ve CI script'i yoktur. `package.json` yalnız start,
Android ve iOS komutlarını içerir. Regresyonları yayın öncesi yakalayan otomasyon
bulunmaz.

## P3 — somut küçük kusurlar ve temizlik

- Klasör duplicate hatasında `duplicateFolder` yerine `duplicateField` çevirisi
  kullanılıyor.
- Alan silme onayı `infoMessages.deleteField` ister; locale dosyalarında bu anahtar
  yok, yanlışlıkla `infoMessages.infoMessages` bulunuyor.
- Klasör doğrulama tipi, açık bir `type` prop'u yerine çevrilmiş modal başlığının
  son kelimesinden türetiliyor; özellikle Türkçe başlıklarda hatalı çeviri anahtarı
  üretebilir.
- `RichTextDisplay` içindeki `enderersProps` muhtemelen `renderersProps` yazım
  hatasıdır; kütüphane davranışıyla doğrulanmalı.
- `exportDb.js` içindeki `Platform` ve `db.js` içindeki `executeSql` kullanılmıyor.
- Sistem öğelerinin sabit adlarında sonda boşluk var.
- `ScrollingText` görünümünde `overflow: "scroll"` platform desteği ve animasyonun
  unmount sonrası tekrarlama callback'i doğrulanmalı.
- Renk değiştirme modalı kapanırken işlemi uygular; Android geri tuşunun kullanıcı
  tarafından “iptal” sanılması mümkün.
- Arama verisi yeniden yüklendiğinde mevcut sorgu tekrar çalıştırılmadığı için açık
  arama sonuçları eski kalabilir.
- `DateDisplay` her satır için ayrı dakikalık timer kurar; uzun listelerde tek ortak
  zaman sinyali daha ucuzdur.
- `expo-status-bar` bağımlılığı kuruludur ancak uygulamada kullanılmaz.
- Eski `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` ve
  `SYSTEM_ALERT_WINDOW` izinlerinin release manifestinde gerekliliği incelenmelidir.
- `app.json` içinde iOS `bundleIdentifier` yoktur; iOS build/yayın hedefi varsa
  tamamlanmalıdır.

## Test kapsamındaki büyük boşluklar

En az şu senaryolar otomatik veya cihaz testi istemektedir:

- Derin hiyerarşide kes/kopyala, kendine/altına yapıştırma ve ad çakışmaları
- Ayrı ayrı silinmiş ebeveyn/çocuk kombinasyonlarının restore ve kalıcı silinmesi
- Bozuk, eski, yabancı ve WAL içeren DB import/export
- Türkçe karakterli arama, sıralama ve case dönüşümü
- Uygulama işlem ortasında kapanırken çoklu yazmalar
- Sistem klasörü/kartı üzerinde tüm toplu eylemler
- Çöp ekranının tüm sıra kipleri ve tarih ikonları
- Koyu/açık temalarda zengin metin vurgusu ve HTML render
- Android geri tuşu, breadcrumb ve arama sonucu navigasyonu
- Erişilebilir yazı boyutu, ekran okuyucu ve küçük ekran/klavye düzeni

