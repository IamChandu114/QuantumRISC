from __future__ import annotations

import logging
from pathlib import Path
import platform
import shutil

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import build_router
from app.config.settings import get_settings
from app.sessions.manager import SessionManager


# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("quantumrisc")

settings = get_settings()
manager = SessionManager(settings)

app = FastAPI(
    title="QuantumRISC Backend",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url="/openapi.json",
)

# FastAPI CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(build_router(manager))

website_dist = settings.frontend_root / "website" / "dist"
docs_dist = settings.frontend_root / "docs" / "dist"
studio_dist = settings.frontend_root / "studio" / "dist"

if studio_dist.exists():
    app.mount("/studio/assets", StaticFiles(directory=str(studio_dist / "assets")), name="studio-assets")
elif (settings.frontend_root / "studio" / "public").exists():
    app.mount("/studio/static", StaticFiles(directory=str(settings.frontend_root / "studio" / "public")), name="studio-static")

if (settings.frontend_root / "website").exists():
    app.mount("/website/static", StaticFiles(directory=str(settings.frontend_root / "website")), name="website-static")
if website_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(website_dist / "assets")), name="website-assets")
if docs_dist.exists():
    app.mount("/docs/assets", StaticFiles(directory=str(docs_dist / "assets")), name="docs-assets")
    app.mount("/documentation/assets", StaticFiles(directory=str(docs_dist / "assets")), name="docs-assets-alias")


@app.on_event("startup")
async def startup_validation():
    logger.info("QuantumRISC v1.0 Production Backend Starting Up")
    logger.info(f"Operating System: {platform.system()} ({platform.machine()})")
    logger.info(f"Active CORS Origins: {settings.cors_origins}")
    
    # 1. Validate SQLite session DB path
    try:
        settings.sqlite_db_path.parent.mkdir(parents=True, exist_ok=True)
        # Check write permissions
        with open(settings.sqlite_db_path, "a"):
            pass
        logger.info(f"Database validation success: SQLite persistence active at '{settings.sqlite_db_path}'")
    except Exception as e:
        logger.error(f"Database validation failure: Unable to write to '{settings.sqlite_db_path}'. Error: {e}")
        
    # 2. Validate simulation toolchains (Icarus Verilog and VVP)
    iverilog_resolved = shutil.which(settings.iverilog_path) or Path(settings.iverilog_path).exists()
    vvp_resolved = shutil.which(settings.vvp_path) or Path(settings.vvp_path).exists()
    
    if iverilog_resolved:
        logger.info(f"Simulation toolchain validation: iverilog binary found at '{settings.iverilog_path}'")
    else:
        logger.warning(
            f"Simulation toolchain verification: iverilog NOT FOUND or not executable at '{settings.iverilog_path}'. "
            "Please ensure Icarus Verilog is installed and configured in system PATH."
        )
        
    if vvp_resolved:
        logger.info(f"Simulation runtime validation: vvp binary found at '{settings.vvp_path}'")
    else:
        logger.warning(
            f"Simulation runtime verification: vvp NOT FOUND or not executable at '{settings.vvp_path}'. "
            "Please ensure vvp runtime is installed and configured in system PATH."
        )


@app.get("/")
async def root():
    path = website_dist / "index.html" if website_dist.exists() else settings.frontend_root / "website" / "index.html"
    return FileResponse(str(path)) if path.exists() else {"ok": True}


@app.get("/studio")
@app.get("/studio/")
@app.get("/studio/{path:path}")
async def studio(path: str = ""):
    path = settings.frontend_root / "studio" / "dist" / "index.html"
    return FileResponse(str(path)) if path.exists() else {"ok": True}


@app.get("/docs")
async def docs_redirect():
    return RedirectResponse(url="/docs/", status_code=307)


@app.get("/documentation")
async def documentation_redirect():
    return RedirectResponse(url="/documentation/", status_code=307)


@app.get("/docs/")
@app.get("/docs/{path:path}")
@app.get("/documentation/")
@app.get("/documentation/{path:path}")
async def docs(path: str = ""):
    index = docs_dist / "index.html"
    return FileResponse(str(index)) if index.exists() else {"ok": True}

