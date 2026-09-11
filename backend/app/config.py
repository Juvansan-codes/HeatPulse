from pydantic_settings import BaseSettings

import os

class Settings(BaseSettings):
    database_url: str = ""
    supabase_url: str = ""
    supabase_key: str = ""

    # Allow extra env vars that are not defined in the model
    model_config = {
        "env_file": ".env" if os.path.exists(".env") else "../.env" if os.path.exists("../.env") else None,
        "extra": "ignore"
    }

settings = Settings()
