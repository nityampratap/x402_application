"""
Shared test fixtures for EvidenceOS backend test suite.
"""
import os
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# --------------------------------------------------------------------------- #
#  Ensure a deterministic env for every test run (no .env file side-effects)  #
# --------------------------------------------------------------------------- #
os.environ.setdefault("CHAIN_ID", "84532")
os.environ.setdefault("USDC_CONTRACT_ADDRESS", "0x036Cb52701cb08910E44913b865d06799f7f93b3")
# A well-known Ethereum test private key (publicly documented, zero value).
os.environ.setdefault(
    "X402_PRIVATE_KEY",
    "0x0000000000000000000000000000000000000000000000000000000000000001",
)
os.environ.setdefault("CLAUDE_API_KEY", "sk-ant-api03-template-placeholder")


@pytest_asyncio.fixture
async def memory_db() -> AsyncSession:
    """Yield a fully migrated in-memory SQLite AsyncSession, rolled back after each test."""
    from app.db.base import Base

    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with factory() as session:
        yield session

    await engine.dispose()
