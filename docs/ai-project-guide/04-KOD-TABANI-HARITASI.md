# Kod tabanı haritası

## Kök dosyalar

| Dosya | Sorumluluk |
|---|---|
| `index.js` | Expo kök bileşen kaydı |
| `App.js` | DB başlangıcı, yükleme/hata dalları ve context ağacı |
| `package.json` | Çalıştırma komutları ve bağımlılıklar |
| `package-lock.json` | Kilitli npm bağımlılık ağacı |
| `app.json` | Expo kimliği, Android/iOS seçenekleri ve build-properties |
| `eas.json` | Yerel sürüm kaynağı ve Android preview APK profili |
| `babel.config.js` | Expo Babel preset'i ve Reanimated eklentisi |
| `README.md` | Ürün fikri, ana özellikler ve kaba durum bilgisi |
| `.gitignore` | `android/` ve `ios/` dahil üretilen/yerel çıktıları dışlar |
| `.easignore` | EAS yüklemesinden çıkarılacak dosyalar; `android/` burada dışlanmamış |

## `navigation/`

- `StackNavigator.js`: `Home`, `Folder`, `CardDetail`, `Settings`, `Search` ve
  `Deleted` route'larını tanımlar. Native başlıklar kapalıdır.

## `screens/`

- `HomeScreen.js`: kök klasör CRUD'u, seçim, sıra, renk ve alt menü.
- `FolderScreen.js`: klasör/kart birleşik listesi, breadcrumb, kart alanlarını
  oluşturma penceresinden topluca eşitleme.
- `CardDetailScreen.js`: alan CRUD'u, zengin içerik aç/kapat ve özel sıra.
- `SearchScreen.js`: tüm etkin satırları belleğe yükler, ad/HTML içeriğinde filtreler
  ve sonuçtan hedef konuma gider.
- `DeletedScreen.js`: silinen satırların birleşik listesi, geri yükleme ve kalıcı
  silme.
- `SettingScreen.js`: renk önceliği, renk içi sıra, tema, dil ve DB import/export.
- `ErrorScreens/DatabaseLoadingScreen.js`: başlangıç yükleme durumu.
- `ErrorScreens/DatabaseErrorScreen.js`: başlangıç veritabanı hata durumu.

## `database/`

- `db.js`: `app.db` bağlantısını modül düzeyinde açar; `executeSql` yardımcısı şu
  anda diğer kod tarafından kullanılmaz.
- `schema.js`: üç tabloyu, üç unique indeksi ve iki sistem öğesini oluşturur.
- `queries.js`: CRUD, taşıma, derin kopyalama, yumuşak/kalıcı silme ve geri yükleme
  işlevleri.
- `exportDb.js`: veritabanı dosyasının konumunu bulur; paylaşım ve içe alma akışını
  yürütür. `Platform` import'u kullanılmaz.

## `context/`

- `ThemeContext.js`: tema adı/renkleri ve kalıcı tema değişimi.
- `LanguageContext.js`: cihaz dili, kullanıcı tercihi ve i18next değişimi.
- `SortModeContext.js`: normal ve çöp ekranı için iki sıra state'i.
- `ClipboardContext.js`: kes/kopyala öğeleri ve liste görsel durumları.

## `hooks/`

- `useSelection.js`: tip + kimlik birleşimiyle çoklu seçim.
- `useModalStates.js`: dört modalın ortak state ve aç/kapat işlevleri.
- `useCustomSort.js`: sürükleme, oklarla taşıma ve tabloya `sort_index` yazma.

## `utils/`

- `validation.js`: ad kırpma ve 1–50 karakter kontrolü.
- `handleSort.js`: beş normal, beş çöp sıra kipinin istemci tarafı uygulaması.
- `handleFooterActions.js`: silme onayı, düzenleme hazırlığı, pano ve yapıştırma
  kuralları.
- `formatTime.js`: göreli zaman / saat / gün biçimlendirmesi.

## `storage/`

- `themePreference.js`: `app_theme`.
- `languagePreference.js`: `app_language`.
- `sortPreference.js`: normal/çöp kipleri, renk sırası ve renk içi tercih.

## `components/Navigation/`

