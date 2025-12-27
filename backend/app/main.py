"""FastAPI main application for AI Receptionist backend.

EXACT copy of Shila pattern for audio handling to fix echo/lag issues.
"""

import asyncio
import base64
import json
import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types

from .config import GEMINI_API_KEY, GEMINI_MODEL, get_system_instruction
from .tools import get_tool_declarations
from .mcp_bridge import mcp_bridge

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("AI Receptionist Backend starting...")
    
    # Initialize MCP Bridge
    logger.info("Initializing MCP Bridge...")
    success = await mcp_bridge.initialize()
    if success:
        logger.info("MCP Bridge initialized successfully")
    else:
        logger.error("MCP Bridge initialization failed")
        
    yield
    logger.info("AI Receptionist Backend shutting down...")
    await mcp_bridge.close()


app = FastAPI(
    title="AI Receptionist - Caliana",
    description="Backend for AI-powered receptionist with Gemini Multimodal Live API",
    version="1.0.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini client - EXACT Shila pattern
client = genai.Client(
    http_options={"api_version": "v1beta"},
    api_key=GEMINI_API_KEY
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "ai-receptionist"}


import datetime

@app.websocket("/ws/call")
async def websocket_call(websocket: WebSocket, persona: str = "sari"):
    """
    WebSocket endpoint for real-time audio call with AI.
    Accepts 'persona' query param (sari/reza).
    """
    await websocket.accept()
    logger.info(f"WebSocket connection accepted. Persona: {persona}")
    
    # Audio queue for smooth playback (Shila pattern)
    audio_out_queue = asyncio.Queue()
    stop_event = asyncio.Event()
    
    try:
        await websocket.send_json({"type": "status", "status": "connecting"})
        
        # Determine system instruction based on persona
        system_instruction = get_system_instruction(persona)
        
        # Inject Current Time for logic awareness
        current_time_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        system_instruction = f"[SYSTEM TIME: {current_time_str}]\n" + system_instruction
        
        # Config - EXACT Shila pattern
        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            output_audio_transcription={},
            input_audio_transcription={},
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name="Aoede" if persona == "sari" else "Puck" # Different voice for Reza
                    )
                )
            ),
            system_instruction=system_instruction,
            tools=get_tool_declarations()
        )
        
        logger.info(f"Connecting to model: {GEMINI_MODEL}")
        
        async with client.aio.live.connect(model=GEMINI_MODEL, config=config) as session:
            logger.info("Connected to Gemini Live API")
            
            await websocket.send_json({"type": "status", "status": "connected"})
            
            # Send initial greeting prompt
            await session.send(input="Mulai percakapan. Sapa penelepon.", end_of_turn=True)
            logger.info("Sent initial prompt")
            
            # Task 1: Receive from Gemini, put audio in queue
            async def receive_from_gemini():
                """EXACT Shila receive_audio pattern."""
                try:
                    while not stop_event.is_set():
                        turn = session.receive()
                        async for response in turn:
                            # Only handle response.data for audio (Shila pattern)
                            if data := response.data:
                                await audio_out_queue.put(data)
                            
                            # Handle tool calls
                            if response.tool_call:
                                for fc in response.tool_call.function_calls:
                                    logger.info(f"Tool call: {fc.name} Arguments: {fc.args}")
                                    await websocket.send_json({
                                        "type": "function_call",
                                        "name": fc.name,
                                        "arguments": dict(fc.args) if fc.args else {}
                                    })
                                    
                                    try:
                                        result = await mcp_bridge.execute_function(
                                            fc.name,
                                            dict(fc.args) if fc.args else {}
                                        )
                                        logger.info(f"Tool result: {result}")
                                    except Exception as e:
                                        logger.error(f"Tool execution error: {e}")
                                        result = {"error": f"Technical issue: {str(e)}", "success": False}
                                    
                                    await session.send(
                                        input=types.LiveClientToolResponse(
                                            function_responses=[
                                                types.FunctionResponse(
                                                    id=fc.id,
                                                    name=fc.name,
                                                    response=result
                                                )
                                            ]
                                        )
                                    )
                                    
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    logger.error(f"Gemini receive error: {e}")
                    logger.error(traceback.format_exc())
            
            # Task 2: Send audio from queue to WebSocket (Shila play_audio pattern)
            async def send_audio_to_client():
                """Send audio from queue to WebSocket - smooth playback."""
                try:
                    while not stop_event.is_set():
                        try:
                            # Get audio from queue with timeout
                            audio_data = await asyncio.wait_for(
                                audio_out_queue.get(),
                                timeout=0.5
                            )
                            
                            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                            await websocket.send_json({
                                "type": "audio",
                                "data": audio_base64
                            })
                            
                        except asyncio.TimeoutError:
                            continue
                            
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    logger.error(f"Audio send error: {e}")
            
            # Task 3: Receive from client and send to Gemini
            async def receive_from_client():
                """Receive audio from WebSocket and forward to Gemini."""
                try:
                    while not stop_event.is_set():
                        try:
                            data = await asyncio.wait_for(
                                websocket.receive_json(),
                                timeout=0.5
                            )
                            
                            if data.get("type") == "audio":
                                audio_bytes = base64.b64decode(data["data"])
                                # Shila pattern: simple dict for audio
                                await session.send(
                                    input={"data": audio_bytes, "mime_type": "audio/pcm"},
                                    end_of_turn=False
                                )
                            
                            elif data.get("type") == "image":
                                # Handle video frame/image input
                                image_bytes = base64.b64decode(data["data"])
                                await session.send(
                                    input={"data": image_bytes, "mime_type": "image/jpeg"},
                                    end_of_turn=False
                                )
                            
                            elif data.get("type") == "end_call":
                                logger.info("Client ended call")
                                stop_event.set()
                                break
                                
                        except asyncio.TimeoutError:
                            continue
                            
                except WebSocketDisconnect:
                    logger.info("WebSocket disconnected")
                    stop_event.set()
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    logger.error(f"Client receive error: {e}")
            
            # Run all 3 tasks concurrently (Shila TaskGroup pattern)
            tasks = [
                asyncio.create_task(receive_from_gemini()),
                asyncio.create_task(send_audio_to_client()),
                asyncio.create_task(receive_from_client())
            ]
            
            try:
                # Wait for any task to complete (usually client disconnect)
                done, pending = await asyncio.wait(
                    tasks,
                    return_when=asyncio.FIRST_COMPLETED
                )
            finally:
                # Cancel remaining tasks
                stop_event.set()
                for task in pending:
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
                    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        logger.error(traceback.format_exc())
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    
    finally:
        logger.info("WebSocket connection closed")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "AI Receptionist - Caliana",
        "version": "1.0.0",
        "endpoints": {"health": "/health", "websocket": "/ws/call"}
    }
