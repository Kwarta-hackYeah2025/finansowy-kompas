from fastapi import APIRouter

from .health import router as health_router
from .salary import router as salary_router
from .user_profile import router as user_profile_router
from .fun_facts import router as fun_facts_router
from .excel import router as excel_router

router = APIRouter(prefix="/api/v1")
router.include_router(health_router)
router.include_router(salary_router)
router.include_router(user_profile_router)
router.include_router(fun_facts_router)
router.include_router(excel_router)
