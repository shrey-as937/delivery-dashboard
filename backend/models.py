import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ProjectStatus(str, enum.Enum):
    on_track = "on_track"
    at_risk = "at_risk"
    blocked = "blocked"


class OwnerType(str, enum.Enum):
    internal = "internal"
    customer = "customer"


class MilestoneStatus(str, enum.Enum):
    open = "open"
    blocked = "blocked"
    done = "done"


class TaskStatus(str, enum.Enum):
    open = "open"
    blocked = "blocked"
    done = "done"


class IssueCategory(str, enum.Enum):
    bug = "Bug"
    feature_request = "Feature Request"
    question = "Question"
    support = "Support"
    implementation = "Implementation"


class IssueStatus(str, enum.Enum):
    open = "open"
    closed = "closed"


# Many-to-many join table between Project and Owner
project_owner = Table(
    "project_owner",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id"), primary_key=True),
    Column("owner_id", Integer, ForeignKey("owners.id"), primary_key=True),
)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.on_track)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owners = relationship("Owner", secondary=project_owner, back_populates="projects")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="project", cascade="all, delete-orphan")
    updates = relationship("UpdateEntry", back_populates="project", cascade="all, delete-orphan")


class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(OwnerType), nullable=False)

    projects = relationship("Project", secondary=project_owner, back_populates="owners")
    tasks = relationship("Task", back_populates="owner")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    status = Column(Enum(MilestoneStatus), nullable=False, default=MilestoneStatus.open)
    due_date = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="milestones")
    tasks = relationship("Task", back_populates="milestone", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    milestone_id = Column(Integer, ForeignKey("milestones.id"), nullable=False)
    name = Column(String, nullable=False)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.open)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=True)

    milestone = relationship("Milestone", back_populates="tasks")
    owner = relationship("Owner", back_populates="tasks")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)
    category = Column(Enum(IssueCategory), nullable=False)
    status = Column(Enum(IssueStatus), nullable=False, default=IssueStatus.open)
    is_customer_visible = Column(Boolean, default=True)

    project = relationship("Project", back_populates="issues")


class UpdateEntry(Base):
    __tablename__ = "update_entries"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    raw_text = Column(Text, nullable=False)
    parsed_summary = Column(Text, nullable=False)
    status_change = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_customer_visible = Column(Boolean, default=True)

    project = relationship("Project", back_populates="updates")


def init_db():
    Base.metadata.create_all(bind=engine)