- `HeaderBar.js`: sıra kipini döndürür; seçim ve özel sıra modlarını gösterir.
- `FooterBar.js`: arama/ayarlar/çöp/pano ve toplu işlem eylemleri.
- `BreadCrumb.js`: yatay kaydırılabilir hiyerarşi yolu.

## `components/Buttons/`

- `ListButton.js`: normal öğe satırı, renk şeridi, tarih, seçim/pano durumu ve
  alan genişletme oku.
- `DraggableListButton.js`: öğe veya renk sıralama satırı.
- `CircleButton.js`: oluştur/düzenle kayan daire düğmesi.
- `RadioButton.js`: ayar seçenekleri.

## `components/Modals/`

- `CreateModal.js`: klasör, kart ve alan için ortak oluşturma/düzenleme formu;
  kart içi dinamik alan listesi.
- `ColorModal.js`: sabit renk paleti.
- `ConfirmationModal.js`: iki eylemli genel onay penceresi.
- `InformationModal.js`: bilgi/hata mesajı; `useModalStates` ile kuyruklanabilir.

## `components/Editor/`

- `RichTextEditor.js`: WebView tabanlı HTML düzenleyici ve biçim araçları.
- `RichTextDisplay.js`: saklanan HTML'i tema stilleriyle render eder.

## `components/Blocks/`

- `DateDisplay.js`: dakikada bir yenilenen göreli tarih.
- `ScrollingText.js`: uzun tek satırlı başlıkları animasyonla kaydırır.
- `FooterButton.js`: ikon + etiket alt menü düğmesi.
- `HeaderMode.js`: seçim/özel sıra iptal ve onay başlığı.
- `SettingsTitle.js`: ayar bölümü başlığı/açıklaması.

## `language/` ve `styles/`

- `language/i18n.js`: İngilizce fallback ile i18next kurulumu.
- `language/locales/en.json`, `tr.json`: aynı anahtar yapısındaki iki sözlük.
- `styles/colors.js`: dokuz tema ve semantik renk tokenları.
- `styles/styles.js`: uygulama genelindeki React Native stilleri.

## `assets/`

Uygulama ikonu, adaptive ikon ve splash görseli bulunur. Kod incelemesinde bitmap
görsellerin tasarım içeriği değerlendirilmemiş, yalnızca yapılandırma referansları
kontrol edilmiştir.

## Yerel `android/` klasörü

Android klasörü `.gitignore` tarafından izleme dışındadır ve Expo prebuild çıktısı
niteliğindedir. Yerel kopyada Kotlin giriş sınıfları, Gradle ayarları, manifest,
ProGuard kuralları ve üretilmiş ikon/splash kaynakları vardır. Dikkat edilmesi
gerekenler:

- Hermes, New Architecture, edge-to-edge ve yalnız `arm64-v8a` etkin.
- Release build yerel Gradle dosyasında debug signing config kullanıyor.
- Manifest internet, eski harici depolama, titreşim ve system alert window izinleri
  içeriyor.
- `android/`, `.easignore` içinde olmadığı için yerel EAS yüklemesine dahil olabilir.
- `app.json` ile üretilmiş native klasör arasında drift oluşabilir; hangisinin
  yayın kaynağı olduğu netleştirilmelidir.

## Bir değişiklikte nereden başlanır?

| İhtiyaç | İlk bakılacak dosyalar |
|---|---|
| Yeni veri alanı/tablo | `database/schema.js`, `database/queries.js`, migration altyapısı |
| Klasör/kart CRUD | ilgili ekran, `CreateModal.js`, `queries.js` |
| Pano kuralı | `ClipboardContext.js`, `handleFooterActions.js` |
| Sıralama | `HeaderBar.js`, `handleSort.js`, `useCustomSort.js`, `sortPreference.js` |
| Çöp/geri yükleme | `DeletedScreen.js`, `queries.js` |
| Arama | `SearchScreen.js`, ileride FTS/repository katmanı |
| Tema | `styles/colors.js`, sabit açık/koyu ikon renkleri |
| Dil metni | iki locale JSON'u birlikte |
| Yedekleme | `exportDb.js`, şema sürümü ve DB bağlantı yaşam döngüsü |
| Android yayın | `app.json`, `eas.json`, `.easignore`, üretilmiş Gradle/manifest |

