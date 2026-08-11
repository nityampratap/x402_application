# EvidenceOS 🛡️⚡
> **Autonomous Evidence-Purchasing & Fact Verification Platform powered by x402 Micropayments**

EvidenceOS is an autonomous agentic system that verifies factual claims by purchasing paywalled evidence on-demand via the **x402 Micropayment Protocol** on the **Base Sepolia EVM Testnet**.

It combines LLM claim planning, exact **0/1 Knapsack budget optimization**, **parallel scatter-gather multi-agent execution**, and **on-chain USDC micro-settlement** to deliver verifiable, transparent truth reports.

---

## 📐 System Architecture

![EvidenceOS Architecture Diagram](docs/architecture.png)

For detailed system component interactions, sequence diagrams, and database schemas, see [docs/architecture.md](docs/architecture.md).

---

## ✨ Features

- **Autonomous Claim Decomposition**: Automatically splits complex factual claims into open-web and paywalled sub-questions.
- **0/1 Knapsack Evidence Budgeting**: Optimizes expected information value density within user-specified USDC spend limits ($0.001 - $0.010 USDC).
- **Parallel Multi-Agent Execution**: Executes sub-investigations concurrently using `asyncio.gather` for minimal latency.
- **x402 Micropayment Protocol**: Seamless HTTP 402 payment challenge handling, EVM wallet signature generation, and Base Sepolia USDC on-chain settlement.
- **Live SSE Activity Log & Audit Replay**: Real-time progress updates and chronological payment timeline with "Why Did I Pay?" value justification panels.

---

## 🛠️ Quick Start & Setup Instructions

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: v18+ and `npm`
- **Git**

### 1. Clone Repository & Setup Environment

```bash
git clone https://github.com/EvidenceOS/EvidenceOS.git
cd EvidenceOS
cp .env.example .env
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

---

## 👛 How to Fund a Test Wallet (Base Sepolia)

To execute live x402 micropayment investigations on Base Sepolia, you need a testnet EVM wallet funded with Base Sepolia ETH (for gas) and Sepolia USDC.

### Step 1: Generate an EVM Wallet
Generate a standard EVM wallet (e.g. using MetaMask or `eth-account` in Python) and export its private key.

### Step 2: Obtain Base Sepolia Testnet ETH
Get free Base Sepolia ETH for gas from any of the following faucets:
- [Coinbase Base Sepolia Faucet](https://faucet.quicknode.com/base/sepolia)
- [Alchemy Base Sepolia Faucet](https://www.bchainfaucet.com/base-sepolia)
- [LearnWeb3 Base Sepolia Faucet](https://learnweb3.io/faucets/base_sepolia)

### Step 3: Obtain Base Sepolia USDC
Mint testnet USDC on Base Sepolia:
- **Contract Address**: `0x036Cb52701cb08910E44913b865d06799f7f93b3`
- **Circle USDC Faucet**: Select Base Sepolia on [Circle Testnet Faucet](https://faucet.circle.com/) to receive testnet USDC directly to your wallet address.

### Step 4: Configure Your `.env`
Add your private key to your `.env` file:

```env
CHAIN_ID=84532
RPC_URL=https://sepolia.base.org
USDC_CONTRACT_ADDRESS=0x036Cb52701cb08910E44913b865d06799f7f93b3
X402_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

---

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
python main.py
```
The FastAPI backend will start at `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs`.

### Start Frontend Application

```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

Run the complete backend unit & integration test suite (includes x402 client success/failure tests, 0/1 knapsack unit tests, and orchestrator parallel routing tests):

```bash
cd backend
python -m pytest tests/test_x402_client_v2.py tests/test_knapsack.py tests/test_orchestrator_parallel.py -v
```

---

## ⚙️ Environment Configuration Reference

| Variable | Description |
|---|---|
| `ENVIRONMENT` | Deployment environment mode (`development`, `staging`, `production`) |
| `PORT` | FastAPI backend server port (default: `8000`) |
| `CORS_ORIGINS` | Allowed CORS origins for frontend client requests |
| `DATABASE_URL` | SQLAlchemy async connection URI (`sqlite+aiosqlite:///./evidenceos.db`) |
| `CLAUDE_API_KEY` | Anthropic Claude API key for claim planning & value density scoring |
| `CHAIN_ID` | Base Sepolia EVM chain ID (`84532`) |
| `RPC_URL` | Base Sepolia public JSON-RPC endpoint (`https://sepolia.base.org`) |
| `USDC_CONTRACT_ADDRESS` | USDC token contract address on Base Sepolia (`0x036Cb52701cb08910E44913b865d06799f7f93b3`) |
| `X402_PRIVATE_KEY` | Private key for the client x402 payment signing EVM wallet |
| `WALLET_PRIVATE_KEY` | Alternative private key fallback for x402 client wallet |
| `PAYMENT_RECIPIENT_ADDRESS` | Seller wallet address for receiving x402 micropayments |
| `X402_FACILITATOR_URL` | x402 protocol facilitator endpoint (`https://x402.org/facilitator`) |
| `NEWSAPI_KEY` | NewsAPI.org API key for live paid news article endpoint |

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
