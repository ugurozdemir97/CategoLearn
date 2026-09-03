# Mimari ve veri akışı

## Teknoloji özeti

| Alan | Teknoloji / yaklaşım |
|---|---|
| Uygulama | Expo SDK 54, React Native 0.81, React 19 |
| Dil | JavaScript + JSX; TypeScript yok |
| Navigasyon | React Navigation native stack |
| Kalıcı ana veri | `expo-sqlite` ile `app.db` |
| Tercihler | AsyncStorage |
| Zengin metin | Pell Rich Editor + WebView; görüntüleme için Render HTML |
| Sürükle-bırak | React Native Draggable FlatList + Gesture Handler/Reanimated |
| Yerelleştirme | i18next, react-i18next, expo-localization |
| Dosya paylaşımı | expo-file-system, document-picker, sharing |
| Android çalışma zamanı | Hermes, New Architecture, edge-to-edge |

## Başlangıç sırası

```text
index.js
└── registerRootComponent(App)
    ├── setupDatabase()
    │   ├── folders tablosu + indeks
    │   ├── cards tablosu + indeks
    │   ├── fields tablosu + indeks
    │   └── sistem geri yükleme öğelerini garanti et
    ├── yükleniyor/hata ekranı
    └── sağlayıcı ağacı
        └── ThemeProvider
            └── LanguageProvider
                └── SafeAreaProvider
                    └── SortModeProvider
                        └── ClipboardProvider
                            └── StackNavigator
```

Veritabanı kurulmadan ana navigasyon render edilmez. Başlangıç hataları özel hata
ekranına düşer. Ancak şema kurulumu “CREATE IF NOT EXISTS” seviyesindedir; mevcut
tablolara sürüm bazlı göç uygulanmaz.

## Katmanlar

### Görünüm katmanı

`screens/` ve `components/`, kullanıcı etkileşimi ve render işleminden sorumludur.
Ekranlar aynı zamanda doğrudan veri sorgusu ve iş kuralı çağırır. Ayrı bir
controller/view-model katmanı yoktur.

### Paylaşılan istemci durumu

- `ThemeContext`: etkin tema ve renk tokenları.
- `LanguageContext`: dil seçimi ve i18next değişimi.
- `SortModeContext`: normal ve çöp ekranı sıralama kipleri.
- `ClipboardContext`: kes/kopyala panosu ile görsel durum işaretleri.
- `useSelection`: ekran yerelindeki çoklu seçim.
- `useModalStates`: oluşturma, silme, renk ve bilgi pencerelerinin durumu.
- `useCustomSort`: sürükleme durumu ve `sort_index` kaydı.

Tema, dil ve sıra tercihlerinin bir kısmı hem context hem AsyncStorage'da bulunur.
Liste verisi global durumda tutulmaz; her ekran odaklandığında SQLite'tan yeniden
okunur.

### Veri erişim katmanı

- `database/db.js`, uygulama modülü yüklenirken tek bir senkron veritabanı nesnesi
  açar ve asenkron sorgu metotlarını dışa verir.
- `database/queries.js`, klasör/kart/alan CRUD işlemlerini, kopyalama, taşıma,
  yumuşak silme ve geri yüklemeyi toplar.
- Bazı ekranlar ve `useCustomSort` bu katmanı atlayıp `db` üzerinde doğrudan SQL
  çalıştırır.
- Çok adımlı işlemlerde transaction kullanılmaz.

## Navigasyon modeli

Stack header'ları kapalıdır; uygulama kendi üst ve alt çubuklarını kullanır.
Klasör ve kart ekranlarına tüm nesne ile `path` dizisi route parametresi olarak
aktarılır. Bu yaklaşım hızlıdır ancak parametre içindeki `name`, `created_at` ve
`updated_at` değerlerinin veritabanına göre eskimesine neden olabilir.

`FolderScreen`, alt klasöre geçerken yeni ekran açmak yerine aynı ekranın route
parametrelerini değiştirir. Android geri tuşu `path` dizisini kısaltarak üst klasöre
döner. Breadcrumb doğrudan istenen ata gider. `CardDetailScreen` breadcrumb ile
yeniden `Folder` ekranına geçer.

## Okuma veri akışı

```text
Ekran odağı / route değişikliği
        ↓
getFolders / getCards / getFields veya doğrudan SQL
        ↓
handleSort (AsyncStorage'dan renk tercihini de okur)
        ↓
ekranın yerel state'i
        ↓
FlatList / DraggableFlatList / ListButton
```

`handleSort` her çağrıda renk sırası ve renk içi sıra tercihini AsyncStorage'dan
okur; seçilen kip renk olmasa bile bu iki okuma gerçekleşir. Sonuçlar tip bazında
ayrılır ve klasör → kart → alan sırasında birleştirilir.

## Yazma veri akışı

```text
Kullanıcı eylemi
  ↓
Ekran handler'ı / FooterBar
  ↓
doğrulama ve çakışma kontrolü
  ↓
queries.js içindeki bir veya daha çok SQL işlemi
  ↓
modal/seçim durumunu temizle
  ↓
listeyi yeniden yükle ve sırala
```

Oluşturma penceresi adları kırpar ve 1–50 karakter aralığını denetler. Arayüz
çakışma sorgusu yaptıktan sonra yazma işlemini çağırır; son savunma olarak kısmi
unique indeksler vardır. Hataların çoğu ekran seviyesinde `try/catch` ile
yakalanmadığı için beklenmeyen SQL hataları kullanıcıya tutarlı biçimde gösterilmez.

## Durumun kalıcılığı

| Veri | Konum | Uygulama yeniden başlayınca |
|---|---|---|
| Klasör, kart, alan | SQLite `app.db` | Korunur |
| Tema | AsyncStorage `app_theme` | Korunur |
| Dil | AsyncStorage `app_language` | Korunur |
| Normal/çöp sıra kipi | AsyncStorage | Korunur |
| Renk sırası ve ikincil kip | AsyncStorage | Korunur |
| Kes/kopyala panosu | React context | Kaybolur |
| Seçim, açık alan, modal | Ekran state'i | Kaybolur |

## Mimari güçlü yönler

- Küçük bir uygulama için dosya sorumlulukları genel olarak okunabilir.
- Tekrarlanan seçim, modal, özel sıra ve alt menü davranışları hook/utility olarak
  ayrılmıştır.
- Ekranlar veritabanı hazır olmadan açılmaz.
- Yerel veri modeli ağ bağlantısına bağlı değildir.
- Sistem geri yükleme hedefleri, ebeveyni kayıp öğelerin kullanıcı verisinden
  tamamen kopmasını önlemeyi amaçlar.

## Mimari gerilimler

- UI, iş kuralları ve SQL sınırları geçirgendir; aynı kural hem modalda hem sorgu
  katmanında farklı ölçüde uygulanır.
- Route parametrelerinde tam nesne taşınması ve ebeveyn zamanlarının otomatik
  güncellenmemesi “son düzenleme” bilgisini güvenilmez kılabilir.
- Çok adımlı işlemler atomik değildir.
- Veritabanı bağlantısının içe aktarım sırasında kapatılıp uygulama ömrü boyunca
  yeniden oluşturulmaması özel bir yaşam döngüsü problemidir.

