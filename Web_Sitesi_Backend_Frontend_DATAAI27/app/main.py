# app/main.py - SADELEŞTİRİLMİŞ, GİRİŞSİZ FİNAL VERSİYON

import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI(title="Kalp Analizi Arayüzü")

# Proje kök dizinini bul
BASE_DIR = Path(__file__).parent.parent
STATIC_DIR = BASE_DIR / "app" / "static"
TEMPLATES_DIR = BASE_DIR / "app" / "templates"

# Dosya yollarını dinamik olarak ayarla
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

@app.get("/", response_class=HTMLResponse)
async def get_home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/risk-hesapla", response_class=HTMLResponse)
async def get_risk_hesapla(request: Request):
    return templates.TemplateResponse("risk-hesapla.html", {"request": request})

@app.get("/rapor", response_class=HTMLResponse)
async def get_rapor(request: Request):
    return templates.TemplateResponse("rapor.html", {"request": request})