from typing import Dict, Type
from app.agents.base import BaseEvidenceAgent
from app.agents.web_agent import WebSearchAgent
from app.agents.financial_agent import FinancialRegistryAgent

class AgentRegistry:
    _registry: Dict[str, Type] = {
        "web_search": WebSearchAgent,
        "financial_registry": FinancialRegistryAgent
    }

    @classmethod
    def get_agent(cls, agent_type: str, **kwargs):
        agent_cls = cls._registry.get(agent_type, WebSearchAgent)
        return agent_cls(**kwargs)

    @classmethod
    def list_available_agents(cls):
        return list(cls._registry.keys())
