# Geliştirme ve optimizasyon önerileri

## Önerilen yol haritası

### Aşama 1 — veri güvenliği ve yayın güveni

1. `PRAGMA foreign_keys = ON` ve sonucu kontrol eden başlangıç testi ekleyin.
2. `PRAGMA user_version` tabanlı migration sistemi kurun.
3. Çok adımlı CRUD, kopya, restore, silme ve sıra işlemlerini transaction'a alın.
4. Import'u geçici DB doğrulaması ve otomatik rollback ile yeniden tasarlayın.
5. Tutarlı export için checkpoint/backup yaklaşımını cihazlarda doğrulayın.
6. Android native klasör ve EAS stratejisini tekleştirip release imzasını düzeltin.
7. En riskli veri senaryoları için entegrasyon testleri ekleyin.

Başarı ölçütü: bozuk import ana DB'yi değiştiremez; migration eski fixture'ları
başarıyla yükseltir; yarıda kesilen toplu işlem kısmi veri bırakmaz; production APK
debug sertifikasıyla imzalanmaz.

### Aşama 2 — doğruluk ve kullanıcı deneyimi

1. Aramayı yalnız etkin ataları olan öğelerle sınırlandırın.
2. Arama sonucunu doğrudan hedef öğeye götürüp alanı açın/vurgulayın.
3. Çöp sıralama state'ini tek kaynaktan yönetin.
4. Sistem öğelerini seçim ve geçersiz eylemlerden UI düzeyinde koruyun.
5. Create modal kayıtlarını await edin; yükleniyor/disabled durum ve hata mesajı
   ekleyin.
6. Çeviri anahtarı ve tür türetme kusurlarını giderin.
7. Ebeveyn `updated_at` politikasını ürün kararıyla netleştirin.
8. Özel sıralamada tipler arası hareketi ya engelleyin ya da gerçekten destekleyin.

Başarı ölçütü: bütün kullanıcı eylemleri deterministik hedefe gider; DB hataları
modalı sessizce kapatmaz; başlıkta gösterilen sıra ile liste/tarih aynı kipi kullanır.

### Aşama 3 — performans ve ölçek

1. Repository katmanına filtreli ve toplu SQL sorguları ekleyin.
2. `parent_id + deleted_at` gibi erişim desenlerine göre indeks tasarlayın ve
   `EXPLAIN QUERY PLAN` ile ölçün.
3. Sistem öğesi görünürlüğünü correlated query/aggregate ile tek turda hesaplayın.
4. Toplu `sort_index` güncellemelerini transaction/prepared statement ile yapın.
5. Renk tercihlerini context'te tutup her sıralamadaki AsyncStorage okumalarını
   kaldırın.
6. Arama için normalize edilmiş düz metin kolonu ve SQLite FTS5 değerlendirin;
   küçük veri setinde en azından debounce + SQL LIMIT kullanın.
7. Büyük listelerde sayfalama/virtualization ayarlarını ve tek ortak zaman ticker'ını
   ölçün.

Başarı ölçütü: örneğin 10.000 öğelik sentetik veri setinde arama ve klasör açılış
süreleri için bütçe tanımlanır ve CI/performance testinde takip edilir.

### Aşama 4 — sürdürülebilir mimari

Önerilen sınırlar:

```text
screens/components
        ↓
feature hooks veya view-model'ler
        ↓
services (iş kuralları, transaction sınırı)
        ↓
repositories (SQL ve satır eşleme)
        ↓
database manager + migrations
```

- Ekranlardan doğrudan SQL'i kaldırın.
- Öğeler için sabit stringler yerine merkezi type tanımları kullanın.
- JSDoc ile başlayın veya kademeli TypeScript geçişi yapın.
- ESLint, Prettier, test runner ve CI kalite kapısı ekleyin.
- UI bileşenlerine erişilebilirlik label/role/state ekleyin.
- Hata sınıfları (`ValidationError`, `ConflictError`, `ImportError`) ve kullanıcıya
  dönüşüm katmanı tanımlayın.

## Hızlı kazanımlar

Bir veya iki küçük PR ile yapılabilecekler:

