import os
import json
import asyncio
import httpx
from typing import Optional, Dict, Any, List
from app.core.config import get_settings

class UniversalLLMEngine:
    def __init__(self):
        self.settings = get_settings()

    def _get_configured_providers(self) -> List[Dict[str, Any]]:
        s = self.settings
        providers = []
        
        # 1. Grok (xAI)
        xai_key = (s.XAI_API_KEY or s.GROK_API_KEY or "").strip()
        if xai_key and not xai_key.startswith("your_"):
            providers.append({
                "name": "Grok (xAI)",
                "type": "openai_compatible",
                "api_key": xai_key,
                "url": "https://api.x.ai/v1/chat/completions",
                "model": "grok-3"
            })

        # 2. Google Gemini (Free tier available)
        gemini_key = (s.GEMINI_API_KEY or "").strip()
        if gemini_key and not gemini_key.startswith("your_"):
            providers.append({
                "name": "Google Gemini",
                "type": "gemini_native",
                "api_key": gemini_key,
                "url": f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}",
                "model": "gemini-2.5-flash"
            })

        # 3. Groq (Free fast tier)
        groq_key = (s.GROQ_API_KEY or "").strip()
        if groq_key and not groq_key.startswith("your_"):
            providers.append({
                "name": "Groq",
                "type": "openai_compatible",
                "api_key": groq_key,
                "url": "https://api.groq.com/openai/v1/chat/completions",
                "model": "qwen/qwen3.6-27b"
            })

        # 4. OpenAI
        openai_key = (s.OPENAI_API_KEY or "").strip()
        if openai_key and not openai_key.startswith("your_"):
            providers.append({
                "name": "OpenAI",
                "type": "openai_compatible",
                "api_key": openai_key,
                "url": "https://api.openai.com/v1/chat/completions",
                "model": "gpt-4o-mini"
            })

        # 5. OpenRouter
        openrouter_key = (s.OPENROUTER_API_KEY or "").strip()
        if openrouter_key and not openrouter_key.startswith("your_"):
            providers.append({
                "name": "OpenRouter",
                "type": "openai_compatible",
                "api_key": openrouter_key,
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "model": "meta-llama/llama-3.3-70b-instruct"
            })

        # 6. Anthropic Claude
        claude_key = (s.CLAUDE_API_KEY or s.ANTHROPIC_API_KEY or "").strip()
        if claude_key and not claude_key.startswith("sk-ant-api03-template") and not claude_key.startswith("your_"):
            providers.append({
                "name": "Anthropic Claude",
                "type": "anthropic",
                "api_key": claude_key,
                "url": "https://api.anthropic.com/v1/messages",
                "model": "claude-3-5-sonnet-20241022"
            })

        return providers

    def _get_active_provider(self) -> Optional[Dict[str, Any]]:
        providers = self._get_configured_providers()
        return providers[0] if providers else None

    async def generate_completion(self, prompt: str, json_mode: bool = True) -> Optional[str]:
        providers = self._get_configured_providers()
        if not providers:
            print("[LLM Engine Warning]: No LLM provider API keys configured in .env!")
            return None

        async with httpx.AsyncClient(timeout=45.0) as client:
            for provider in providers:
                p_name = provider["name"]
                p_type = provider["type"]
                api_key = provider["api_key"]
                url = provider["url"]
                model = provider["model"]

                try:
                    if p_type == "openai_compatible":
                        headers = {
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json"
                        }
                        
                        if p_name == "Grok (xAI)":
                            target_models = ["grok-3", "grok-2-latest", "grok-2"]
                        elif p_name == "Groq":
                            target_models = ["groq/compound", "groq/compound-mini", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"]
                        else:
                            target_models = [model]
                        
                        for target_model in target_models:
                            payload = {
                                "model": target_model,
                                "messages": [{"role": "user", "content": prompt}],
                                "temperature": 0.2
                            }
                            if json_mode and p_name != "Groq":
                                payload["response_format"] = {"type": "json_object"}

                            res = await client.post(url, json=payload, headers=headers)
                            if res.status_code == 200:
                                data = res.json()
                                return data["choices"][0]["message"]["content"]
                            elif res.status_code == 429:
                                print(f"[{p_name} 429 Rate Limit]: Retrying in 2s...")
                                await asyncio.sleep(2.0)
                                res = await client.post(url, json=payload, headers=headers)
                                if res.status_code == 200:
                                    return res.json()["choices"][0]["message"]["content"]
                                break
                            elif res.status_code in (402, 403) or "doesn't have any credits" in res.text:
                                print(f"[LLM Engine Notice]: {p_name} returned {res.status_code} (No Credits / Unlicensed). Trying next provider...")
                                break
                            elif "Model not found" in res.text or res.status_code == 404:
                                continue
                            else:
                                print(f"[{p_name} Error {res.status_code}]: {res.text[:120]}. Trying next provider...")
                                break

                    elif p_type == "gemini_native":
                        headers = {"Content-Type": "application/json"}
                        payload = {
                            "contents": [{"parts": [{"text": prompt}]}]
                        }
                        if json_mode:
                            payload["generationConfig"] = {"responseMimeType": "application/json"}

                        gemini_models = ["gemini-2.5-flash", "gemini-2.5-pro"]
                        for g_model in gemini_models:
                            g_url = f"https://generativelanguage.googleapis.com/v1beta/models/{g_model}:generateContent?key={api_key}"
                            
                            res = await client.post(g_url, json=payload, headers=headers)
                            if res.status_code == 200:
                                data = res.json()
                                candidates = data.get("candidates", [])
                                if candidates:
                                    parts = candidates[0].get("content", {}).get("parts", [])
                                    if parts:
                                        return parts[0].get("text", "")
                            elif res.status_code == 429 or "RESOURCE_EXHAUSTED" in res.text:
                                print(f"[Gemini Notice]: 429 rate limit hit for {g_model}. Retrying in 2s...")
                                await asyncio.sleep(2.0)
                            else:
                                print(f"[Gemini Error {res.status_code}]: {res.text[:120]}. Trying next provider...")
                                break

                    elif p_type == "anthropic":
                        headers = {
                            "x-api-key": api_key,
                            "anthropic-version": "2023-06-01",
                            "Content-Type": "application/json"
                        }
                        payload = {
                            "model": model,
                            "max_tokens": 1000,
                            "messages": [{"role": "user", "content": prompt}]
                        }
                        res = await client.post(url, json=payload, headers=headers)
                        if res.status_code == 200:
                            data = res.json()
                            content = data.get("content", [])
                            if content:
                                return content[0].get("text", "")
                        else:
                            print(f"[Anthropic Error {res.status_code}]: {res.text}. Trying next provider...")

                except Exception as e:
                    print(f"[LLM Engine Exec Error for {p_name}]: {e}. Trying next provider...")

        return None

_llm_engine_instance = None

def get_llm_engine() -> UniversalLLMEngine:
    global _llm_engine_instance
    if _llm_engine_instance is None:
        _llm_engine_instance = UniversalLLMEngine()
    return _llm_engine_instance
