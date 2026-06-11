# Wesele Upload – Hania & Piotrek

Strona do zbierania oryginalnych zdjęć i filmów od gości weselnych na prywatny Google Drive.
Goście skanują kod QR, wpisują imię i wysyłają pliki — bez logowania, bez aplikacji.

- **Strona:** https://haniaipiotrek.pl/
- **Plakat A4 z QR:** https://haniaipiotrek.pl/plakat.html

## Jak to działa

1. Frontend (statyczny, GitHub Pages, `docs/`) wysyła do web appki Google Apps Script
   metadane pliku (`initUpload`).
2. Apps Script (`apps-script/Code.gs`) waliduje, znajduje/tworzy podfolder z imieniem gościa
   i otwiera **resumable upload session** w Google Drive API v3. Do przeglądarki wraca
   wyłącznie URL sesji — żaden token OAuth nie opuszcza serwera.
3. Przeglądarka wysyła plik chunkami po 8 MiB bezpośrednio na Drive, z retry
   i wznowieniem po zerwaniu sieci (HTTP 308 + nagłówek `Range`).

## Konfiguracja

- `docs/app.js` → `SCRIPT_URL` (URL deploymentu Apps Script), `EVENT_TITLE`
- `apps-script/Code.gs` → `CONFIG.ROOT_FOLDER_NAME`, `CONFIG.MAX_FILE_SIZE`

Szczegóły wdrożenia: `INSTRUKCJA.md`. Specyfikacja produktowa: `SPEC.md`.
