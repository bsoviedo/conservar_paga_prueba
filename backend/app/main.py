from fastapi import FastAPI
from app.api.routes import api_router

app = FastAPI(title="Prueba técnica Conservar Paga")

app.include_router(api_router)