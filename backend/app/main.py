"""
GridSenti Backend — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router

app = FastAPI(
    title="GridSenti API",
    description="AI-Assisted Detection & Localization of High-Impedance Downed Conductors",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────
# TODO: Tighten origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {"message": "GridSenti API is running", "docs": "/docs"}
