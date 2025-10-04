# Backend for Finansowy Kompas

- Poetry (package manager)
- FastAPI
- black (formatter), ruff (linter), mypy (static type checker)

For the models:
- numpy
- pandas
- scipy
- sklearn
- matplotlib
- seaborn

## Development with Poetry

1. Install Poetry (https://python-poetry.org/docs/#installation)
2. Install dependencies:
   - poetry install
3. Activate the virtualenv and run the API locally:
   - poetry run uvicorn src.main:app --reload
4. Run linters/formatters:
   - poetry run ruff check .
   - poetry run black .
   - poetry run mypy .

## Deployment (Vercel)

Vercel installs Python dependencies from requirements.txt using pip. The requirements.txt is kept in sync with pyproject.toml. If you update dependencies via Poetry, export or regenerate requirements.txt accordingly, or update it manually to match.