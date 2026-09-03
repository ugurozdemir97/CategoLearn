# CategoLearn proje rehberi

Bu klasör, CategoLearn kod tabanını devralan bir geliştiricinin veya yapay zekâ
ajanının projeyi kısa sürede ve yanlış varsayımlar üretmeden tanıması için
hazırlanmıştır. Belgeler 3 Eylül 2026 tarihinde depodaki tüm izlenen JavaScript,
JSON ve Markdown dosyaları ile yerel olarak üretilmiş Android kaynakları statik
olarak incelenerek yazılmıştır.

> Bu belgeler çalışma zamanı testi yerine kod incelemesine dayanır. “Risk” olarak
> işaretlenen maddeler cihaz/emülatör testiyle yeniden doğrulanmalıdır.

## Hızlı özet

CategoLearn, internet hesabı gerektirmeden çalışan bir Expo/React Native kişisel
bilgi düzenleme uygulamasıdır. Temel veri modeli şöyledir:

```text
Konu / Klasör
└── Alt klasör (sınırsız derinlik)
    └── Kart
        └── Alan (başlık + zengin metin içerik)
```

Uygulama veriyi cihazdaki SQLite veritabanında saklar. Tema, dil ve sıralama
tercihleri AsyncStorage'da tutulur. Kullanıcı klasör, kart ve alan oluşturabilir;
öğeleri renklendirebilir, sıralayabilir, arayabilir, kesip/kopyalayıp
yapıştırabilir, çöp kutusuna gönderebilir ve geri yükleyebilir. Veritabanı dosyası
dışa veya içe aktarılabilir.

## Önerilen okuma sırası

1. [01-URUN-VE-OZELLIKLER.md](./01-URUN-VE-OZELLIKLER.md): Uygulamanın amacı,
   ekranları ve kullanıcı akışları.
2. [02-MIMARI-VE-VERI-AKISI.md](./02-MIMARI-VE-VERI-AKISI.md): Teknik yapı,
   bağımlılıklar, durum yönetimi ve veri akışı.
3. [03-VERI-MODELI-VE-YASAM-DONGUSU.md](./03-VERI-MODELI-VE-YASAM-DONGUSU.md):
   SQLite şeması, sistem öğeleri, silme/geri yükleme ve yedekleme davranışı.
4. [04-KOD-TABANI-HARITASI.md](./04-KOD-TABANI-HARITASI.md): Dosyaların
   sorumlulukları ve bir değişiklikte bakılacak yerler.
5. [05-EKSIKLER-RISKLER-TEKNIK-BORC.md](./05-EKSIKLER-RISKLER-TEKNIK-BORC.md):
   Önceliklendirilmiş sorunlar ve doğrulama notları.
6. [06-GELISTIRME-VE-OPTIMIZASYON-ONERILERI.md](./06-GELISTIRME-VE-OPTIMIZASYON-ONERILERI.md):
   Uygulanabilir yol haritası, ürün fikirleri ve performans önerileri.
7. [07-GELISTIRICI-VE-AI-CALISMA-REHBERI.md](./07-GELISTIRICI-VE-AI-CALISMA-REHBERI.md):
   Kurulum, değişiklik kontrol listeleri ve ajanlar için güvenli çalışma kuralları.

## Kaynakların güven sırası

Bir çelişki olduğunda aşağıdaki sırayı kullanın:

1. Çalışan kod ve SQLite şeması
2. `package.json`, `app.json` ve EAS/yapılandırma dosyaları
3. Bu klasördeki analiz belgeleri
4. Kök `README.md` içindeki ürün anlatımı

Kök README ürün niyetini iyi anlatır ancak “çalışıyor” dediği bir özellik için
ayrıntılı kenar durumları garanti etmez.

## Değişikliklerden sonra güncellenecek belgeler

- Yeni ekran veya ana özellik: `01`, `02` ve `04`
- Şema/sorgu değişikliği: `03`, `04` ve gerekirse `05`
- Bir risk giderildiğinde: `05` içindeki durum ve doğrulama notu
- Yol haritası kararı: `06`
- Komut, test veya yayın akışı değişikliği: `07`

