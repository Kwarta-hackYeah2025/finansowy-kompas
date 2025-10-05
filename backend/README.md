# Finansowy Kompas – Backend

## 🇵🇱 Polski

---

Jednostka backendowa projektu Finansowy Kompas zbudowana w FastAPI. Oferuje estymację wynagrodzenia, podgląd emerytury (także z trybem symulacji przerw w pracy), ciekawostki (LLM) oraz proste logowanie użycia do Excela.

### Wymagania
- Python 3.13+
- `uv` (zalecane) lub `pip`
- Ważny klucz API Google Gemini

### Szybki start (uv)
- Dodaj plik `.env` (patrz niżej) do katalogu backend.
- Zainstaluj zależności: `uv sync`
- Uruchom serwer deweloperski: `uv run uvicorn api.main:app --reload --port 8000`
- Dokumentacja (tylko DEV): http://localhost:8000/docs

### Zmienne środowiskowe (.env)
- `GEMINI_API_KEY=twój_klucz` — WYMAGANE
- `environment=DEVELOPMENT|PRODUCTION` — opcjonalne (domyślnie: DEVELOPMENT; dokumentacja włączona tylko w DEVELOPMENT)
- `debug=true|false` — opcjonalne (domyślnie: true; przy true CORS jest otwarte dla DEV)

### Endpointy API (prefiks: `/api/v1`)
- `GET /health/liveness` — test żywotności
- `GET /health/readiness` — gotowość aplikacji
- `POST /salary/calculate` — zwraca estymowaną pensję i parametry
- `POST /user-profile/pension/preview` — podgląd emerytury (nominalnie/realnie, oś czasu); wspiera `simulation_mode`
- `GET /fun-facts/` — ciekawostka generowana przez Gemini
- `POST /excel/` — dopisuje wpis użycia do `data/usage.xlsx`

### Uwagi
- W produkcji ustaw `environment=PRODUCTION`, aby wyłączyć dokumentację.
- Zapis do Excela trafia do `data/usage.xlsx` — zapewnij uprawnienia zapisu.
- Alternatywne uruchomienie: `python api/main.py` (uruchamia Uvicorn z domyślnymi ustawieniami).
- Narzędzia deweloperskie: `ruff`, `black`, `mypy` (uruchamiaj przez `uv run`).

—
Ten README to zwięzła instrukcja tylko dla backendu. Szerszy kontekst znajdziesz w README w katalogu głównym repozytorium.

## 🇺🇸 English

---

FastAPI backend for the Finansowy Kompas project. It provides salary estimation, pension preview (with optional work-break simulation), fun facts (LLM), and a simple Excel usage logger.

### Requirements
- Python 3.13+
- `uv` (recommended) or `pip`
- A valid Google Gemini API key

### Quick start (uv)
- Place your `.env` (see below) in the backend folder.
- Install dependencies: `uv sync`
- Run dev server: `uv run uvicorn api.main:app --reload --port 8000`
- Open docs (DEV only): http://localhost:8000/docs

### Environment (.env)
- `GEMINI_API_KEY=your_key_here` — REQUIRED
- `environment=DEVELOPMENT|PRODUCTION` — optional (default: DEVELOPMENT; docs available only in DEVELOPMENT)
- `debug=true|false` — optional (default: true; when true, CORS is fully open for development)

### API endpoints (prefix: `/api/v1`)
- `GET /health/liveness` — basic health check
- `GET /health/readiness` — readiness probe
- `POST /salary/calculate` — returns estimated salary and related parameters
- `POST /user-profile/pension/preview` — pension preview (nominal/real, timeline); supports `simulation_mode`
- `GET /fun-facts/` — returns a fun fact generated via Gemini
- `POST /excel/` — appends a usage row to `data/usage.xlsx`

### Notes
- In production, set `environment=PRODUCTION` to disable docs and tighten behavior.
- Excel writes to `data/usage.xlsx`. Ensure the process has write access.
- Alternative run: `python api/main.py` (starts Uvicorn with defaults).
- Dev tools available: `ruff`, `black`, `mypy` (via `uv run`).

—
This README is a succinct backend‑only guide. For broader project context, see the repository root README.