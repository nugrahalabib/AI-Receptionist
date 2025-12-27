"""MCP Bridge for n8n integration - uses Streamable HTTP (POST with SSE responses)."""

import httpx
import logging
import uuid
import json
import asyncio
from typing import Any
from .config import N8N_MCP_URL, N8N_AUTH_TOKEN

logger = logging.getLogger(__name__)

class MCPBridge:
    """
    MCP Bridge for n8n Instance Level.
    Uses POST requests with Accept: text/event-stream.
    Responses are SSE-wrapped JSON.
    Maintains session via Cookies in persistent client.
    """
    
    def __init__(self, mcp_url: str | None = None, auth_token: str | None = None):
        self.mcp_url = mcp_url or N8N_MCP_URL
        self.auth_token = auth_token or N8N_AUTH_TOKEN
        self.timeout = 60.0
        # Map internal tool names to n8n Workflow IDs found via search_workflows
        self.tool_mapping = {
            "client_lookup": "PiHySWYpcDwjUq87",          # [WEBHOOK] Tool - Client Lookup
            "create_client": "KymrzNh4Jth9v16l",          # [WEBHOOK] Tool - New Client CRM
            "check_availability": "8cRknpaIMUfpEbRv",     # [WEBHOOK] Tool - Check Availability
            "book_event": "Ao6wuSMbydtD76ai",             # [WEBHOOK] Tool - Book Event
            "lookup_appointment": "p5WAEBT7eViEUcN0",     # [WEBHOOK] Tool - Lookup Appointment
            "reschedule_appointment": "JOIq7XOABi7w6Qlk", # [WEBHOOK] Tool - Reschedule Appointment
            "cancel_appointment": "M7g6pQuSleRyPGcm"      # [WEBHOOK] Tool - Cancel Appointment
        }
        self._initialized = False
        self._client: httpx.AsyncClient | None = None
        self._lock = asyncio.Lock()

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self.timeout,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json, text/event-stream",
                    "Authorization": self.auth_token
                }
            )
        # Ensure Auth is always set (in case of recreation)
        if self.auth_token: 
             self._client.headers["Authorization"] = self.auth_token
        return self._client

    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None
            self._initialized = False
            logger.info("MCP Bridge closed")
        
    async def _parse_response(self, response: httpx.Response) -> dict[str, Any]:
        """Parse response which might be JSON or SSE-wrapped JSON."""
        msg = f"Response {response.status_code}"
        text = response.text.strip()
        logger.info(f"{msg}: {text[:500]}...") 
        
        try:
            return response.json()
        except:
            pass
            
        if "data:" in text:
            for line in text.split("\n"):
                if line.startswith("data:"):
                    data_str = line[5:].strip()
                    try:
                        return json.loads(data_str)
                    except:
                        pass
        try:
           start = text.find("{")
           end = text.rfind("}") + 1
           if start >= 0 and end > start:
               return json.loads(text[start:end])
        except:
           pass
           
        return {"error": "Failed to parse response", "raw": text}

    async def _send_jsonrpc(self, method: str, params: dict | None = None) -> dict[str, Any]:
        """Send JSON-RPC request."""
        client = await self._get_client()
        request_id = str(uuid.uuid4())
        
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "id": request_id
        }
        if params is not None:
            payload["params"] = params
            
        logger.info(f"Sending JSON-RPC: {method}")
        try:
            # Need to increase timeout for workflow execution
            timeout = 120.0 if method == "tools/call" else self.timeout
            response = await client.post(self.mcp_url, json=payload, timeout=timeout)
            response.raise_for_status()
            
            data = await self._parse_response(response)
            
            if "result" in data:
                return data["result"]
            if "error" in data:
                 error = data["error"]
                 msg = error.get("message") if isinstance(error, dict) else str(error)
                 raise Exception(f"RPC Error: {msg}")
                 
            return data
            
        except Exception as e:
            logger.error(f"RPC Error ({method}): {e}")
            raise

    async def initialize(self) -> bool:
        async with self._lock:
            if self._initialized: return True
            try:
                await self._send_jsonrpc("initialize", {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {"name": "caliana-ai", "version": "1.0"}
                })
                
                try:
                    await self._send_jsonrpc("notifications/initialized")
                except Exception as e:
                     logger.warning(f"Notify initialized warned: {e}")
                
                self._initialized = True
                logger.info("MCP Session Initialized")
                return True
            except Exception as e:
                logger.error(f"Init failed: {e}")
                self._initialized = False
                return False

    async def execute_function(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        logger.info(f"=== MCP EXECUTE: {name} ===")
        try:
            if not self._initialized:
                if not await self.initialize():
                    raise Exception("Initialization failed")
            
            # --- SIMULATION TOOLS FOR REZA ---
            if name == "grant_access":
                logger.info("Simulating grant_access tool")
                return {
                    "result": f"Akses dibuka untuk {arguments.get('visitor_name')} di zona {arguments.get('zone')}. Pintu terbuka.",
                    "success": True
                }
            
            if name == "check_in_guest":
                logger.info("Simulating check_in_guest tool")
                return {
                    "result": f"Tamu {arguments.get('name')} berhasil check-in. Status hadir tercatat.",
                    "success": True
                }

            if name == "trigger_ui_action":
                logger.info(f"UI Action Triggered: {arguments}")
                return {
                    "result": "UI action sent to client.",
                    "success": True
                }
            # ---------------------------------
            
            # Use Workflow ID if mapped
            workflow_id = self.tool_mapping.get(name)
            
            if workflow_id:
                logger.info(f"Executing Workflow ID: {workflow_id}")
                
                # Wrap arguments in Webhook schema
                # Clean payload as per user's n8n config (Body only)
                request_args = {
                    "workflowId": workflow_id,
                    "inputs": {
                        "type": "webhook",
                        "webhookData": {
                            "body": arguments or {}
                        }
                    }
                }
                tool_to_call = "execute_workflow" # Generic tool
            else:
                # Fallback to direct name if not mapped
                logger.warning(f"No workflow ID for '{name}', trying direct call")
                tool_to_call = name
                request_args = arguments

            result = await self._send_jsonrpc("tools/call", {
                "name": tool_to_call,
                "arguments": request_args
            })
            
            # Extract result from n8n execution data
            result_data = result if isinstance(result, dict) else {}
            if "lastNodeExecuted" in result_data and "runData" in result_data:
                last_node = result_data["lastNodeExecuted"]
                node_data = result_data["runData"].get(last_node, [])
                if node_data:
                    try:
                        # Extract first item's JSON from output
                        # Path: runData -> Node -> [0] -> data -> main -> [0] -> [0] -> json
                        output_json = node_data[0]["data"]["main"][0][0]["json"]
                        
                        # Return specific keys if present for cleaner output
                        for key in ["result", "text", "message", "content"]:
                            if key in output_json:
                                return {"result": output_json[key], "success": True}

                        # HALLUCINATION FIX: Handle empty lists/dicts from lookups
                        if name in ["client_lookup", "lookup_appointment"]:
                            if not output_json or (isinstance(output_json, list) and len(output_json) == 0):
                                return {
                                    "result": "Data tidak ditemukan. (Empty Result)", 
                                    "success": False, # Force failure so AI knows to ask for registration
                                    "found": False
                                }

                        return {"result": output_json, "success": True}
                    except Exception as e:
                        logger.warning(f"Failed to extract meaningful result from node data: {e}")
                        # Fallback to full result
            
            # Legacy content parsing (if n8n changes format)
            if isinstance(result, dict) and "content" in result:
                 content_list = result["content"]
                 if isinstance(content_list, list):
                     text_val = ""
                     for item in content_list:
                        if item.get("type") == "text":
                             text_val += item.get("text", "")
                     
                     if text_val.strip().startswith("{"):
                         try:
                             return json.loads(text_val)
                         except: pass
                     return {"result": text_val, "success": True}

            return {"result": str(result), "success": True}
        except Exception as e:
            logger.error(f"Execute failed: {e}")
            return {"error": str(e), "success": False}

# Global instance
mcp_bridge = MCPBridge()
