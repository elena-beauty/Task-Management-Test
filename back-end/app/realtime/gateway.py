from typing import Optional
from uuid import UUID
import socketio
from app.core.config import settings
from app.core.security import decode_access_token

# Build allowed origins list - include both localhost and 0.0.0.0 variants
def get_allowed_origins():
    """Get list of allowed origins for CORS"""
    # In development, allow all origins for easier debugging
    if settings.DEBUG:
        return ["*"]
    
    origins = []
    if settings.FRONTEND_URL:
        # Add the configured frontend URL
        origins.extend(settings.FRONTEND_URL.split(","))
        # Also add 0.0.0.0 variant if localhost is specified
        for url in settings.FRONTEND_URL.split(","):
            url = url.strip()
            if "localhost" in url:
                origins.append(url.replace("localhost", "0.0.0.0"))
            elif "0.0.0.0" in url:
                origins.append(url.replace("0.0.0.0", "localhost"))
    # If no origins specified, allow all (development only)
    if not origins:
        origins = ["*"]
    return origins

# Create Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins=get_allowed_origins(),
    async_mode="asgi",
    logger=True,
    engineio_logger=True,
    allow_upgrades=True,
    ping_timeout=60,
    ping_interval=25,
)

# Global instance
_realtime_gateway_instance: Optional["RealtimeGateway"] = None


class RealtimeGateway:
    def __init__(self, sio_server: socketio.AsyncServer):
        self.sio = sio_server
        self._setup_handlers()

    def _setup_handlers(self):
        """Setup Socket.IO event handlers"""

        @self.sio.event
        async def connect(sid, environ, auth):
            """Handle client connection"""
            try:
                token = self._extract_token(auth, environ)
                if not token:
                    print(f"Socket connection rejected: No token provided")
                    return False
                payload = decode_access_token(token)
                if not payload:
                    print(f"Socket connection rejected: Invalid token")
                    return False
                await self.sio.save_session(sid, {"user": payload})
                await self.sio.enter_room(sid, f"user-{payload['sub']}")
                print(f"Client connected: {payload.get('email', 'unknown')} (sid: {sid})")
                return True
            except ValueError as e:
                print(f"Socket connection rejected (ValueError): {e}")
                return False
            except Exception as e:
                print(f"Socket connection rejected (Exception): {e}")
                import traceback
                traceback.print_exc()
                return False

        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            session = await self.sio.get_session(sid)
            if session and "user" in session:
                print(f"Client disconnected: {session['user']['email']}")

        async def handle_join_team(sid, data):
            """Handle join team event"""
            session = await self.sio.get_session(sid)
            if not session or "user" not in session:
                await self.sio.disconnect(sid)
                return
            team_id = data.get("teamId") or data.get("team_id")
            if team_id:
                # Normalize team_id to string to ensure consistent room names
                team_id_str = str(team_id)
                room_name = f"team-{team_id_str}"
                await self.sio.enter_room(sid, room_name)
                print(f"User {session['user'].get('email', 'unknown')} joined room: {room_name}")
                await self.sio.emit("team.joined", {"teamId": team_id_str}, room=sid)

        @self.sio.event
        async def join_team(sid, data):
            """Handle join team event (snake_case)"""
            await handle_join_team(sid, data)

        @self.sio.event
        async def joinTeam(sid, data):
            """Handle join team event (camelCase) - alias for join_team"""
            await handle_join_team(sid, data)

    def _extract_token(self, auth: dict, environ: dict) -> str:
        """Extract JWT token from auth or headers"""
        if auth and isinstance(auth, dict) and "token" in auth:
            return auth["token"]
        # Try to get from query string
        query_string = environ.get("QUERY_STRING", "")
        if "token=" in query_string:
            import urllib.parse
            params = urllib.parse.parse_qs(query_string)
            if "token" in params:
                return params["token"][0]
        # Try to get from headers
        headers = environ.get("HTTP_AUTHORIZATION", "")
        if headers.startswith("Bearer "):
            return headers[7:]
        # Return None instead of raising to allow better error handling
        return None

    async def broadcast_todo_change(self, team_id: UUID, event: str, payload: dict):
        """Broadcast todo change to team room"""
        # Normalize team_id to string to ensure consistent room names
        team_id_str = str(team_id)
        room_name = f"team-{team_id_str}"
        print(f"📢 Broadcasting {event} to room: {room_name}")
        print(f"   Payload keys: {list(payload.keys())}")
        await self.sio.emit(event, payload, room=room_name)
        print(f"✅ Event {event} emitted to room {room_name}")

    async def notify_user(self, user_id: UUID, event: str, payload: dict):
        """Notify a specific user"""
        await self.sio.emit(event, payload, room=f"user-{user_id}")
    
    def broadcast_todo_change_sync(self, team_id: UUID, event: str, payload: dict):
        """Synchronous wrapper for broadcast_todo_change"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.broadcast_todo_change(team_id, event, payload))
            else:
                loop.run_until_complete(self.broadcast_todo_change(team_id, event, payload))
        except Exception:
            pass
    
    def notify_user_sync(self, user_id: UUID, event: str, payload: dict):
        """Synchronous wrapper for notify_user"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.notify_user(user_id, event, payload))
            else:
                loop.run_until_complete(self.notify_user(user_id, event, payload))
        except Exception:
            pass


def get_realtime_gateway() -> RealtimeGateway:
    """Get or create realtime gateway instance"""
    global _realtime_gateway_instance
    if _realtime_gateway_instance is None:
        _realtime_gateway_instance = RealtimeGateway(sio)
    return _realtime_gateway_instance


# Create gateway instance
gateway = get_realtime_gateway()

