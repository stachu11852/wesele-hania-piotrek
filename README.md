# Wesele Upload â€“ Hania & Piotrek

Strona do zbierania oryginalnych zdjÄ™Ä‡ i filmÃ³w od goÅ›ci weselnych na prywatny Google Drive.
GoÅ›cie skanujÄ… kod QR, wpisujÄ… imiÄ™ i wysyÅ‚ajÄ… pliki â€” bez logowania, bez aplikacji.

- **Strona:** https://haniaipiotrek.pl/
- **Plakat A4 z QR:** https://haniaipiotrek.pl/plakat.html

## Jak to dziaÅ‚a

1. Frontend (statyczny, GitHub Pages, `docs/`) wysyÅ‚a do web appki Google Apps Script
   metadane pliku (`initUpload`).
2. Apps Script (`apps-script/Code.gs`) waliduje, znajduje/tworzy podfolder z imieniem goÅ›cia
   i otwiera **resumable upload session** w Google Drive API v3. Do przeglÄ…darki wraca
   wyÅ‚Ä…cznie URL sesji â€” Å¼aden token OAuth nie opuszcza serwera.
3. PrzeglÄ…darka wysyÅ‚a plik chunkami po 8 MiB bezpoÅ›rednio na Drive, z retry
   i wznowieniem po zerwaniu sieci (HTTP 308 + nagÅ‚Ã³wek `Range`).

## Konfiguracja

- `docs/app.js` â†’ `SCRIPT_URL` (URL deploymentu Apps Script), `EVENT_TITLE`
- `apps-script/Code.gs` â†’ `CONFIG.ROOT_FOLDER_NAME`, `CONFIG.MAX_FILE_SIZE`

SzczegÃ³Å‚y wdroÅ¼enia: `INSTRUKCJA.md`. Specyfikacja produktowa: `SPEC.md`.
