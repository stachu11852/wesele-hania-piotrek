# CLAUDE.md â€“ Wesele Upload (v2)

Kontekst dla Claude Code. Specyfikacja produktowa: `SPEC.md` w tym samym folderze â€“ to ÅºrÃ³dÅ‚o prawdy.

## Co budujemy

Strona do zbierania oryginalnych zdjÄ™Ä‡/filmÃ³w od ~50 goÅ›ci weselnych na prywatny Google Drive wÅ‚aÅ›ciciela. Bez logowania goÅ›ci, bez instalacji, koszt 0 zÅ‚. Deadline: produkcja gotowa i przetestowana w ~5 dni.

## Stack

- **Frontend:** czysty HTML + CSS + vanilla JS (`index.html` + `app.js` + `style.css` + `plakat.html`). Bez frameworkÃ³w, bez bundlera, bez npm â€“ nie ma czego utrzymywaÄ‡.
- **Design:** uÅ¼yj skilla **frontend-design** (oficjalny Anthropic; instalacja: `npx -y skills add anthropics/skills --skill frontend-design` lub przez `/plugin`). Estetyka weselna wg SPEC sekcja 5: odwaÅ¼ny, spÃ³jny kierunek, nie generyczny. ZdjÄ™cia pary: oryginaÅ‚y od wÅ‚aÅ›ciciela â†’ zoptymalizowane wersje WebP/AVIF w `assets/` (Å‚Ä…cznie ~600 KB). BudÅ¼et: pierwszy render <3 s na LTE â€“ wydajnoÅ›Ä‡ nadrzÄ™dna wobec dekoracji.
- **Backend:** Google Apps Script web app (`Code.gs` + `appsscript.json` w repo jako kopia ÅºrÃ³dÅ‚a). Jedna funkcja API: `initUpload`.
- **Magazyn:** Google Drive wÅ‚aÅ›ciciela (konto prywatne Bartosza). Folder gÅ‚Ã³wny â€“ ID w staÅ‚ej konfiguracyjnej skryptu.
- **Hosting frontu:** GitHub Pages (branch `main`, katalog `/docs` lub root â€“ wybierz proÅ›ciej).

## Architektura uploadu (decyzja nienegocjowalna)

1. Front â†’ Apps Script `doPost` (`action: "initUpload"`, payload: imiÄ™, fileName, mimeType, size).
2. Apps Script waliduje (size â‰¤ 2 GB), znajduje/tworzy podfolder `[ImiÄ™]`, otwiera **resumable upload session** w Drive API v3 (`UrlFetchApp` z `ScriptApp.getOAuthToken()`, header `X-Upload-Content-*`), zwraca frontowi sam **URL sesji**.
3. Front PUT-uje chunki (8â€“16 MB, wielokrotnoÅ›Ä‡ 256 KB) bezpoÅ›rednio na URL sesji. Retry + wznowienie po 308/`Content-Range: bytes */total`.
4. **Token OAuth nigdy nie opuszcza Apps Script.** Å»adnych tokenÃ³w w przeglÄ…darce â€“ to kryterium akceptacji nr 5.

Pliki sekwencyjnie lub max 2 rÃ³wnolegle.

## Konfiguracja / "env vars"

Brak .env (statyczny front). Konfiguracja:
- `app.js`: staÅ‚a `SCRIPT_URL` (URL deploymentu Apps Script) + `EVENT_TITLE` (np. "Wesele Kasi i Tomka").
- `Code.gs`: staÅ‚a `ROOT_FOLDER_ID` (folder na Drive), `MAX_FILE_SIZE`.
- SekretÃ³w brak â€“ URL Apps Script jest z zaÅ‚oÅ¼enia publiczny.

## Uruchomienie i deploy

