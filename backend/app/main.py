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

from fastapi import Request

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"REQUEST: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"RESPONSE: {response.status_code}")
    return response


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

    toolchain_status = {
        "iverilog": "available" if iverilog_resolved else "missing",
        "vvp": "available" if vvp_resolved else "missing",
    }

    logger.info(
        "Simulation toolchain status: "
        f"iverilog={toolchain_status['iverilog']} ({settings.iverilog_path}), "
        f"vvp={toolchain_status['vvp']} ({settings.vvp_path})"
    )

    if not iverilog_resolved or not vvp_resolved:
        logger.info(
            "Simulation toolchain unavailable in this container. "
            "Compile and run endpoints stay disabled until Icarus Verilog and vvp are present. "
            "This is an environment limitation, not a backend failure."
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

