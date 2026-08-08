import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    PORT: int = Field(default=8000)
    CORS_ORIGINS: str = Field(default="*")
    
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./evidenceos.db")
    
    CLAUDE_API_KEY: Optional[str] = Field(default=None)
    
    # x402 Web3 Configuration - Required for payment operations
    CHAIN_ID: int = Field(description="Base Sepolia Chain ID (84532)")
    RPC_URL: str = Field(default="https://sepolia.base.org")
    USDC_CONTRACT_ADDRESS: str = Field(description="USDC Contract Address on Base Sepolia")
    WALLET_PRIVATE_KEY: Optional[str] = Field(default=None)
    X402_FACILITATOR_URL: str = Field(default="https://x402.org/api")

    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

# Lazy settings instance
_settings_instance: Optional[Settings] = None

def get_settings() -> Settings:
    global _settings_instance
    if _settings_instance is None:
        # Fallback defaults for dev environment if .env is missing
        env_dict = {}
        if not os.path.exists(".env"):
            env_dict = {
                "CHAIN_ID": 84532,
                "USDC_CONTRACT_ADDRESS": "0x036Cb52701cb08910E44913b865d06799f7f93b3",
                "WALLET_PRIVATE_KEY": "0x0000000000000000000000000000000000000000000000000000000000000001"
            }
        _settings_instance = Settings(**env_dict)
    return _settings_instance
