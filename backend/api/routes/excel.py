from datetime import date, datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException
from starlette.concurrency import run_in_threadpool

from backend.api.schemas import ExcelRequest
from backend.api.services import append_usage_row_to_xlsx

router = APIRouter(prefix="/excel", tags=["excel"])

SEX_MAPPING = {"male": "Mężczyzna", "female": "Kobieta"}
BOOL_MAPPING = {True: "Tak", False: "Nie"}

USAGE_XLSX_PATH = Path(__file__).resolve().parents[2] / "data" / "usage.xlsx"


@router.post("/", summary="Append a row to usage Excel file")
async def append_excel_row(payload: ExcelRequest):
    now = datetime.now()
    row_map = {
        "Data użycia": now.strftime("%d.%m.%Y"),
        "Godzina użycia": now.strftime("%H:%M:%S"),
        "Emerytura oczekiwana": payload.retirement_expected,
        "Wiek": payload.current_age,
        "Płeć": SEX_MAPPING.get(payload.sex, payload.sex),
        "Wysokość wynagrodzenia": payload.salary,
        "Czy uwzględniał okresy choroby": BOOL_MAPPING.get(bool(payload.simulation_mode), "Nie"),
        "Wysokość zgromadzonych środków na koncie i Subkoncie": payload.total_capital_real,
        "Emerytura rzeczywista": payload.monthly_pension_nominal,
        "Emerytura urealniona": payload.monthly_pension_real,
        "Kod pocztowy": payload.zip_code,
    }
    try:
        await run_in_threadpool(append_usage_row_to_xlsx, USAGE_XLSX_PATH, row_map)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to write Excel: {exc}")
    return {"ok": True}
