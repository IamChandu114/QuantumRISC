from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.app.api.routes import build_router
from backend.app.config.settings import get_settings
from backend.app.sessions.manager import SessionManager


settings = get_settings()
manager = SessionManager(settings)
app = FastAPI(title="QuantumRISC Backend", version="1.0.0")
app.include_router(build_router(manager))

website_dist = settings.frontend_root / "website" / "dist"
docs_dist = settings.frontend_root / "docs" / "dist"
if (settings.frontend_root / "studio").exists():
    app.mount("/studio/static", StaticFiles(directory=str(settings.frontend_root / "studio")), name="studio-static")
if (settings.frontend_root / "website").exists():
    app.mount("/website/static", StaticFiles(directory=str(settings.frontend_root / "website")), name="website-static")
if website_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(website_dist / "assets")), name="website-assets")
if docs_dist.exists():
    app.mount("/docs/assets", StaticFiles(directory=str(docs_dist / "assets")), name="docs-assets")
    app.mount("/documentation/assets", StaticFiles(directory=str(docs_dist / "assets")), name="docs-assets-alias")


@app.get("/")
async def root():
    path = website_dist / "index.html" if website_dist.exists() else settings.frontend_root / "website" / "index.html"
    return FileResponse(str(path)) if path.exists() else {"ok": True}


@app.get("/studio")
async def studio():
    path = settings.frontend_root / "studio" / "quantumrisc-studio.html"
    return FileResponse(str(path)) if path.exists() else {"ok": True}


@app.get("/docs")
@app.get("/docs/{path:path}")
@app.get("/documentation")
@app.get("/documentation/{path:path}")
async def docs(path: str = ""):
    index = docs_dist / "index.html"
    return FileResponse(str(index)) if index.exists() else {"ok": True}
