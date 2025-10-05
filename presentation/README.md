# 🇵🇱 Prezentacja LaTeX Beamer — Finansowy Kompas

---

Podstawy
- Projekt prezentacji LaTeX Beamer z wersją polską i angielską.
- Główne pliki: `presentationPL.tex`, `presentationENG.tex`.

Wymagania
- TeX Live (lub MiKTeX) z pakietem Beamer i standardowymi pakietami LaTeX.
- Zalecane: `latexmk` (automatyczna kompilacja do PDF).

Kompilacja
- PL: `latexmk -pdf presentationPL.tex`
- PL (alternatywnie): `pdflatex presentationPL.tex` (uruchom 2–3 razy)
- EN: `latexmk -pdf presentationENG.tex`
- EN (alternatywnie): `pdflatex presentationENG.tex` (uruchom 2–3 razy)

Struktura
- `contentPL/` — treść slajdów po polsku (.tex)
- `contentENG/` — treść slajdów po angielsku (.tex)
- `img/` — grafiki używane w slajdach
- `customcolortheme.sty` — własny motyw kolorów
- `presentationPL.tex`, `presentationENG.tex` — wejściowe pliki Beamera

Szybki start
- Edytuj pliki w `contentPL/` lub `contentENG/`.
- Dodaj grafiki do `img/`.
- Skompiluj odpowiedni plik `.tex`, aby wygenerować PDF.


# 🇬🇧 LaTeX Beamer Presentation — Finansowy Kompas

---

Basics
- LaTeX Beamer slide deck with Polish and English versions.
- Main entry files: `presentationPL.tex`, `presentationENG.tex`.

Requirements
- TeX Live (or MiKTeX) with Beamer and standard LaTeX packages.
- Recommended: `latexmk` (automatic PDF build).

Build
- PL: `latexmk -pdf presentationPL.tex`
- PL (alternative): `pdflatex presentationPL.tex` (run 2–3 times)
- EN: `latexmk -pdf presentationENG.tex`
- EN (alternative): `pdflatex presentationENG.tex` (run 2–3 times)

Structure
- `contentPL/` — Polish slide content (.tex)
- `contentENG/` — English slide content (.tex)
- `img/` — images used in slides
- `customcolortheme.sty` — custom color theme
- `presentationPL.tex`, `presentationENG.tex` — Beamer entry files

Quick start
- Edit files in `contentPL/` or `contentENG/`.
- Add images to `img/`.
- Compile the appropriate `.tex` file to generate a PDF.
