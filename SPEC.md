# Wesele Upload – Specyfikacja

Wersja: 1.0 | Data: 2026-06-11 | Deadline produkcyjny: wesele za ~7 dni (testy muszą zakończyć się min. 2 dni przed)

## 1. Cel

Goście weselni (ok. 50 osób, Android i iPhone) robią zdjęcia i filmy telefonami. Chcemy zebrać **oryginalne pliki** (bez kompresji) na prywatny Google Drive organizatora (Bartosz), bez instalowania aplikacji, bez logowania, bez kosztów.

Flow z perspektywy gościa: skanuje QR ze ściany sali → otwiera się strona w przeglądarce → wpisuje imię → wybiera zdjęcia/filmy z galerii → wysyła → widzi potwierdzenie.

Kryterium sukcesu: po weselu na Drive są oryginały od większości gości, posegregowane po imionach, bez ani jednego telefonu do Bartosza z pytaniem "jak to wysłać".

Dziś: brak procesu – zdjęcia giną w Messengerze/WhatsAppie skompresowane albo nie docierają wcale.

## 2. Użytkownicy i role

- **Gość** (anonimowy, bez konta): otwiera link, podaje imię, wysyła pliki. Telefon, przeglądarka mobilna (Safari iOS, Chrome Android). Sieć: LTE/Wi-Fi na sali, często słabe.
- **Organizator** (Bartosz): właściciel Drive i Apps Script. Odbiera pliki, nie używa frontendu.

Brak ról, brak uprawnień, brak paneli admina. Dane wrażliwe: zdjęcia prywatne osób – patrz sekcja 6 (bezpieczeństwo).

## 3. User stories

1. Jako gość chcę zeskanować QR i od razu wysłać zdjęcia, żeby nie instalować niczego i nie zakładać konta.
2. Jako gość chcę wybrać wiele plików naraz (zdjęcia i filmy), żeby nie klikać 100 razy.
3. Jako gość chcę widzieć postęp wysyłki ("12 z 40 plików"), żeby wiedzieć, czy mogę schować telefon.
4. Jako gość chcę, żeby zerwanie sieci nie kasowało postępu – wysyłka wznawia się sama.
5. Jako gość chcę móc dosłać pliki później z domu (ten sam link/QR działa po weselu).
6. Jako organizator chcę pliki posegregowane w podfolderach po imieniu nadawcy.
7. Jako organizator chcę dostać oryginały (pełna rozdzielczość, oryginalne nazwy plików zachowane lub odtworzone).

## 4. Model danych (półformalny)

Brak bazy danych. "Modelem danych" jest struktura folderów na Google Drive:

```
Wesele [Imiona Pary] /          ← folder główny, ID w konfiguracji Apps Script
  ├── Kasia/                    ← podfolder = imię podane przez gościa
  │     ├── IMG_1234.jpg
  │     └── VID_5678.mp4
  ├── Tomek/
  └── Gość/                     ← gdy imię puste
```

Plik: oryginalna nazwa z telefonu; przy konflikcie nazw Drive dopuszcza duplikaty nazw – nie nadpisywać, nie zmieniać nazw.
Imię gościa: tekst, trim, max 50 znaków, sanityzacja znaków niedozwolonych w nazwie folderu. Podfolder tworzony przy pierwszym pliku, reużywany przy kolejnych (case-insensitive match).

## 5. Ekrany i flow

Jedna strona, trzy stany:

