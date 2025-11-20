#!/usr/bin/env python3
"""
Script to generate mock data for all tables in the database.
This script can be run in Docker or locally.

Usage:
    # In Docker (without clearing existing data):
    docker-compose --profile tools run --rm generate-mock-data

    # In Docker (clearing existing data first):
    docker-compose --profile tools run --rm -e CLEAR_DATA=true generate-mock-data

    # Locally (after setting up environment):
    python scripts/generate_mock_data.py
    CLEAR_DATA=true python scripts/generate_mock_data.py
"""
import sys
import os
from datetime import datetime, timedelta
from random import choice, randint, sample
from faker import Faker

# Add parent directory to path
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
sys.path.insert(0, parent_dir)

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.team import Team, TeamMembership, TeamRole
from app.models.todo import Todo, TodoStatus
from app.models.notification import Notification, NotificationType

fake = Faker()


def generate_users(db: SessionLocal) -> list[User]:
    """Generate mock users - creates exactly 2 users"""
    print("Generating 2 users...")
    users = []
    
    owner_user = User(
        email="owner@gmail.com",
        name="Team Owner",
        password_hash=get_password_hash("password123"),
    )
    db.add(owner_user)
    users.append(owner_user)
    
    developer_user = User(
        email="developer@gmail.com",
        name="Developer",
        password_hash=get_password_hash("password123"),
    )
    db.add(developer_user)
    users.append(developer_user)
    
    db.commit()
    print(f"✓ Created {len(users)} users")
    return users


def generate_teams(db: SessionLocal, owner_user: User) -> list[Team]:
    """Generate mock teams - creates 1 team with the owner user"""
    print("Generating 1 team...")
    teams = []
    
    team = Team(
        name="Development Team",
        description="Main development team",
        owner_id=owner_user.id,
    )
    db.add(team)
    teams.append(team)
    
    db.commit()
    print(f"✓ Created {len(teams)} teams")
    return teams


def generate_team_memberships(db: SessionLocal, teams: list[Team], owner_user: User, developer_user: User):
    """Generate mock team memberships - adds owner and developer to the team"""
    print("Generating team memberships...")
    memberships = []
    
    for team in teams:
        owner_membership = TeamMembership(
            team_id=team.id,
            user_id=owner_user.id,
            role=TeamRole.OWNER,
        )
        db.add(owner_membership)
        memberships.append(owner_membership)
        
        developer_membership = TeamMembership(
            team_id=team.id,
            user_id=developer_user.id,
            role=TeamRole.MEMBER,
        )
        db.add(developer_membership)
        memberships.append(developer_membership)
    
    db.commit()
    print(f"✓ Created {len(memberships)} team memberships")
    return memberships


def generate_todos(db: SessionLocal, teams: list[Team], users: list[User], count: int = 50) -> list[Todo]:
    """Generate mock todos"""
    print(f"Generating {count} todos...")
    todos = []
    statuses = [TodoStatus.BACKLOG, TodoStatus.IN_PROGRESS, TodoStatus.DONE, TodoStatus.BLOCKED]
    
    for i in range(count):
        team = choice(teams)
        assignee = choice(users) if randint(0, 1) else None
        
        days_offset = randint(-30, 30)
        due_date = datetime.now() + timedelta(days=days_offset) if randint(0, 1) else None
        
        todo = Todo(
            title=fake.sentence(nb_words=4).rstrip('.'),
            description=fake.text(max_nb_chars=500) if randint(0, 1) else None,
            due_date=due_date,
            status=choice(statuses),
            team_id=team.id,
            assignee_id=assignee.id if assignee else None,
        )
        db.add(todo)
        todos.append(todo)
    
    db.commit()
    print(f"✓ Created {len(todos)} todos")
    return todos


def generate_notifications(db: SessionLocal, users: list[User], teams: list[Team], todos: list[Todo], count: int = 30):
    """Generate mock notifications"""
    print(f"Generating {count} notifications...")
    notifications = []
    notification_types = [
        NotificationType.TODO_CREATED,
        NotificationType.TODO_UPDATED,
        NotificationType.TODO_DELETED,
    ]
    
    for i in range(count):
        user = choice(users)
        team = choice(teams) if randint(0, 1) else None
        notification_type = choice(notification_types)
        
        if notification_type == NotificationType.TODO_CREATED:
            message = f"New todo '{choice(todos).title if todos else 'Task'}' was created"
        elif notification_type == NotificationType.TODO_UPDATED:
            message = f"Todo '{choice(todos).title if todos else 'Task'}' was updated"
        else:
            message = f"Todo '{choice(todos).title if todos else 'Task'}' was deleted"
        
        notification = Notification(
            user_id=user.id,
            team_id=team.id if team else None,
            type=notification_type,
            message=message,
            read=fake.boolean(chance_of_getting_true=30),  # 30% chance of being read
        )
        db.add(notification)
        notifications.append(notification)
    
    db.commit()
    print(f"✓ Created {len(notifications)} notifications")
    return notifications


def clear_all_data(db: SessionLocal):
    """Clear all data from tables (in reverse order of dependencies)"""
    print("Clearing existing data...")
    db.query(Notification).delete()
    db.query(Todo).delete()
    db.query(TeamMembership).delete()
    db.query(Team).delete()
    db.query(User).delete()
    db.commit()
    print("✓ Cleared all data")


def main():
    """Main function to generate all mock data"""
    db = SessionLocal()
    
    try:
        clear_data = os.getenv("CLEAR_DATA", "false").lower() == "true"
        
        if clear_data:
            clear_all_data(db)
        
        users = generate_users(db)
        owner_user = next(u for u in users if u.email == "owner@gmail.com")
        developer_user = next(u for u in users if u.email == "developer@gmail.com")
        teams = generate_teams(db, owner_user)
        memberships = generate_team_memberships(db, teams, owner_user, developer_user)
        todos = generate_todos(db, teams, users, count=50)
        notifications = generate_notifications(db, users, teams, todos, count=30)
        
        print("\n" + "="*50)
        print("Mock data generation completed!")
        print("="*50)
        print(f"Users: {len(users)}")
        print(f"Teams: {len(teams)}")
        print(f"Team Memberships: {len(memberships)}")
        print(f"Todos: {len(todos)}")
        print(f"Notifications: {len(notifications)}")
        print("\nDefault password for all users: password123")
        print("="*50)
        
    except Exception as e:
        db.rollback()
        print(f"Error generating mock data: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

