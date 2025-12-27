"""Gemini Multimodal Live API client for real-time audio conversations."""

import asyncio
import base64
import json
import logging
from typing import AsyncGenerator
from google import genai
from google.genai import types

from .config import GEMINI_API_KEY, GEMINI_MODEL, SYSTEM_INSTRUCTION
from .tools import get_tool_declarations
from .mcp_bridge import mcp_bridge

logger = logging.getLogger(__name__)


class GeminiLiveClient:
    """Client for Gemini Multimodal Live API with audio streaming support."""
    
    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model = GEMINI_MODEL
        self.session = None
        self._is_connected = False
    
    async def connect(self) -> bool:
        """Establish connection to Gemini Live API."""
        try:
            config = types.LiveConnectConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Aoede"  # Female voice
                        )
                    )
                ),
                system_instruction=types.Content(
                    parts=[types.Part(text=SYSTEM_INSTRUCTION)]
                ),
                tools=get_tool_declarations()
            )
            
            self.session = self.client.aio.live.connect(
                model=self.model,
                config=config
            )
            
            self._is_connected = True
            logger.info("Connected to Gemini Live API")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Gemini: {e}")
            self._is_connected = False
            return False
    
    async def send_audio(self, audio_data: bytes) -> None:
        """
        Send audio data to Gemini.
        
        Args:
            audio_data: PCM audio data (16-bit, 16kHz, mono)
        """
        if not self.session:
            logger.warning("No active session, cannot send audio")
            return
        
        try:
            # Send audio as realtime input
            await self.session.send(
                input=types.LiveClientRealtimeInput(
                    media_chunks=[
                        types.Blob(
                            mime_type="audio/pcm;rate=16000",
                            data=audio_data
                        )
                    ]
                )
            )
        except Exception as e:
            logger.error(f"Error sending audio: {e}")
    
    async def receive_responses(self) -> AsyncGenerator[dict, None]:
        """
        Receive responses from Gemini (audio and function calls).
        
        Yields:
            Dict with either 'audio' (base64 encoded) or 'function_call' data
        """
        if not self.session:
            logger.warning("No active session")
            return
        
        try:
            async for response in self.session:
                # Handle server content (audio responses)
                if hasattr(response, 'server_content') and response.server_content:
                    content = response.server_content
                    
                    if hasattr(content, 'model_turn') and content.model_turn:
                        for part in content.model_turn.parts:
                            # Audio response
                            if hasattr(part, 'inline_data') and part.inline_data:
                                audio_base64 = base64.b64encode(
                                    part.inline_data.data
                                ).decode('utf-8')
                                yield {
                                    "type": "audio",
                                    "data": audio_base64,
                                    "mime_type": part.inline_data.mime_type
                                }
                            
                            # Text response (for logging)
                            if hasattr(part, 'text') and part.text:
                                logger.info(f"Gemini text: {part.text}")
                                yield {
                                    "type": "text",
                                    "data": part.text
                                }
                
                # Handle tool calls
                if hasattr(response, 'tool_call') and response.tool_call:
                    for function_call in response.tool_call.function_calls:
                        yield {
                            "type": "function_call",
                            "name": function_call.name,
                            "call_id": function_call.id,
                            "arguments": dict(function_call.args) if function_call.args else {}
                        }
                        
                        # Execute the function via MCP bridge
                        result = await mcp_bridge.execute_function(
                            function_call.name,
                            dict(function_call.args) if function_call.args else {}
                        )
                        
                        # Send function result back to Gemini
                        await self.send_function_result(function_call.id, result)
                
                # Handle turn complete
                if hasattr(response, 'server_content') and response.server_content:
                    if hasattr(response.server_content, 'turn_complete') and response.server_content.turn_complete:
                        yield {"type": "turn_complete"}
                        
        except Exception as e:
            logger.error(f"Error receiving responses: {e}")
            yield {"type": "error", "message": str(e)}
    
    async def send_function_result(self, call_id: str, result: dict) -> None:
        """Send function call result back to Gemini."""
        if not self.session:
            return
        
        try:
            await self.session.send(
                input=types.LiveClientToolResponse(
                    function_responses=[
                        types.FunctionResponse(
                            id=call_id,
                            name="",  # Name is optional for response
                            response=result
                        )
                    ]
                )
            )
            logger.info(f"Sent function result for call {call_id}")
        except Exception as e:
            logger.error(f"Error sending function result: {e}")
    
    async def disconnect(self) -> None:
        """Close the Gemini session."""
        if self.session:
            try:
                await self.session.close()
                logger.info("Disconnected from Gemini Live API")
            except Exception as e:
                logger.error(f"Error disconnecting: {e}")
            finally:
                self.session = None
                self._is_connected = False
    
    @property
    def is_connected(self) -> bool:
        return self._is_connected