**Apps Script:**
1. script.new â†’ wklej `Code.gs` + manifest `appsscript.json` (minimalne scopes â€“ zweryfikuj czy `https://www.googleapis.com/auth/drive` jest konieczny, preferuj wÄ™Å¼szy jeÅ›li dziaÅ‚a z rÄ™cznie utworzonym folderem).
2. Deploy â†’ New deployment â†’ Web app â†’ Execute as: **Me**, Access: **Anyone**.
3. Skopiuj URL do `SCRIPT_URL` we froncie.
4. KaÅ¼da zmiana kodu = **nowy deployment lub aktualizacja istniejÄ…cego** (URL przy "Manage deployments â†’ edit" zostaje ten sam â€“ uÅ¼ywaj tego, nie twÃ³rz nowych URL-i).

**Frontend:**
1. Repo GitHub (public), kod w root lub `/docs`.
2. Settings â†’ Pages â†’ Deploy from branch `main`. MoÅ¼esz to zrobiÄ‡ przez `gh` CLI (`gh repo create`, `gh api` dla Pages) â€“ wÅ‚aÅ›ciciel ma konto GitHub.
3. URL strony = treÅ›Ä‡ kodu QR (QR poza zakresem kodu).

**Test lokalny frontu:** `python -m http.server` i otwarcie z telefona w tej samej sieci â€“ CORS do Apps Script i Drive dziaÅ‚a z dowolnego originu.

## Backup

Dane lÄ…dujÄ… bezpoÅ›rednio na Drive (Drive = magazyn docelowy i backup). Kod w repo GitHub, w tym kopia `Code.gs`. Nic wiÄ™cej.

## Decyzje techniczne (zapadÅ‚e â€“ nie otwieraj ponownie)

1. Jedna Å›cieÅ¼ka uploadu (resumable) dla zdjÄ™Ä‡ i filmÃ³w â€“ bez rozgaÅ‚Ä™zienia maÅ‚y/duÅ¼y plik.
2. Zero tokenÃ³w w przeglÄ…darce â€“ sesjÄ™ otwiera serwer (Apps Script).
3. Vanilla JS, bez frameworkÃ³w â€“ deadline i utrzymanie.
4. Brak bazy danych i brak stanu serwera â€“ struktura folderÃ³w Drive to caÅ‚oÅ›Ä‡ "modelu danych".
5. Brak pamiÄ™ci kolejki po zamkniÄ™ciu karty (poza zakresem MVP).
6. Limit 2 GB/plik, bez limitu liczby plikÃ³w.
7. UI po polsku, jeden ekran, trzy stany (start / wysyÅ‚ka / podziÄ™kowanie).
8. Design: topowy poziom wizualny (frontend-design skill), zdjÄ™cia pary zoptymalizowane do weba, animacje tylko CSS â€“ budÅ¼et <3 s pierwszego renderu na LTE jest nadrzÄ™dny.
9. `plakat.html` (druk A4, CSS print) z osadzonym QR i instrukcjÄ… 3-krokowÄ… â€“ czÄ™Å›Ä‡ MVP, ta sama estetyka co strona.

## Konwencje i struktura katalogÃ³w (v2 â€“ stan faktyczny)

```
Wedding_upoader/              â† root repo: github.com/stachu11852/wesele-hania-piotrek
â”œâ”€â”€ docs/                     â† GitHub Pages (branch main, katalog /docs)
â”‚   â”œâ”€â”€ index.html            â† strona goÅ›cia (3 stany: start/wysyÅ‚ka/podziÄ™kowanie)
â”‚   â”œâ”€â”€ app.js                â† SCRIPT_URL + silnik uploadu (chunki 8 MiB, retry, 308)
â”‚   â”œâ”€â”€ style.css             â† estetyka "golden hour" (kremy, zÅ‚oto, Cormorant Garamond)
â”‚   â”œâ”€â”€ plakat.html           â† plakat A4 do druku (samodzielny, style inline)
â”‚   â””â”€â”€ assets/               â† hero.webp/jpg, sparklers.webp/jpg, qr.svg
â”œâ”€â”€ apps-script/              â† kopia ÅºrÃ³dÅ‚a Apps Script (push przez clasp)
â”‚   â”œâ”€â”€ Code.gs               â† initUpload + resumable session (scope drive.file)
â”‚   â””â”€â”€ appsscript.json       â† manifest: drive.file + script.external_request, webapp Anyone
â”œâ”€â”€ zdjecia/ + foto_src/      â† oryginaÅ‚y zdjÄ™Ä‡ pary (gitignore â€“ prywatne)
â”œâ”€â”€ INSTRUKCJA.md             â† wdroÅ¼enie/testy dla wÅ‚aÅ›ciciela
â””â”€â”€ SPEC.md / CLAUDE.md / README.md
```

