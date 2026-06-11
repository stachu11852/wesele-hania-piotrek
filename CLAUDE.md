# CLAUDE.md – Wesele Upload (v1)

Kontekst dla Claude Code. Specyfikacja produktowa: `SPEC.md` w tym samym folderze – to źródło prawdy.

## Co budujemy

Strona do zbierania oryginalnych zdjęć/filmów od ~50 gości weselnych na prywatny Google Drive właściciela. Bez logowania gości, bez instalacji, koszt 0 zł. Deadline: produkcja gotowa i przetestowana w ~5 dni.

## Stack

- **Frontend:** czysty HTML + CSS + vanilla JS (`index.html` + `app.js` + `style.css` + `plakat.html`). Bez frameworków, bez bundlera, bez npm – nie ma czego utrzymywać.
- **Design:** użyj skilla **frontend-design** (oficjalny Anthropic; instalacja: `npx -y skills add anthropics/skills --skill frontend-design` lub przez `/plugin`). Estetyka weselna wg SPEC sekcja 5: odważny, spójny kierunek, nie generyczny. Zdjęcia pary: oryginały od właściciela → zoptymalizowane wersje WebP/AVIF w `assets/` (łącznie ~600 KB). Budżet: pierwszy render <3 s na LTE – wydajność nadrzędna wobec dekoracji.
- **Backend:** Google Apps Script web app (`Code.gs` + `appsscript.json` w repo jako kopia źródła). Jedna funkcja API: `initUpload`.
- **Magazyn:** Google Drive właściciela (konto prywatne Bartosza). Folder główny – ID w stałej konfiguracyjnej skryptu.
- **Hosting frontu:** GitHub Pages (branch `main`, katalog `/docs` lub root – wybierz prościej).

## Architektura uploadu (decyzja nienegocjowalna)

1. Front → Apps Script `doPost` (`action: "initUpload"`, payload: imię, fileName, mimeType, size).
2. Apps Script waliduje (size ≤ 2 GB), znajduje/tworzy podfolder `[Imię]`, otwiera **resumable upload session** w Drive API v3 (`UrlFetchApp` z `ScriptApp.getOAuthToken()`, header `X-Upload-Content-*`), zwraca frontowi sam **URL sesji**.
3. Front PUT-uje chunki (8–16 MB, wielokrotność 256 KB) bezpośrednio na URL sesji. Retry + wznowienie po 308/`Content-Range: bytes */total`.
4. **Token OAuth nigdy nie opuszcza Apps Script.** Żadnych tokenów w przeglądarce – to kryterium akceptacji nr 5.

Pliki sekwencyjnie lub max 2 równolegle.

## Konfiguracja / "env vars"

Brak .env (statyczny front). Konfiguracja:
- `app.js`: stała `SCRIPT_URL` (URL deploymentu Apps Script) + `EVENT_TITLE` (np. "Wesele Kasi i Tomka").
- `Code.gs`: stała `ROOT_FOLDER_ID` (folder na Drive), `MAX_FILE_SIZE`.
- Sekretów brak – URL Apps Script jest z założenia publiczny.

## Uruchomienie i deploy

**Apps Script:**
1. script.new → wklej `Code.gs` + manifest `appsscript.json` (minimalne scopes – zweryfikuj czy `https://www.googleapis.com/auth/drive` jest konieczny, preferuj węższy jeśli działa z ręcznie utworzonym folderem).
2. Deploy → New deployment → Web app → Execute as: **Me**, Access: **Anyone**.
3. Skopiuj URL do `SCRIPT_URL` we froncie.
4. Każda zmiana kodu = **nowy deployment lub aktualizacja istniejącego** (URL przy "Manage deployments → edit" zostaje ten sam – używaj tego, nie twórz nowych URL-i).

**Frontend:**
1. Repo GitHub (public), kod w root lub `/docs`.
2. Settings → Pages → Deploy from branch `main`. Możesz to zrobić przez `gh` CLI (`gh repo create`, `gh api` dla Pages) – właściciel ma konto GitHub.
3. URL strony = treść kodu QR (QR poza zakresem kodu).

**Test lokalny frontu:** `python -m http.server` i otwarcie z telefona w tej samej sieci – CORS do Apps Script i Drive działa z dowolnego originu.

## Backup

Dane lądują bezpośrednio na Drive (Drive = magazyn docelowy i backup). Kod w repo GitHub, w tym kopia `Code.gs`. Nic więcej.

## Decyzje techniczne (zapadłe – nie otwieraj ponownie)

1. Jedna ścieżka uploadu (resumable) dla zdjęć i filmów – bez rozgałęzienia mały/duży plik.
2. Zero tokenów w przeglądarce – sesję otwiera serwer (Apps Script).
3. Vanilla JS, bez frameworków – deadline i utrzymanie.
4. Brak bazy danych i brak stanu serwera – struktura folderów Drive to całość "modelu danych".
5. Brak pamięci kolejki po zamknięciu karty (poza zakresem MVP).
6. Limit 2 GB/plik, bez limitu liczby plików.
7. UI po polsku, jeden ekran, trzy stany (start / wysyłka / podziękowanie).
8. Design: topowy poziom wizualny (frontend-design skill), zdjęcia pary zoptymalizowane do weba, animacje tylko CSS – budżet <3 s pierwszego renderu na LTE jest nadrzędny.
9. `plakat.html` (druk A4, CSS print) z osadzonym QR i instrukcją 3-krokową – część MVP, ta sama estetyka co strona.

## Konwencje i struktura katalogów

Do uzupełnienia w v2 po pierwszym sprincie – zaproponuj strukturę przy inicjalizacji projektu, nie wymyślamy jej tu z góry.

## Znane ryzyka do zweryfikowania w implementacji

- Scope manifestu: czy `drive.file` pozwoli pisać do ręcznie utworzonego folderu (prawdopodobnie nie → wtedy folder główny tworzy skrypt, ID zapisuje w `PropertiesService`, a właściciel dostaje link; albo świadomie pełny scope `drive` – wybierz i uzasadnij w komentarzu).
- CORS na `doPost` Apps Script: wysyłaj z frontu jako `Content-Type: text/plain` z JSON w body (standardowy trik unikający preflight, którego Apps Script nie obsługuje).
- Safari iOS: wybór wielu plików z galerii i zachowanie przy uśpieniu ekranu – przetestować realnie, dodać komunikat "nie blokuj ekranu".
