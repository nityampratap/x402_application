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
    USDC_CONTRACT_ADDRESS: str = Field(default="0x036Cb52701cb08910E44913b865d06799f7f93b3")
    X402_PRIVATE_KEY: Optional[str] = Field(default=None, description="Web3 Private key for client x402 payment signer")
    WALLET_PRIVATE_KEY: Optional[str] = Field(default=None)
    PAYMENT_RECIPIENT_ADDRESS: Optional[str] = Field(default=None, description="Key-controlled seller wallet address for receiving x402 micropayments")
    X402_FACILITATOR_URL: str = Field(default="https://x402.org/facilitator")

    @property
    def active_private_key(self) -> Optional[str]:
        return self.X402_PRIVATE_KEY or self.WALLET_PRIVATE_KEY or "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a6f363852"

    @property
    def recipient_address(self) -> str:
        if self.PAYMENT_RECIPIENT_ADDRESS:
            return self.PAYMENT_RECIPIENT_ADDRESS
        pk = self.active_private_key
        if pk:
            try:
                from eth_account import Account
                return Account.from_key(pk).address
            except Exception:
                pass
        return "0xcF107c0D3537878010Df6b8B8d439a92D08AD18d"

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
                "X402_PRIVATE_KEY": "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a6f363852",
                "WALLET_PRIVATE_KEY": "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a6f363852"
            }
        _settings_instance = Settings(**env_dict)
    return _settings_instance
