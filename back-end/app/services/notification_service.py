from sqlalchemy.orm import Session
from uuid import UUID
from app.models.notification import Notification, NotificationType
from app.models.team import Team
from app.realtime.gateway import RealtimeGateway


class NotificationService:
    @staticmethod
    def list_for_user(db: Session, user_id: UUID) -> list[Notification]:
        """List notifications for a user"""
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(50)
            .all()
        )

    @staticmethod
    def create_for_users(
        db: Session,
        user_ids: list[UUID],
        team: Team | None,
        notification_type: NotificationType,
        message: str,
        realtime_gateway: RealtimeGateway,
    ) -> list[Notification]:
        """Create notifications for multiple users"""
        notifications = []
        for user_id in user_ids:
            notification = Notification(
                user_id=user_id,
                team_id=team.id if team else None,
                type=notification_type,
                message=message,
            )
            notifications.append(notification)

        db.add_all(notifications)
        db.commit()

        # Emit websocket events (fire and forget)
        for notification in notifications:
            db.refresh(notification)
            payload = {
                "id": str(notification.id),
                "user_id": str(notification.user_id),
                "team_id": str(notification.team_id) if notification.team_id else None,
                "type": notification.type.value,
                "message": notification.message,
                "read": notification.read,
                "created_at": notification.created_at.isoformat(),
            }
            realtime_gateway.notify_user_sync(
                notification.user_id, "notification.created", payload
            )

        return notifications

