from typing import Dict, Type
from app.agents.base import BaseAgent
from app.agents.web_agent import WebSearchAgent
from app.agents.financial_agent import FinancialRegistryAgent
from app.agents.image_agent import ImageAnalysisAgent

class AgentRegistry:
    _registry: Dict[str, Type] = {
        "web_search": WebSearchAgent,
        "financial_registry": FinancialRegistryAgent,
        "image_analysis": ImageAnalysisAgent
    }

    @classmethod
    def get_agent(cls, agent_type: str, **kwargs):
        agent_cls = cls._registry.get(agent_type, WebSearchAgent)
        return agent_cls(**kwargs)

    @classmethod
    def list_available_agents(cls):
        return list(cls._registry.keys())
