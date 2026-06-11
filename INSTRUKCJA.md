# Instrukcja wdroÅ¼enia â€“ Wesele Upload (Hania & Piotrek, 13.06.2026)

## Co jest juÅ¼ zrobione automatycznie âœ…

| Element | Stan |
|---------|------|
| Kod strony (front) | gotowy, w repo GitHub |
| Backend Apps Script | utworzony i wgrany na konto **bartosz.stachowiak1185@gmail.com** |
| Deployment web app | utworzony (URL wpisany juÅ¼ do strony) |
| Repo GitHub | https://github.com/stachu11852/wesele-hania-piotrek (publiczne) |
| GitHub Pages | wÅ‚Ä…czone â€“ strona: https://haniaipiotrek.pl/ |
| Plakat A4 z QR | https://haniaipiotrek.pl/plakat.html |

## âš ï¸ JEDEN krok rÄ™czny: autoryzacja skryptu (2 minuty)

Skrypt musi dostaÄ‡ od Ciebie zgodÄ™ na zapisywanie plikÃ³w na Twoim Drive.
Tego nie da siÄ™ zrobiÄ‡ automatycznie â€“ wymaga klikniÄ™cia na Twoim koncie Google.

1. **Upewnij siÄ™, Å¼e w przeglÄ…darce jesteÅ› zalogowany jako `bartosz.stachowiak1185@gmail.com`**
   (jeÅ›li masz kilka kont â€“ uÅ¼yj profilu Chrome z tym kontem).
2. OtwÃ³rz edytor skryptu:
   https://script.google.com/d/1jzIaWtnxYecVcW-ga_qELTplUlULasNfiEkIJqUSpwqPpBHqZWyTZnvo/edit
3. Na gÃ³rnym pasku, obok przyciskÃ³w â€žUruchom" i â€žDebuguj", jest lista funkcji â€“
   wybierz **`setup`**, potem kliknij **Uruchom**.
4. Wyskoczy okno **â€žWymagana autoryzacja"** â†’ kliknij **Przejrzyj uprawnienia** â†’
   wybierz konto `bartosz.stachowiak1185@gmail.com`.
5. Google pokaÅ¼e ostrzeÅ¼enie â€žAplikacja niezweryfikowana" (normalne â€“ to TwÃ³j wÅ‚asny skrypt):
   kliknij **Zaawansowane** â†’ **OtwÃ³rz: Wesele Uploadâ€¦ (niebezpieczne)** â†’ **ZezwÃ³l**.
6. Po chwili na dole w â€žDzienniku wykonania" zobaczysz link do folderu
   **â€žWesele Hani i Piotrka â€“ zdjÄ™cia od goÅ›ci"** na Twoim Drive. Tam bÄ™dÄ… lÄ…dowaÄ‡ pliki.

## Test po autoryzacji (5 minut)

1. Wklej w przeglÄ…darkÄ™:
   https://script.google.com/macros/s/AKfycbwK6ZotOm4J1l0LXBvXrQAWWCfjcGA-8zu5qv7wXL9j4dlQLqN79696PGBhDU2nVQyu/exec
   â†’ powinno pokazaÄ‡ `{"ok":true,"service":"wesele-upload",...}`.

   **JeÅ›li zamiast tego jest bÅ‚Ä…d 403/â€žbrak dostÄ™pu":** w edytorze skryptu kliknij
   **WdrÃ³Å¼ â†’ ZarzÄ…dzaj wdroÅ¼eniami â†’ ikona oÅ‚Ã³wka â†’ Wersja: Nowa wersja â†’ WdrÃ³Å¼**.
   URL zostaje ten sam â€“ nie trzeba nic zmieniaÄ‡ na stronie. SprawdÅº link ponownie.

2. OtwÃ³rz na telefonie: https://haniaipiotrek.pl/
   wpisz imiÄ™ â€žTest", wyÅ›lij 2â€“3 zdjÄ™cia i krÃ³tki film.
3. SprawdÅº na Drive: folder `Wesele Hani i Piotrka â€“ zdjÄ™cia od goÅ›ci / Test /` â€“
   pliki majÄ… byÄ‡ w **oryginalnym rozmiarze** (porÃ³wnaj MB z telefonem).
4. Test zrywania sieci: zacznij wysyÅ‚aÄ‡ film, wÅ‚Ä…cz tryb samolotowy na 30 s, wyÅ‚Ä…cz â€“
   wysyÅ‚ka ma siÄ™ sama dokoÅ„czyÄ‡.
5. PowtÃ³rz test na iPhonie (Safari) i Androidzie (Chrome) â€“ kryterium akceptacji nr 1.

## Plakat

1. OtwÃ³rz https://haniaipiotrek.pl/plakat.html
2. Ctrl+P â†’ drukarka, A4, marginesy: **Brak/DomyÅ›lne**, skala 100%,
   wÅ‚Ä…cz â€žGrafiki tÅ‚a" jeÅ›li dostÄ™pne â†’ Drukuj.
3. Zeskanuj wydrukowany QR telefonem z ~2 metrÃ³w â€“ ma otworzyÄ‡ stronÄ™.

## Przed weselem (checklista)

- [ ] Autoryzacja skryptu zrobiona, test `{"ok":true}` przechodzi
- [ ] Test na iPhone + Android zaliczony (oryginalne rozmiary plikÃ³w na Drive!)
- [ ] Wolne miejsce na Drive: minimum ~50 GB (sprawdÅº: https://drive.google.com/settings/storage)
- [ ] Plakat wydrukowany, QR skanuje siÄ™ z 2 m
- [ ] Telefon naÅ‚adowany ðŸ˜‰

## Po weselu

- Link dziaÅ‚a dalej â€“ goÅ›cie mogÄ… dosyÅ‚aÄ‡ filmy z domu (nie wyÅ‚Ä…czaj deploymentu min. 2 tygodnie).
- Zanim zaczniesz porzÄ…dkowaÄ‡ zdjÄ™cia, zrÃ³b kopiÄ™ caÅ‚ego folderu (Drive â†’ folder â†’
  Pobierz = zip na dysk).

## Gdzie co jest (na przyszÅ‚oÅ›Ä‡)

- Zmiana tytuÅ‚u/imion: `docs/index.html`, `docs/plakat.html`, `apps-script/Code.gs` (`ROOT_FOLDER_NAME`)
- URL backendu: `docs/app.js` â†’ `SCRIPT_URL`
- Zmiany kodu wgrywa Claude Code: front â†’ `git push` (Pages odÅ›wieÅ¼a siÄ™ samo),
  backend â†’ `clasp --user default push` + nowa wersja wdroÅ¼enia w edytorze.
