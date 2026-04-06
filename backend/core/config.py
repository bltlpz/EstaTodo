from pathlib import Path

from pydantic_settings import BaseSettings

# Resolver ruta al modelo desde backend/
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_MODEL = (_BACKEND_DIR / ".." / "edge" / "models" / "guardchain.pt").resolve()


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///C:/Users/BALTAZAR/safeguard/backend/safeguard.db"
    SECRET_KEY: str = "dev-secret-change-in-prod"
    POLYGON_RPC_URL: str = "https://rpc-amoy.polygon.technology"
    WALLET_PRIVATE_KEY: str = ""
    CONTRACT_ADDRESS: str = ""

    # Camera: webcam local para dev, RTSP URL para prod
    CAMERA_SOURCE: str = "0"
    LOOP_VIDEO: bool = True   # Si True, reinicia el video al terminar (útil para dev)

    # Clip extraction
    CLIP_SECONDS: int = 20
    CLIP_BUFFER_FRAMES: int = 600
    KEY_FRAMES_COUNT: int = 5

    # Storage paths (resueltos desde backend/)
    STORAGE_PATH: str = str(_BACKEND_DIR / "storage")
    CLIPS_PATH: str = str(_BACKEND_DIR / "storage" / "clips")
    FRAMES_PATH: str = str(_BACKEND_DIR / "storage" / "frames")
    CLIP_STORAGE_PATH: str = str(_BACKEND_DIR / "storage" / "clips")

    # Edge agent
    INGEST_URL: str = "http://localhost:8000/api/events/ingest"

    # Model
    MODEL_PATH: str = str(_DEFAULT_MODEL)
    CONFIDENCE_THRESHOLD: float = 0.50

    # Avalanche L1
    AVALANCHE_RPC_URL: str = "http://127.0.0.1:9654/ext/bc/CCNsNWWd9riq2LGv3BTQJmk6WjmkFQ3eKY7z8JhfjzSGY1A6e/rpc"
    AVALANCHE_CHAIN_ID: int = 99372
    AVALANCHE_PRIVATE_KEY: str = "56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
    AVALANCHE_CONTRACT_ADDRESS: str = ""  # se llena después del deploy
    BLOCKCHAIN_ENABLED: bool = True  # False = modo sin blockchain para dev

    # IPFS Pinata
    PINATA_JWT: str = ""  # vacío = IPFS deshabilitado
    PINATA_GATEWAY: str = "https://gateway.pinata.cloud/ipfs"

    # Claude Vision (Anthropic)
    ANTHROPIC_API_KEY: str = ""  # vacío = modo mock determinístico

    # Supabase (Auth/DB)
    next_public_supabase_url: str = ""
    next_public_supabase_anon_key: str = ""

    # Mercado Pago
    mp_public_key: str = ""
    mp_access_token: str = ""

    # Suscripciones en L1
    subscription_contract_address: str = ""

    # Mapbox
    next_public_mapbox_token: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