**Stan 1 – start:** tytuł ("Zdjęcia z wesela Kasi i Tomka" – konfigurowalny), pole "Twoje imię", duży przycisk "Wybierz zdjęcia i filmy" (input file, multiple, accept image/*,video/*). Dopisek: "Duże filmy możesz dosłać po weselu z domowego Wi-Fi – ten sam kod QR".

**Stan 2 – wysyłka:** lista/licznik plików, pasek postępu zbiorczy ("12 z 40 plików, 230 MB z 1,1 GB") + status bieżącego pliku. Przycisk "Wstrzymaj" zbędny w MVP. Strona musi działać przy zablokowanym ekranie najlepiej jak się da (realnie: komunikat "Nie blokuj ekranu podczas wysyłki").

**Stan 3 – potwierdzenie:** "Dziękujemy! Wysłano 40 plików." + przycisk "Dodaj więcej" (wraca do stanu 1 z zachowanym imieniem).

**Design (wymaganie wysokiej rangi):** strona ma wyglądać jak topowa strona ślubna, nie jak formularz. Konkretnie:
- Estetyka weselna: elegancka, ciepła, romantyczna – kierunek do wyboru przez frontend-design skill (np. klasyczna serif + dużo światła + delikatne złoto/zieleń), byle spójny i odważny, nie generyczny.
- 1–3 zdjęcia młodej pary jako dekoracja (hero/tło) – organizator dostarczy oryginały, w repo lądują **wersje zoptymalizowane do weba** (łącznie max ~600 KB, format WebP/AVIF z fallbackiem).
- Subtelne animacje (CSS: fade-in, delikatny parallax/zoom zdjęcia) – bez ciężkich bibliotek JS.
- Budżet wydajności nadrzędny wobec dekoracji: pierwszy render <3 s na LTE. Piękno nie może spowolnić uploadu ani startu.
- Jeden ekran mobilny, duże dotykalne elementy, czytelne dla osób 60+. Bez galerii, bez podglądu wysłanych, bez listy plików innych gości.

**Ekran dodatkowy – plakat QR (`plakat.html`):** osobna strona do wydruku A4 (CSS print), w tej samej estetyce co strona główna. Zawartość: imiona pary i data, duży kod QR (wygenerowany lokalnie w build/kodzie lub wklejony jako obrazek), nagłówek typu "Podziel się z nami swoimi zdjęciami!", instrukcja w 3 krokach (1. Zeskanuj kod aparatem, 2. Wpisz swoje imię, 3. Wybierz zdjęcia i filmy – wyślą się w oryginalnej jakości), dopisek "Działa też po weselu – duże filmy możesz dosłać z domu". Organizator drukuje prosto z przeglądarki (Ctrl+P).

## 6. Reguły biznesowe

- Zero logowania i zero instalacji po stronie gościa.
- Oryginały: żadnej kompresji/resize po stronie frontu.
- **Bezpieczeństwo (decyzja kluczowa):** żaden token OAuth nie trafia do przeglądarki gościa. Frontend wywołuje Apps Script (`initUpload`: imię, nazwa pliku, mimeType, rozmiar), Apps Script **po stronie serwera** otwiera sesję resumable upload w Google Drive API (uploadType=resumable, plik w odpowiednim podfolderze) i zwraca frontendowi wyłącznie URL sesji. Ten URL pozwala tylko na dosłanie bajtów tego jednego pliku – nic więcej.
- Jedna ścieżka uploadu dla wszystkich plików (zdjęcia i filmy) – resumable, chunki po 8–16 MB (wielokrotność 256 KB, wymóg Drive API).
- Limit: 2 GB na pojedynczy plik (walidacja na froncie + odmowa w Apps Script). Bez limitu liczby plików.
- Link aktywny min. 2 tygodnie po weselu (czyli: po prostu nie wyłączamy deploymentu).
- Pliki wysyłane sekwencyjnie (1 naraz) lub max 2 równolegle – nie zarzynać LTE gościa.

## 7. Edge cases

- **Zerwanie sieci w trakcie chunka:** retry z backoffem; zapytanie o status sesji (PUT z `Content-Range: bytes */total`, odpowiedź 308 z nagłówkiem Range) i wznowienie od ostatniego potwierdzonego bajta.
- **Wygaśnięcie sesji uploadu** (URL sesji żyje ~tydzień, ale może paść): poproś Apps Script o nową sesję dla tego pliku, zacznij plik od zera, reszta kolejki nietknięta.
- **Gość zamyka przeglądarkę w połowie:** pliki już wysłane zostają na Drive; po powrocie zaczyna od nowa z pozostałymi (bez pamięci stanu w MVP – za drogie w budowie na ten deadline).
- **Puste imię:** folder "Gość".
- **Imię z emoji/slashem:** sanityzacja do bezpiecznej nazwy folderu.
- **Plik 0 bajtów / nieobsługiwany typ:** pomiń, pokaż w podsumowaniu "pominięto 1 plik".
- **Plik >2 GB:** komunikat przy wyborze, plik wykluczony z kolejki, reszta idzie.
- **Równoczesność:** 50 gości → szczytowo kilkanaście osób naraz. Apps Script obsługuje tylko krótkie wywołania `initUpload` (ułamek sekundy), transfer idzie bezpośrednio do Drive – limit 30 równoczesnych wykonań Apps Script niezagrożony. Limit URL Fetch 20 000/dzień: max realny to ~5 000 plików/dzień – bezpiecznie.
- **Brak miejsca na Drive organizatora:** Apps Script przy `initUpload` może zwrócić błąd – frontend pokazuje "Spróbuj później". (Przed weselem: sprawdzić wolne ~50 GB.)

## 8. Integracje

- **Google Drive API v3** – resumable upload (sesja otwierana przez Apps Script, chunki PUT-owane z przeglądarki bezpośrednio na URL sesji; endpoint wspiera CORS).
- **Google Apps Script** – web app (deploy: "Execute as: Me", "Who has access: Anyone"), JSON API: `initUpload`. Scope manifestu ograniczony do minimum (`drive` lub `drive.file` – Claude Code: zweryfikuj, który scope wystarcza do tworzenia sesji w folderze utworzonym ręcznie przez właściciela; jeśli `drive.file` nie obejmie ręcznie utworzonego folderu, folder główny tworzy sam skrypt przy pierwszym uruchomieniu).
- **GitHub Pages** – hosting statycznego frontu (HTTPS wymagany i zapewniony).
- **QR:** kod QR generowany do `plakat.html` (statycznie – wygenerowany raz i osadzony jako obrazek/SVG w repo; bez zewnętrznych runtime'owych zależności na stronie gościa).

## 9. Backup i odzyskiwanie

- Dane docelowe leżą od razu na Google Drive organizatora – Drive jest backupem samym w sobie.
- Po weselu: organizator robi kopię folderu (np. download .zip lub kopia na drugi dysk) przed jakimkolwiek porządkowaniem.
- Kod: repozytorium GitHub (frontend) + plik .gs trzymany również w repo (kopia źródła Apps Script).
- Nic do odtwarzania poza tym – brak bazy, brak stanu serwera.

## 10. Poza zakresem (na start)

- Wspólna galeria dla gości (po weselu: link do albumu Google Photos wysłany ręcznie).
- Panel organizatora, statystyki, moderacja.
- Pamięć stanu kolejki po zamknięciu przeglądarki.
- Kompresja/transkodowanie, generowanie miniatur.
- Wielojęzyczność (tylko PL).
- Limity per gość, captcha, rate limiting (ryzyko nadużycia linku znikome i akceptowane; URL nieindeksowany).

## 11. Kryteria akceptacji MVP

1. iPhone (Safari) i Android (Chrome): gość wybiera 20 zdjęć + 1 film 100 MB i wszystko ląduje na Drive w `Wesele.../[Imię]/` jako oryginały (rozmiar pliku identyczny co w telefonie).
2. Wyłączenie Wi-Fi w trakcie filmu i włączenie po 30 s → upload dokańcza się bez utraty postępu.
3. Pusta nazwa → folder "Gość". Dwóch gości "Kasia" → wspólny folder "Kasia".
4. Plik 2,5 GB → czytelny komunikat odmowy, pozostałe pliki wysłane.
5. W kodzie frontu i w ruchu sieciowym przeglądarki nie występuje żaden token OAuth.
6. Strona ładuje się <3 s na LTE i jest obsługiwalna jedną ręką.
7. Strona ma spójny, dopracowany design weselny ze zdjęciami pary – test "pokaż 3 osobom": reakcja "wow, kto wam to robił?", nie "aha, formularz".
8. `plakat.html` drukuje się poprawnie na A4 (QR skanowalny z 2 m, instrukcja czytelna).

## 12. Estymacja kosztów

- Budowa: 1 sesja Claude Code (2–4 h) + ~2 h testów organizatora na 2–3 telefonach.
- Koszty stałe: 0 zł/msc (GitHub Pages free, Apps Script free, Drive – istniejące miejsce; potrzebne ~50 GB wolnego).
- Koszty jednorazowe: 0 zł (+ wydruk QR).
- Alternatywa rynkowa: serwisy eventowe ~200–400 zł/event – własne narzędzie zwraca się od pierwszego użycia i jest reużywalne na kolejne imprezy.
