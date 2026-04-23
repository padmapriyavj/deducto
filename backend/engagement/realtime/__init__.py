"""Live quiz sessions (PRD §8.4): practice, tempo, duel on Socket.IO ``/quiz-room``."""

from engagement.realtime.asgi import mount_socketio
from engagement.realtime.protocol import NAMESPACE, protocol_contract

__all__ = ["NAMESPACE", "mount_socketio", "protocol_contract"]
