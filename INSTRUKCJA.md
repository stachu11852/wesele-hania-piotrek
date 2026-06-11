# Instrukcja wdrożenia – Wesele Upload (Hania & Piotrek, 13.06.2026)

## Co jest już zrobione automatycznie ✅

| Element | Stan |
|---------|------|
| Kod strony (front) | gotowy, w repo GitHub |
| Backend Apps Script | utworzony i wgrany na konto **bartosz.stachowiak1185@gmail.com** |
| Deployment web app | utworzony (URL wpisany już do strony) |
| Repo GitHub | https://github.com/stachu11852/wesele-hania-piotrek (publiczne) |
| GitHub Pages | włączone – strona: https://haniaipiotrek.pl/ |
| Plakat A4 z QR | https://haniaipiotrek.pl/plakat.html |

## ⚠️ JEDEN krok ręczny: autoryzacja skryptu (2 minuty)

Skrypt musi dostać od Ciebie zgodę na zapisywanie plików na Twoim Drive.
Tego nie da się zrobić automatycznie – wymaga kliknięcia na Twoim koncie Google.

1. **Upewnij się, że w przeglądarce jesteś zalogowany jako `bartosz.stachowiak1185@gmail.com`**
   (jeśli masz kilka kont – użyj profilu Chrome z tym kontem).
2. Otwórz edytor skryptu:
   https://script.google.com/d/1jzIaWtnxYecVcW-ga_qELTplUlULasNfiEkIJqUSpwqPpBHqZWyTZnvo/edit
3. Na górnym pasku, obok przycisków „Uruchom" i „Debuguj", jest lista funkcji –
   wybierz **`setup`**, potem kliknij **Uruchom**.
4. Wyskoczy okno **„Wymagana autoryzacja"** → kliknij **Przejrzyj uprawnienia** →
   wybierz konto `bartosz.stachowiak1185@gmail.com`.
5. Google pokaże ostrzeżenie „Aplikacja niezweryfikowana" (normalne – to Twój własny skrypt):
   kliknij **Zaawansowane** → **Otwórz: Wesele Upload… (niebezpieczne)** → **Zezwól**.
6. Po chwili na dole w „Dzienniku wykonania" zobaczysz link do folderu
   **„(nie) Wesele Hani i Piotrka – zdjęcia od gości"** na Twoim Drive. Tam będą lądować pliki.

## Test po autoryzacji (5 minut)

1. Wklej w przeglądarkę:
   https://script.google.com/macros/s/AKfycbwK6ZotOm4J1l0LXBvXrQAWWCfjcGA-8zu5qv7wXL9j4dlQLqN79696PGBhDU2nVQyu/exec
   → powinno pokazać `{"ok":true,"service":"wesele-upload",...}`.

   **Jeśli zamiast tego jest błąd 403/„brak dostępu":** w edytorze skryptu kliknij
   **Wdróż → Zarządzaj wdrożeniami → ikona ołówka → Wersja: Nowa wersja → Wdróż**.
   URL zostaje ten sam – nie trzeba nic zmieniać na stronie. Sprawdź link ponownie.

2. Otwórz na telefonie: https://haniaipiotrek.pl/
   wpisz imię „Test", wyślij 2–3 zdjęcia i krótki film.
3. Sprawdź na Drive: folder `(nie) Wesele Hani i Piotrka – zdjęcia od gości / Test /` –
   pliki mają być w **oryginalnym rozmiarze** (porównaj MB z telefonem).
4. Test zrywania sieci: zacznij wysyłać film, włącz tryb samolotowy na 30 s, wyłącz –
   wysyłka ma się sama dokończyć.
5. Powtórz test na iPhonie (Safari) i Androidzie (Chrome) – kryterium akceptacji nr 1.

## Plakat

1. Otwórz https://haniaipiotrek.pl/plakat.html
2. Ctrl+P → drukarka, A4, marginesy: **Brak/Domyślne**, skala 100%,
   włącz „Grafiki tła" jeśli dostępne → Drukuj.
3. Zeskanuj wydrukowany QR telefonem z ~2 metrów – ma otworzyć stronę.

## Przed weselem (checklista)

- [ ] Autoryzacja skryptu zrobiona, test `{"ok":true}` przechodzi
- [ ] Test na iPhone + Android zaliczony (oryginalne rozmiary plików na Drive!)
- [ ] Wolne miejsce na Drive: minimum ~50 GB (sprawdź: https://drive.google.com/settings/storage)
- [ ] Plakat wydrukowany, QR skanuje się z 2 m
- [ ] Telefon naładowany 😉

## Po weselu

- Link działa dalej – goście mogą dosyłać filmy z domu (nie wyłączaj deploymentu min. 2 tygodnie).
- Zanim zaczniesz porządkować zdjęcia, zrób kopię całego folderu (Drive → folder →
  Pobierz = zip na dysk).

## Gdzie co jest (na przyszłość)

- Zmiana tytułu/imion: `docs/index.html`, `docs/plakat.html`, `apps-script/Code.gs` (`ROOT_FOLDER_NAME`)
- URL backendu: `docs/app.js` → `SCRIPT_URL`
- Zmiany kodu wgrywa Claude Code: front → `git push` (Pages odświeża się samo),
  backend → `clasp --user default push` + nowa wersja wdrożenia w edytorze.
