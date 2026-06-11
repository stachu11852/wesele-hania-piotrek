# Prompt startowy – Wesele Upload

Wklej do Claude Code w folderze projektu zawierającym SPEC.md i CLAUDE.md:

---

Budujemy "Wesele Upload" – stronę do zbierania oryginalnych zdjęć i filmów od gości weselnych na mój Google Drive. Specyfikacja: `SPEC.md`, kontekst techniczny i zapadłe decyzje: `CLAUDE.md` – przeczytaj oba w całości zanim napiszesz linijkę kodu.

Pierwsze zadanie:
0. Zainstaluj i aktywuj skill frontend-design (`npx -y skills add anthropics/skills --skill frontend-design`) – design strony to wymaganie wysokiej rangi (SPEC sekcja 5 i kryterium akceptacji nr 7).
1. Zainicjuj projekt i zaproponuj strukturę katalogów (uzupełnimy nią CLAUDE.md v2).
2. Rozstrzygnij kwestię scope'ów Apps Script z sekcji "Znane ryzyka" w CLAUDE.md i uzasadnij wybór.
3. Zaimplementuj `Code.gs` (initUpload + resumable session) oraz `index.html` z pełnym flow: imię → wybór plików → upload chunkami z retry/wznowieniem → podziękowanie. Design weselny, elegancki, ze zdjęciami pary (dostarczę 1–3 oryginały – zoptymalizuj je do weba) – ale pierwszy render <3 s na LTE.
4. Zrób `plakat.html` – plakat A4 do druku z QR (osadzony statycznie), imionami pary i instrukcją 3-krokową dla gości, w estetyce strony.
5. Daj mi instrukcję wdrożenia krok po kroku (Apps Script deploy + repo GitHub + włączenie Pages przez `gh` CLI) – pisaną dla nie-programisty.

Deadline: działająca wersja do testów dziś, wesele za tydzień. Trzymaj się decyzji z CLAUDE.md – nie proponuj frameworków ani bazy danych.

---
