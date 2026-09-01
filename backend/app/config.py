import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017/thermoshelter"
    JOBS_DIR: str = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../simulation_jobs")
    )
    OPEN_METEO_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_TIMEOUT_SECONDS: int = 5
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    ANSYS_EXE_PATH: str = ""
    ANSYS_TIMEOUT_SECONDS: int = 300

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
