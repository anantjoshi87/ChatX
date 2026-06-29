from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.security import get_current_user  # Import our new security check

router = APIRouter(prefix="/api/chat", tags=["Chat"])


class ChatMessageRequest(BaseModel):
    conversation_id: str
    message: str


@router.post("/stream")
async def stream_chat_response(
    payload: ChatMessageRequest,
    user_id: str = Depends(get_current_user),  # <-- The Guardrail
):
    try:
        # If the code reaches here, the user is 100% authenticated!
        print(f"Authenticated User ID: {user_id}")
        print(f"Chat Session: {payload.conversation_id}")

        # return StreamingResponse(
        #     langchain_stream(payload.message), media_type="text/event-stream"
        # )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
