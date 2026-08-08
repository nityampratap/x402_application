import asyncio
import json
from typing import Dict, Set, Any
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

router = APIRouter(tags=["Streaming"])

class SSEManager:
    def __init__(self):
        self.subscribers: Dict[str, Set[asyncio.Queue]] = {}

    def subscribe(self, investigation_id: str) -> asyncio.Queue:
        if investigation_id not in self.subscribers:
            self.subscribers[investigation_id] = set()
        queue = asyncio.Queue()
        self.subscribers[investigation_id].add(queue)
        return queue

    def unsubscribe(self, investigation_id: str, queue: asyncio.Queue):
        if investigation_id in self.subscribers:
            self.subscribers[investigation_id].discard(queue)
            if not self.subscribers[investigation_id]:
                del self.subscribers[investigation_id]

    async def broadcast_event(self, event_type: str, data: Dict[str, Any]):
        investigation_id = data.get("investigation_id")
        if not investigation_id or investigation_id not in self.subscribers:
            return
        
        message = {
            "event": event_type,
            "data": json.dumps(data)
        }

        for queue in list(self.subscribers[investigation_id]):
            try:
                await queue.put(message)
            except Exception:
                pass

sse_manager = SSEManager()

@router.get("/investigations/{investigation_id}/stream")
async def stream_investigation_events(investigation_id: str, request: Request):
    async def event_generator():
        queue = sse_manager.subscribe(investigation_id)
        try:
            # Yield initial connection event
            yield {
                "event": "CONNECTED",
                "data": json.dumps({"status": "CONNECTED", "investigation_id": investigation_id})
            }

            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield msg
                except asyncio.TimeoutError:
                    # Ping to keep connection alive
                    yield {"event": "PING", "data": "{}"}
        finally:
            sse_manager.unsubscribe(investigation_id, queue)

    return EventSourceResponse(event_generator())
