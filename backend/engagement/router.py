from fastapi import APIRouter

from engagement.duels.router import router as duels_router
from engagement.realtime.router import router as realtime_doc_router
from engagement.scoring.router import router as scoring_router
from engagement.tempo.router import router as tempo_router

router = APIRouter(prefix="/api/v1", tags=["Engagement"])
router.include_router(scoring_router)
router.include_router(realtime_doc_router)
router.include_router(tempo_router)
router.include_router(duels_router)