## Identyfikatory wdroÅ¼enia (produkcja)

- **Konto Google:** bartosz.stachowiak1185@gmail.com (clasp `--user default`)
- **Script ID:** `1jzIaWtnxYecVcW-ga_qELTplUlULasNfiEkIJqUSpwqPpBHqZWyTZnvo`
- **Deployment:** `AKfycbwK6ZotOm4J1l0LXBvXrQAWWCfjcGA-8zu5qv7wXL9j4dlQLqN79696PGBhDU2nVQyu`
  (URL = SCRIPT_URL w `docs/app.js`; aktualizowaÄ‡ ISTNIEJÄ„CE wdroÅ¼enie, nie tworzyÄ‡ nowych URL-i)
- **Strona:** https://haniaipiotrek.pl/ (treÅ›Ä‡ kodu QR w `docs/assets/qr.svg`)
- **RozstrzygniÄ™cie scope (z "Znane ryzyka"):** wybrano `drive.file` â€“ folder gÅ‚Ã³wny tworzy
  skrypt (funkcja `setup()`), ID w `PropertiesService` (`ROOT_FOLDER_ID`). Skrypt nie ma
  dostÄ™pu do reszty prywatnego Drive.
- Workflow zmian: front â†’ `git push` (Pages samo siÄ™ odÅ›wieÅ¼a); backend â†’
  `clasp --user default push` + `clasp --user default deploy -i <deploymentId>` (URL bez zmian).
- **PuÅ‚apka CORS (rozwiÄ…zana):** przeglÄ…darka NIE odczyta finalnej odpowiedzi sesji resumable
  Drive (brak nagÅ‚Ã³wkÃ³w CORS na Å¼Ä…daniu koÅ„czÄ…cym plik i wszystkich pÃ³Åºniejszych â€“ feler Google;
  poÅ›rednie chunki 308 + nagÅ‚Ã³wek Range dziaÅ‚ajÄ… normalnie). Dlatego front przy bÅ‚Ä™dzie pyta
  Apps Script (`action: checkSession`), ktÃ³ry robi PUT `bytes */total` po stronie serwera
  i zwraca {done|nextOffset|dead}. Nie "naprawiaÄ‡" tego przez retry w przeglÄ…darce.
- Wersjonowanie zasobÃ³w: `index.html` Å‚aduje `style.css?v=N` i `app.js?v=N` â€“ przy kaÅ¼dej
  zmianie tych plikÃ³w podbij N (inaczej cache CDN/przeglÄ…darek moÅ¼e rozjechaÄ‡ HTML i CSS/JS).

## Znane ryzyka do zweryfikowania w implementacji

- Scope manifestu: czy `drive.file` pozwoli pisaÄ‡ do rÄ™cznie utworzonego folderu (prawdopodobnie nie â†’ wtedy folder gÅ‚Ã³wny tworzy skrypt, ID zapisuje w `PropertiesService`, a wÅ‚aÅ›ciciel dostaje link; albo Å›wiadomie peÅ‚ny scope `drive` â€“ wybierz i uzasadnij w komentarzu).
- CORS na `doPost` Apps Script: wysyÅ‚aj z frontu jako `Content-Type: text/plain` z JSON w body (standardowy trik unikajÄ…cy preflight, ktÃ³rego Apps Script nie obsÅ‚uguje).
- Safari iOS: wybÃ³r wielu plikÃ³w z galerii i zachowanie przy uÅ›pieniu ekranu â€“ przetestowaÄ‡ realnie, dodaÄ‡ komunikat "nie blokuj ekranu".
