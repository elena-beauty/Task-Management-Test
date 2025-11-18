from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from socketio import ASGIApp
from app.core.config import settings
from app.api.v1.api import api_router
from app.realtime.gateway import sio

# Create FastAPI app
app = FastAPI(
    title="Team Tasks API",
    description="Team task management API with AI assistance",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Build allowed origins list for FastAPI CORS
def get_cors_origins():
    """Get list of allowed origins for CORS"""
    # In development, allow all origins for easier debugging
    if settings.DEBUG:
        return ["*"]
    
    origins = []
    if settings.FRONTEND_URL:
        # Add the configured frontend URL
        origins.extend(settings.FRONTEND_URL.split(","))
        # Also add 0.0.0.0 variant if localhost is specified
        for url in settings.FRONTEND_URL.split(","):
            url = url.strip()
            if "localhost" in url:
                origins.append(url.replace("localhost", "0.0.0.0"))
            elif "0.0.0.0" in url:
                origins.append(url.replace("0.0.0.0", "localhost"))
    # If no origins specified, allow all (development only)
    if not origins:
        origins = ["*"]
    return origins

# CORS middleware - must be before Socket.IO
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

# Mount Socket.IO app
socket_app = ASGIApp(sio, app)

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Team Tasks API",
        "timestamp": __import__("datetime").datetime.now().isoformat(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:socket_app",
        host="0.0.0.0",
        port=int(settings.PORT),
        reload=settings.DEBUG,
    )

