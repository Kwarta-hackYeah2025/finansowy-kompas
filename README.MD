# 🇵🇱 Polski

# Finansowy Kompas — pełny opis projektu (React + FastAPI)

Finansowy Kompas to prototyp (MVP) aplikacji edukacyjno-analitycznej,
która w przystępny sposób pomaga zrozumieć: wartość pieniądza w czasie,
mechanikę polskiego systemu emerytalnego (I i II filar) oraz wpływ ścieżki
kariery na przyszłe świadczenia. Projekt składa się z nowoczesnego frontendu
(*Single Page Application*) w React oraz backendu w FastAPI.

Całość uzupełnia prezentacja (PL/ENG) oprowadzająca po poszczególnych modułach
aplikacji internetowej. W pełni działająca wersja aplikacji dostępna jest
na stronie: [https://finansowy-kompas.pl](https://finansowy-kompas.pl).

- Frontend: folder `../frontend` (React + Vite + TypeScript)
- Backend --- FastAPI: folder `../backend` (`FastAPI` + `Pydantic`)
- Backend --- modele danych i modele uczenia maszynowego:
- folder `../backend/models` (`numpy`, `pandas`, `scikit-learn`, `matplotlib`, `seaborn`)
- Prezentacja: bieżący folder `presentation` (`LaTeX` --- `beamer`)


## Spis treści
- [1. Wprowadzenie i cel](#1-wprowadzenie-i-cel)
- [2. Architektura i przepływ danych](#2-architektura-i-przepływ-danych)
- [3. Moduły aplikacji (MVP)](#3-moduły-aplikacji-mvp)
- [4. Technologie i dane](#4-technologie-i-dane)
- [5. Uruchomienie — szybki start](#5-uruchomienie--szybki-start)
- [6. Frontend — szczegóły techniczne](#6-frontend--szczegóły-techniczne)
- [7. Backend — szczegóły techniczne i API](#7-backend--szczegóły-techniczne-i-api)
- [8. Zdarzenia losowe i symulacje](#8-zdarzenia-losowe-i-symulacje)
- [9. Zbieranie statystyk i eksport do Excela](#9-zbieranie-statystyk-i-eksport-do-excela)
- [10. Modele i równania](#10-modele-i-równania)
- [11. Plan rozwoju (Co dalej?)](#11-plan-rozwoju-co-dalej)
- [12. Zespół](#12-zespół)


## 1. Wprowadzenie i cel
W 2025 r. większość publicznych kalkulatorów emerytalnych wymaga od użytkownika wielu
parametrów wejściowych, które są trudne do realistycznego oszacowania. Skutkiem są niepewne
wyniki lub rezygnacja z narzędzia. Finansowy Kompas eliminuje tę barierę poprzez:

- domyślne, wiarygodne wartości bazowe (dane rynkowe + modele),
- interaktywne wykresy i klarowny język,
- możliwość stopniowego doprecyzowania danych.

Wynik: inteligentny przewodnik po zależnościach finansowych, który edukuje i motywuje
do dalszej eksploracji, zamiast przytłaczać złożonością systemu.


## 2. Architektura i przepływ danych
- Użytkownik podaje minimalny zestaw danych
(zawód/branża, miasto, wiek, start kariery, planowany wiek emerytury, itp.).
- Frontend wysyła zapytanie na odpowiedni endpoint backendu, który:
  - estymuje „pensję juniora” oraz parametry krzywej wzrostu wynagrodzeń (α, β),
  - przygotowuje projekcję ścieżki wynagrodzeń i kapitału ZUS (I + II filar),
  - zwraca również serię czasową (nominalnie i realnie), gotową do wizualizacji.
- Frontend prezentuje wyniki w formie wykresów i płytek z danymi, z możliwością
włączenia trybu symulacji zdarzeń losowych.


## 3. Moduły aplikacji (MVP)

- Moduł I — Podstawowe dane
  - Minimalny zestaw informacji: zawód/branża, miejscowość, wiek.
  - System natychmiast proponuje wstępny model finansowy: projekcję
  wynagrodzeń (nominalnie i realnie), miesięczne wydatki i oszczędności,
  lata doświadczenia, wiek emerytury (możliwe ręczne korekty).

- Moduł II — Uproszczony kalkulator emerytalny
  - Dynamiczny wykres relacji emerytura–historia zatrudnienia (średnie zarobki, staż, wymiar etatu).
  - Porównanie UoP vs. JDG (B2B) przy minimalnych składkach ZUS.
  - Ciekawostki kontekstowe (LLM) — subtelna edukacja użytkownika.
  - Dodatkowo: wykres mediany emerytury dla losowych zawodów.

- Moduł III — Wartość pieniądza
  - Wizualizacja wpływu inflacji i oprocentowania na oszczędności/lokaty.
  - Dla porównania: ceny żywności, nieruchomości oraz globalne akcje (ETF).

- Moduł IV — Rozszerzony kalkulator emerytalny
  - Pełnia danych użytkownika (własne + modelowe) i kluczowe parametry:
  kapitał I/II filara, ścieżka zarobków, prognoza emerytury i „stopa zastąpienia”
  (realna zmiana przychodu w momencie przejścia na emeryturę).

- Moduł V — Symulacja zdarzeń losowych
  - Opcjonalne zdarzenia (bezrobocie, choroba, praca za granicą bez ZUS,
  niepełny etat itp.) wpływają na wyliczenia modułu IV.

- Moduł VI — Zbieranie statystyk i raport `.xlsx`
  - MVP bez autoryzacji/bazy, za to z anonimowymi statystykami dla administratora
  (raport Excel zgodnie z wymaganiami zadania).


## 4. Technologie i dane
- Frontend: `React 19`, `TypeScript`, `Vite 7`, `React Router`, `Tanstack Query`,
`TailwindCSS 4`, `Recharts` (wizualizacje), `react-hook-form` + `zod`, `sonner` (powiadomienia),
`framer-motion` (animacje).
- Backend: `FastAPI`, `Pydantic v2`, `pydantic-settings`).
- LLM i RAG: `pydantic-ai-slim[google]` + Gemini API (klasyfikacja zawodu/branży,
ciekawostki, generowanie okresów niefunkcjonalnych).
- Dane makro: model „MacroeconomicFactors” (inflacja, PKB, itp.)
na potrzeby urealniania nominalnych wielkości.


## 5. Uruchomienie — szybki start

Struktura projektu:
```
/finansowy-kompas
├─ backend
├─ frontend
└─ presentation
```

- Backend (wymaga Python 3.13):
  1) Ustaw klucz GEMINI_API_KEY w pliku `backend/.env`:
     - `GEMINI_API_KEY=twoj_klucz_api`
  2) Zainstaluj zależności:
     - `uv sync` w folderze `backend`
  3) Uruchom serwer:
     - `uv fastapi run dev api/main.py`

- Frontend (wymaga Node 20+):
  1) ` npm ci` (w folderze `frontend`)
  2) skonfiguruj `VITE_API_BASE_URL` w pliku `frontend/.env`:
     `VITE_API_BASE_URL=http://localhost:8000` w przypadku lokalnej instancji.
  3) `npm run dev` i wejdź na podany adres (zwykle `http://localhost:5173`).


## 6. Frontend — szczegóły techniczne
- Skrypty (package.json):
  - `npm run dev` — tryb deweloperski Vite
  - `npm run build` — produkcyjny build do katalogu `build`
  - `npm run preview` — lokalny podgląd buildu
- Konfiguracja Vite: alias `@` do `src/` (plik `vite.config.ts`).
- Router (`src/router/routes.tsx`):
  - `/` (Home), `/inflacja`, `/informacje`, `/wartosc-pieniadza`, `/emerytura`, `/emerytura/analiza`.
- Integracja z backendem:
  - Klient HTTP: `axios` z `baseURL = VITE_API_BASE_URL` (gdy puste — używa ścieżek względnych, np. `/api/v1/...`).
  - Endpoints (lib/api_routes.ts):
    - `POST` `/api/v1/salary/calculate`
    - `POST` `/api/v1/user-profile/pension/preview`
    - `GET`  `/api/v1/fun-facts/`
    - `POST` `/api/v1/excel/`
- Przechowywanie danych w przeglądarce: `localStorage` (formularz i współczynniki α/β).
- Formularze: `react-hook-form` + walidacja `zod`.
- Wizualizacja: `Recharts` (serie nominalne i realne), strefy zdarzeń (ReferenceArea), legendy, tooltipy.


## 7. Backend — szczegóły techniczne i API
- FastAPI app: `backend/api/main.py` (CORS włączony w trybie debug dla `*`).
- Ustawienia (`backend/config/settings.py`):
  - `GEMINI_API_KEY` wymagany (ładowany z `.env`),
  - `environment` domyślnie `DEVELOPMENT` (OpenAPI dostępne w DEV),
  - CORS „*” w trybie `debug=True`.
- Główne trasy (`backend/api/routes`):
  - `/api/v1/salary/calculate` (POST)
    - Request (JSON):
      - `sex`: `male` | `female`
      - `age`: int
      - `city`: string
      - `industry`: string
      - `career_start`: int (opcjonalne; domyślnie 23)
      - `career_end`: int (opcjonalne; domyślnie 65 M / 60 K)
    - Response:
      - `salary`: float (miesięczna pensja „dziś”)
      - `experience_years`: int
      - `retirement_age`: int
      - `years_to_retirement`: int
      - `alpha`, `beta`: float — współczynniki modelu doświadczenia

  - `/api/v1/user-profile/pension/preview` (POST)
    - Request (JSON):
      - `current_age`: int
      - `years_of_experience`: int
      - `current_monthly_salary`: float
      - `is_male`: bool
      - `alpha`, `beta`: float
      - `retirement_age`: int (opcjonalnie)
      - `simulation_mode`: bool (opcjonalnie)
    - Response (wybrane pola):
      - `monthly_pension_nominal` / `monthly_pension_real`
      - `replacement_rate_percent_nominal` / `..._real`
      - `i_pillar_capital_nominal` / `..._real`, `ii_pillar_*`, `total_capital_*`
      - `current_monthly_salary_nominal`, `final_monthly_salary_nominal`, `final_monthly_salary_real`
      - `timeline`: lista punktów (rok + serie nominalne i realne)
      - `simulation_events`: lista zdarzeń użytych w symulacji (jeśli włączona)

  - `/api/v1/fun-facts/` (GET)
    - Zwraca listę ciekawostek z LLM (Gemini) w celu lekkiej edukacji użytkownika.

  - `/api/v1/excel/` (POST)
    - Dodaje wiersz do pliku `backend/data/usage.xlsx` (tworzy/aktualizuje statystyki użycia).

Uwaga: Backend wymaga poprawnego klucza `GEMINI_API_KEY`.
Przy braku klucza inicjalizacja ustawień zakończy się błędem.


## 8. Zdarzenia losowe i symulacje
Tryb symulacji (frontend) umożliwia pokazanie wpływu przerw w odprowadzaniu składek:
- bezrobocie (brak podstawy),
- niepełny etat (proporcjonalnie niższe składki),
- praca za granicą bez ZUS,
- inne przerwy (choroba, urlopy itp.).

Frontend wizualizuje te okresy jako zacienione pasy na osi czasu. Backend (na żądanie) generuje prawdopodobne okresy z użyciem LLM i przekłada je na mnożniki składek w modelu.


## 9. Zbieranie statystyk i eksport do Excela
- Endpoint: `POST /api/v1/excel/`
- Zapisuje anonimowe dane w `backend/data/usage.xlsx` (kolumny zgodne z wymaganiami zadania, m.in. wiek, płeć, wynagrodzenie, emerytura nominalna/realna, kod pocztowy, tryb symulacji, itp.).


## 10. Modele i równania
Empiryczny model wzrostu płacy wraz z doświadczeniem (wysycenie):
- k(x) = 1 + α · (1 − e^(−β·x))
- gdzie: `x` — lata doświadczenia, a „pensja = pensja_juniora · k(x)`.

Na potrzeby wykresów rozdzielamy wartości nominalne oraz realne (urealnione o inflację). Zastosowanie danych makro (inflacja, dynamika płac, itp.) pozwala na bardziej realistyczne projekcje.


## 11. Plan rozwoju (Co dalej?)
- Rozwój do pełnej aplikacji: stopniowe rozszerzanie parametrów możliwych do edycji przez użytkownika (docelowo każdy parametr będzie mógł być ustawiony ręcznie).
- Ulepszanie modeli i jakości danych (źródła publiczne i branżowe), zwiększanie dokładności i możliwości audytu.
- Dodanie autoryzacji i bazy danych (profil użytkownika, persistencja scenariuszy).
- Dalsza rozbudowa modułu symulacji zdarzeń (bardziej realistyczne scenariusze, parametryzacja).


## 12. Zespół
Zespół Kwarta:
- Kamil Żak — Frontend
- Aleksander Kluska — Backend
- Karol Marszałek — Modele danych, Backend
- Andrzej Legutko — Uczenie maszynowe, modele danych


---

Materiały prezentacyjne w tym katalogu: `presentationPL.pdf` i `presentationENG.pdf` oraz pliki źródłowe LaTeX w `contentPL/` i `contentENG/`. Obrazy użyte w README odnoszą się do zasobów w `presentation/img/` (do użytku w repozytorium).


---

# 🇬🇧 English

# Financial Compass — full project overview (React + FastAPI)

Financial Compass is an educational and analytical MVP that helps users grasp:
- the time value of money,
- the mechanics of Poland’s pension system (Pillar I and II),
- and how a career path can impact future benefits.

The project consists of a modern React single‑page application and a FastAPI backend. A slide deck (PL/ENG) walks through the web app modules. A live demo is available at: https://finansowy-kompas.pl

- Frontend: folder `../frontend` (React + Vite + TypeScript)
- Backend — FastAPI: folder `../backend` (`FastAPI` + `Pydantic`)
- Backend — data and ML models: `../backend/models` (`numpy`, `pandas`, `scikit-learn`, `matplotlib`, `seaborn`)
- Presentation: this `presentation` folder (`LaTeX` — `beamer`)

## Contents
- [1. Introduction and goal](#1-introduction-and-goal)
- [2. Architecture and data flow](#2-architecture-and-data-flow)
- [3. App modules (MVP)](#3-app-modules-mvp)
- [4. Tech and data](#4-tech-and-data)
- [5. Quick start](#5-quick-start)
- [6. Frontend — technical details](#6-frontend--technical-details)
- [7. Backend — technical details and API](#7-backend--technical-details-and-api)
- [8. Random events and simulations](#8-random-events-and-simulations)
- [9. Stats collection and Excel export](#9-stats-collection-and-excel-export)
- [10. Models and equations](#10-models-and-equations)
- [11. Roadmap](#11-roadmap)
- [12. Team](#12-team)

## 1. Introduction and goal
Most public pension calculators (as of 2025) ask for many inputs that are hard to estimate, which leads to uncertainty or abandonment. Financial Compass lowers the barrier by providing:
- credible default baselines (market data + models),
- interactive charts and clear wording,
- a gradual path to refine input data.

## 2. Architecture and data flow
- The user enters a minimal set of data (profession/industry, city, age, career start, planned retirement age, etc.).
- The frontend calls a backend endpoint which:
  - estimates a “junior salary” and experience curve parameters (α, β),
  - prepares a projection of wages and ZUS capital (Pillar I + II),
  - returns a time series (nominal and real) ready for visualization.
- The frontend visualizes results as charts and cards, with an optional simulation mode for random events.

## 3. App modules (MVP)
- Module I — Basic data
  - Minimal info: profession/industry, location, age.
  - The system proposes an initial financial model: wage projection (nominal/real), monthly expenses and savings, years of experience, retirement age (manually adjustable).

- Module II — Simple pension calculator
  - Dynamic chart of pension vs. employment history (average pay, tenure, working time).
  - UoP vs. B2B (JDG) comparison with minimum ZUS contributions.
  - Contextual fun facts (LLM) for subtle education.
  - Additionally: median pension chart for random professions.

- Module III — Value of money
  - Visualizes the impact of inflation and interest rates on savings/deposits.
  - For reference: food, real estate prices and global equities (ETF).

- Module IV — Extended pension calculator
  - Full user and model data with key parameters: Pillar I/II capital, wage path, pension forecast, and replacement rate (real change in income at retirement).

- Module V — Random events simulation
  - Optional events (unemployment, illness, work abroad without ZUS, part‑time, etc.) affect Module IV calculations.

- Module VI — Stats and `.xlsx` report
  - MVP has no auth/DB; it saves anonymous stats for the admin (Excel report as per assignment requirements).

## 4. Tech and data
- Frontend: React 19, TypeScript, Vite 7, React Router, Tanstack Query,
  TailwindCSS 4, Recharts, react-hook-form + zod, sonner (notifications),
  framer-motion (animations).
- Backend: FastAPI, Pydantic v2, pydantic-settings.
- LLM and RAG: pydantic-ai-slim[google] + Gemini API (profession/industry classification, fun facts, non-functional periods generation).
- Macro data: a “MacroeconomicFactors” model (inflation, GDP, etc.) to convert nominal series to real values.

## 5. Quick start
Project structure:
```
/finansowy-kompas
├─ backend
├─ frontend
└─ presentation
```

- Backend (Python 3.13 required):
  1) Set GEMINI_API_KEY in `backend/.env`:
     - `GEMINI_API_KEY=your_api_key`
  2) Install deps:
     - run `uv sync` in `backend`
  3) Start server:
     - `uv fastapi run dev api/main.py`

- Frontend (Node 20+):
  1) `npm ci` (in `frontend`)
  2) set `VITE_API_BASE_URL` in `frontend/.env` (e.g. `http://localhost:8000` for local backend)
  3) `npm run dev` and open the shown URL (usually `http://localhost:5173`).

## 6. Frontend — technical details
- Scripts (package.json):
  - `npm run dev` — Vite dev mode
  - `npm run build` — production build into `build`
  - `npm run preview` — local preview of the build
- Vite config: alias `@` to `src/` (see `vite.config.ts`).
- Router (`src/router/routes.tsx`): `/` (Home), `/inflacja`, `/informacje`, `/wartosc-pieniadza`, `/emerytura`, `/emerytura/analiza`.
- Backend integration:
  - HTTP client: axios with `baseURL = VITE_API_BASE_URL` (when empty, uses relative paths like `/api/v1/...`).
  - Endpoints (lib/api_routes.ts):
    - `POST` `/api/v1/salary/calculate`
    - `POST` `/api/v1/user-profile/pension/preview`
    - `GET`  `/api/v1/fun-facts/`
    - `POST` `/api/v1/excel/`
- Client storage: `localStorage` (forms and α/β coefficients).
- Charts: Recharts (nominal and real series), event zones (ReferenceArea), legends, tooltips.

## 7. Backend — technical details and API
- FastAPI app: `backend/api/main.py` (CORS enabled for `*` in debug).
- Settings (`backend/config/settings.py`):
  - `GEMINI_API_KEY` required (loaded from `.env`),
  - `environment` default `DEVELOPMENT` (OpenAPI available in DEV),
  - CORS `*` when `debug=True`.
- Main routes (`backend/api/routes`):
  - `/api/v1/salary/calculate` (POST)
    - Request (JSON): `sex`, `age`, `city`, `industry`, optional `career_start`, `career_end`.
    - Response: `salary`, `experience_years`, `retirement_age`, `years_to_retirement`, `alpha`, `beta`.
  - `/api/v1/user-profile/pension/preview` (POST)
    - Request: `current_age`, `years_of_experience`, `current_monthly_salary`, `is_male`, `alpha`, `beta`, optional `retirement_age`, optional `simulation_mode`.
    - Response (selected): monthly pension (nominal/real), replacement rate (nominal/real), Pillar I/II capital (nominal/real), current/final salary (nominal/real), `timeline`, and `simulation_events`.
  - `/api/v1/fun-facts/` (GET) — returns a list of LLM-generated fun facts.
  - `/api/v1/excel/` (POST) — appends a row to `backend/data/usage.xlsx` (usage stats).

Note: the backend requires a valid `GEMINI_API_KEY`. Without it, settings initialization fails.

## 8. Random events and simulations
Simulation mode in the frontend shows periods without contributions:
- unemployment (no base),
- part‑time work (proportionally lower contributions),
- work abroad without ZUS,
- other breaks (illness, leaves, etc.).

The frontend shows these periods as shaded bands on the timeline. The backend (on demand) uses LLM to generate plausible periods and converts them into contribution multipliers in the model.

## 9. Stats collection and Excel export
- Endpoint: `POST /api/v1/excel/`
- Saves anonymous data to `backend/data/usage.xlsx` (columns per assignment: age, sex, salary, pension nominal/real, postal code, simulation mode, etc.).

## 10. Models and equations
Empirical wage growth with experience (saturation):
- k(x) = 1 + α · (1 − e^(−β·x))
- where `x` is years of experience, and `salary = junior_salary · k(x)`.

We separate nominal and real values (inflation-adjusted). Macro data (inflation, wage dynamics, etc.) enables more realistic projections.

## 11. Roadmap
- Grow into a full app: gradually expose more user-editable parameters (goal: every parameter configurable).
- Improve models and data quality (public and industry sources), increase accuracy and auditability.
- Add auth and a database (user profile, scenario persistence).
- Expand event simulation (more realistic scenarios, parameterization).

## 12. Team
Team Kwarta:
- Kamil Żak — Frontend
- Aleksander Kluska — Backend
- Karol Marszałek — Data models, Backend
- Andrzej Legutko — Machine learning, data models

---

Slide decks in this folder: `presentationPL.pdf` and `presentationENG.pdf`; LaTeX sources in `contentPL/` and `contentENG/`. Images referenced in this README live in `presentation/img/` (for in-repo use).