from socketio import ASGIApp
from app.realtime.gateway import sio

# Create ASGI app for Socket.IO
socket_app = ASGIApp(sio)