- Eksik/yanlış çeviri anahtarlarını düzeltmek.
- `CreateModal` için açık `itemType` prop'u kullanmak.
- `renderersProps` yazımını doğrulayıp düzeltmek.
- `DeletedScreen` içinde `loadDeletedSortMode()` kullanmak ve `ListButton`a etkin
  tarih kipini prop olarak vermek.
- `handleSort` tercihlerini yalnız renk kipinde okumak.
- Arama input'una 150–250 ms debounce koymak ve HTML'i düz metne çevirmek.
- Kullanılmayan import/yardımcıları temizlemek.
- `npm run lint`, `npm test` ve en az bir CI workflow'u eklemek.

## Ürüne eklenebilecek özellikler

### Öğrenme odaklı

- Kartlardan gerçek çalışma modu: soru/cevap görünümü.
- Aralıklı tekrar (SM-2/FSRS gibi) ve günlük çalışma kuyruğu.
- Kart/alan şablonları: “kelime”, “tarih olayı”, “formül”, “sanat eseri”.
- Ses kaydı, telaffuz ve text-to-speech.
- Hatırlatıcı ve çalışma serisi.
- Quiz üretimi ve yanlış cevap geçmişi.

Bu özellikler eklenmeden önce ürünün “bilgi düzenleyici” mi “öğrenme/tekrar aracı” mı
olacağı netleştirilmelidir; tekrar motoru veri modelini ciddi biçimde genişletir.

### Düzenleme ve keşif

- Ağaç görünümü ve daraltılabilir yan/hızlı navigasyon.
- Etiketler, favoriler, arşiv ve akıllı filtreler.
- Klasör/kart bağlantıları ve ilişkili öğeler.
- Gelişmiş arama: tip, renk, tarih, klasör kapsamı ve eşleşme vurgusu.
- Son kullanılanlar ve hızlı erişim.
- Toplu yeniden adlandırma / renk değiştirme için geri al.
- İçerik dışa aktarma: Markdown, JSON, CSV ve okunabilir PDF.

### Güven ve taşınabilirlik

- Yedek manifesti: uygulama sürümü, şema sürümü, oluşturulma zamanı, checksum.
- Otomatik yerel yedek rotasyonu ve kullanıcı tarafından geri dönüş.
- İsteğe bağlı şifreli yedek.
- Cihazlar arası eşitleme; önce conflict modeli ve offline-first strateji tasarlanmalı.
- İçe aktarmadan önce içerik özeti ve kullanıcı onayı.

### Deneyim ve erişilebilirlik

- Sistem yazı boyutu desteği ve responsive modal/editor.
- Ekran okuyucu açıklamaları, odak sırası ve daha geniş dokunma alanları.
- Sistem açık/koyu teması, özel vurgu rengi ve yüksek kontrast modu.
- Kullanıcıya özel renkler; yalnız sabit palete bağlı olmama.
- Onboarding ve örnek bir konu/kart.
- İşlem sonrası kısa geri alma (undo snackbar).

## Ölçmeden yapılmaması gereken optimizasyonlar

- Tüm state'i global store'a taşımak küçük uygulamada gereksiz karmaşıklık yaratabilir.
- FTS, veri büyüklüğü küçükse önce basit SQL + debounce ölçümünden sonra seçilmelidir.
- Her bileşene `memo` eklemek yerine React Profiler ile pahalı render'lar bulunmalıdır.
- Native klasörü elle optimize etmek yerine önce managed/prebuild yayın stratejisi
  kesinleştirilmelidir.

## Karar kayıtları için öneri

`docs/adr/` altında kısa Architecture Decision Record dosyaları tutulabilir. İlk
adaylar:

1. Bilgi düzenleyici mi, tekrar motoru mu?
2. Managed Expo mu, izlenen native proje mi?
3. Yumuşak silmede çocuklar da işaretlenecek mi?
4. Ebeveyn `updated_at` çocuk değişiminde güncellenecek mi?
5. Arama için FTS mi, normalize SQL mi?
6. Bulut eşitleme ve conflict çözüm modeli ne olacak?

