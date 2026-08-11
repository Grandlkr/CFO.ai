from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from ai import router as ai_router
from db import router as db_router
from inventory import router as inventory_router

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(db_router)
app.include_router(ai_router)
app.include_router(inventory_router)
templates = Jinja2Templates(directory="templates")


@app.get("/dashboard")
async def dashboard(request: Request):
    return templates.TemplateResponse(request, "Dashboard.html")

@app.get("/transactions")
async def transactions(request: Request):
    return templates.TemplateResponse(request, "Transactions.html")

@app.get("/inventory")
async def inventory(request: Request):
    return templates.TemplateResponse(request, "Inventory.html")

@app.get("/chat")
async def chat(request: Request):
    return templates.TemplateResponse(request, "AI.html")

@app.get("/reports")
async def reports(request: Request):
    return templates.TemplateResponse(request, "Reports.html")

@app.get("/")
async def auth(request: Request):
    return templates.TemplateResponse(request, "Auth.html")
