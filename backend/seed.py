"""
Populates app.db with 4 realistic mock customer-delivery projects.
Run directly (`python seed.py`) or imported and called via seed_if_empty().
"""
from datetime import datetime, timedelta, timezone

from models import (
    Base,
    Issue,
    IssueCategory,
    IssueStatus,
    Milestone,
    MilestoneStatus,
    Owner,
    OwnerType,
    Project,
    ProjectStatus,
    SessionLocal,
    Task,
    TaskStatus,
    UpdateEntry,
    engine,
)


def days_ago(n):
    return datetime.now(timezone.utc) - timedelta(days=n)


def days_from_now(n):
    return datetime.now(timezone.utc) + timedelta(days=n)


def build_data(db):
    # ---------------------------------------------------------------
    # PROJECT 1 — SkyRoute Logistics (drone fleet management software)
    # ---------------------------------------------------------------
    p1 = Project(
        name="Fleet Ops Platform Rollout",
        customer_name="SkyRoute Logistics",
        status=ProjectStatus.on_track,
        created_at=days_ago(46),
    )
    db.add(p1)
    db.flush()

    p1_owners = [
        Owner(name="Maya Chen", type=OwnerType.internal),
        Owner(name="Devon Aldrich", type=OwnerType.internal),
        Owner(name="Priya Nair", type=OwnerType.customer),
    ]
    db.add_all(p1_owners)
    db.flush()
    p1.owners = p1_owners

    m1a = Milestone(project_id=p1.id, name="Fleet telemetry ingestion", status=MilestoneStatus.done, due_date=days_ago(30))
    m1b = Milestone(project_id=p1.id, name="Route optimization engine", status=MilestoneStatus.open, due_date=days_from_now(9))
    m1c = Milestone(project_id=p1.id, name="Customer dashboard v1", status=MilestoneStatus.open, due_date=days_from_now(21))
    m1d = Milestone(project_id=p1.id, name="Regulatory compliance export", status=MilestoneStatus.blocked, due_date=days_from_now(4))
    db.add_all([m1a, m1b, m1c, m1d])
    db.flush()

    db.add_all([
        Task(milestone_id=m1a.id, name="Set up MQTT ingestion pipeline", status=TaskStatus.done, owner_id=p1_owners[0].id),
        Task(milestone_id=m1a.id, name="Normalize telemetry schema across drone models", status=TaskStatus.done, owner_id=p1_owners[1].id),
        Task(milestone_id=m1a.id, name="Load test at 500 drones/min", status=TaskStatus.done, owner_id=p1_owners[0].id),
        Task(milestone_id=m1b.id, name="Integrate weather API for no-fly windows", status=TaskStatus.done, owner_id=p1_owners[1].id),
        Task(milestone_id=m1b.id, name="Battery-aware route recalculation", status=TaskStatus.open, owner_id=p1_owners[0].id),
        Task(milestone_id=m1b.id, name="Multi-warehouse route merging", status=TaskStatus.open, owner_id=p1_owners[1].id),
        Task(milestone_id=m1c.id, name="Live map view with fleet status", status=TaskStatus.open, owner_id=p1_owners[0].id),
        Task(milestone_id=m1c.id, name="Delivery SLA widgets", status=TaskStatus.open, owner_id=p1_owners[1].id),
        Task(milestone_id=m1d.id, name="FAA Part 107 flight log export", status=TaskStatus.blocked, owner_id=p1_owners[0].id),
        Task(milestone_id=m1d.id, name="Airspace authorization audit trail", status=TaskStatus.open, owner_id=p1_owners[1].id),
    ])

    db.add_all([
        Issue(project_id=p1.id, title="Telemetry occasionally drops packets over LTE handoff", category=IssueCategory.bug, status=IssueStatus.open, is_customer_visible=True),
        Issue(project_id=p1.id, title="Request: bulk CSV export of flight logs", category=IssueCategory.feature_request, status=IssueStatus.open, is_customer_visible=True),
        Issue(project_id=p1.id, title="How is battery degradation factored into routing?", category=IssueCategory.question, status=IssueStatus.closed, is_customer_visible=True),
        Issue(project_id=p1.id, title="Onboarding call follow-up: SSO setup for ops team", category=IssueCategory.support, status=IssueStatus.closed, is_customer_visible=True),
        Issue(project_id=p1.id, title="Internal: FAA export schema needs legal sign-off before build", category=IssueCategory.implementation, status=IssueStatus.open, is_customer_visible=False),
    ])

    db.add_all([
        UpdateEntry(
            project_id=p1.id,
            raw_text="just wrapped load testing on the ingestion pipeline, held steady at 500 drones/min with no drops. moving telemetry milestone to done. next up is battery-aware routing",
            parsed_summary="Telemetry ingestion milestone completed after load testing at 500 drones/min.",
            status_change="Fleet telemetry ingestion -> done",
            timestamp=days_ago(29),
            is_customer_visible=True,
        ),
        UpdateEntry(
            project_id=p1.id,
            raw_text="heads up - the FAA compliance export is blocked, legal needs to review the audit trail format before we can build against it. pinged them today, no ETA yet",
            parsed_summary="Regulatory compliance export is blocked pending legal review of the audit trail format.",
            status_change="Regulatory compliance export -> blocked",
            timestamp=days_ago(6),
            is_customer_visible=False,
        ),
        UpdateEntry(
            project_id=p1.id,
            raw_text="synced with Priya, she's happy with the weather API integration for no-fly windows. she asked if we could also surface a CSV export for their compliance team, logging as a feature request",
            parsed_summary="Customer confirmed weather-based no-fly window integration meets expectations; requested CSV export for compliance reporting.",
            status_change=None,
            timestamp=days_ago(3),
            is_customer_visible=True,
        ),
    ])

    # ---------------------------------------------------------------
    # PROJECT 2 — Northlane Financial (enterprise API integration)
    # ---------------------------------------------------------------
    p2 = Project(
        name="Core Banking API Integration",
        customer_name="Northlane Financial",
        status=ProjectStatus.at_risk,
        created_at=days_ago(62),
    )
    db.add(p2)
    db.flush()

    p2_owners = [
        Owner(name="Sam Okafor", type=OwnerType.internal),
        Owner(name="Lena Brooks", type=OwnerType.customer),
        Owner(name="Ravi Shah", type=OwnerType.customer),
    ]
    db.add_all(p2_owners)
    db.flush()
    p2.owners = p2_owners

    m2a = Milestone(project_id=p2.id, name="Auth & webhook handshake", status=MilestoneStatus.done, due_date=days_ago(40))
    m2b = Milestone(project_id=p2.id, name="Ledger reconciliation sync", status=MilestoneStatus.blocked, due_date=days_ago(2))
    m2c = Milestone(project_id=p2.id, name="Fraud signal passthrough", status=MilestoneStatus.open, due_date=days_from_now(14))
    db.add_all([m2a, m2b, m2c])
    db.flush()

    db.add_all([
        Task(milestone_id=m2a.id, name="OAuth2 client credentials flow", status=TaskStatus.done, owner_id=p2_owners[0].id),
        Task(milestone_id=m2a.id, name="Webhook signature verification", status=TaskStatus.done, owner_id=p2_owners[0].id),
        Task(milestone_id=m2b.id, name="Nightly ledger diff job", status=TaskStatus.blocked, owner_id=p2_owners[0].id),
        Task(milestone_id=m2b.id, name="Reconciliation mismatch alerting", status=TaskStatus.open, owner_id=p2_owners[0].id),
        Task(milestone_id=m2b.id, name="Customer sandbox test data", status=TaskStatus.done, owner_id=p2_owners[1].id),
        Task(milestone_id=m2c.id, name="Real-time fraud score webhook", status=TaskStatus.open, owner_id=p2_owners[0].id),
        Task(milestone_id=m2c.id, name="Risk threshold configuration UI", status=TaskStatus.open, owner_id=p2_owners[2].id),
    ])

    db.add_all([
        Issue(project_id=p2.id, title="Ledger diff job times out on accounts >50k transactions", category=IssueCategory.bug, status=IssueStatus.open, is_customer_visible=True),
        Issue(project_id=p2.id, title="Need field-level encryption for PII in webhook payloads", category=IssueCategory.feature_request, status=IssueStatus.open, is_customer_visible=True),
        Issue(project_id=p2.id, title="What's the retry policy on failed webhook deliveries?", category=IssueCategory.question, status=IssueStatus.closed, is_customer_visible=True),
        Issue(project_id=p2.id, title="Compliance requested a copy of our SOC 2 report", category=IssueCategory.support, status=IssueStatus.closed, is_customer_visible=True),
        Issue(project_id=p2.id, title="Internal: reconciliation job needs to shard by account range", category=IssueCategory.implementation, status=IssueStatus.open, is_customer_visible=False),
        Issue(project_id=p2.id, title="Internal: Northlane exec sponsor is unhappy with pace, escalation risk", category=IssueCategory.support, status=IssueStatus.open, is_customer_visible=False),
    ])

    db.add_all([
        UpdateEntry(
            project_id=p2.id,
            raw_text="ledger reconciliation job is timing out for their bigger accounts, over 50k txns it just hangs. going to mark this milestone blocked until we fix the query plan",
            parsed_summary="Ledger reconciliation sync blocked by timeouts on high-volume accounts (50k+ transactions).",
            status_change="Ledger reconciliation sync -> blocked",
            timestamp=days_ago(5),
            is_customer_visible=True,
        ),
        UpdateEntry(
            project_id=p2.id,
            raw_text="internal note - had a rough call with Northlane's exec sponsor today, they're getting impatient about the reconciliation delay. need to get Sam's fix shipped by friday or this escalates to their VP",
            parsed_summary="Customer executive sponsor expressed frustration with reconciliation delays; escalation risk if fix isn't shipped by Friday.",
            status_change=None,
            timestamp=days_ago(1),
            is_customer_visible=False,
        ),
        UpdateEntry(
            project_id=p2.id,
            raw_text="Lena confirmed the sandbox test data set looks good, they're able to run their internal QA suite against it now",
            parsed_summary="Customer confirmed sandbox test data is sufficient to run their internal QA suite.",
            status_change=None,
            timestamp=days_ago(9),
            is_customer_visible=True,
        ),
    ])

    # ---------------------------------------------------------------
    # PROJECT 3 — Alderly Health (patient scheduling SaaS onboarding)
    # ---------------------------------------------------------------
    p3 = Project(
        name="Multi-Clinic Scheduling Onboarding",
        customer_name="Alderly Health Group",
        status=ProjectStatus.on_track,
        created_at=days_ago(21),
    )
    db.add(p3)
    db.flush()

    p3_owners = [
        Owner(name="Jordan Faust", type=OwnerType.internal),
        Owner(name="Grace Whitfield", type=OwnerType.customer),
    ]
    db.add_all(p3_owners)
    db.flush()
    p3.owners = p3_owners

    m3a = Milestone(project_id=p3.id, name="Clinic & provider data import", status=MilestoneStatus.done, due_date=days_ago(10))
    m3b = Milestone(project_id=p3.id, name="Insurance eligibility check integration", status=MilestoneStatus.open, due_date=days_from_now(6))
    m3c = Milestone(project_id=p3.id, name="Patient self-scheduling portal", status=MilestoneStatus.open, due_date=days_from_now(18))
    db.add_all([m3a, m3b, m3c])
    db.flush()

    db.add_all([
        Task(milestone_id=m3a.id, name="Bulk import 14 clinic locations", status=TaskStatus.done, owner_id=p3_owners[0].id),
        Task(milestone_id=m3a.id, name="Map provider specialties to booking rules", status=TaskStatus.done, owner_id=p3_owners[0].id),
        Task(milestone_id=m3b.id, name="Availity eligibility API integration", status=TaskStatus.open, owner_id=p3_owners[0].id),
        Task(milestone_id=m3b.id, name="Co-pay estimate display", status=TaskStatus.open, owner_id=p3_owners[0].id),
        Task(milestone_id=m3c.id, name="Self-service reschedule flow", status=TaskStatus.open, owner_id=p3_owners[0].id),
        Task(milestone_id=m3c.id, name="SMS reminder opt-in", status=TaskStatus.open, owner_id=p3_owners[1].id),
    ])

    db.add_all([
        Issue(project_id=p3.id, title="Provider search doesn't filter by insurance network", category=IssueCategory.bug, status=IssueStatus.open, is_customer_visible=True),
        Issue(project_id=p3.id, title="Add waitlist feature for fully booked providers", category=IssueCategory.feature_request, status=IssueStatus.open, is_customer_visible=True),
        Issue(project_id=p3.id, title="Can patients book across multiple clinic locations?", category=IssueCategory.question, status=IssueStatus.closed, is_customer_visible=True),
        Issue(project_id=p3.id, title="Training session requested for front-desk staff", category=IssueCategory.support, status=IssueStatus.open, is_customer_visible=True),
        Issue(project_id=p3.id, title="Internal: eligibility API sandbox creds expired, need renewal", category=IssueCategory.implementation, status=IssueStatus.open, is_customer_visible=False),
    ])

    db.add_all([
        UpdateEntry(
            project_id=p3.id,
            raw_text="finished the clinic data import today, all 14 locations and their providers are in with correct specialty mappings. Grace signed off after spot-checking 3 clinics",
            parsed_summary="Clinic and provider data import completed and approved by customer after spot-checking.",
            status_change="Clinic & provider data import -> done",
            timestamp=days_ago(9),
            is_customer_visible=True,
        ),
        UpdateEntry(
            project_id=p3.id,
            raw_text="our Availity sandbox credentials expired, opened a ticket with them to renew. shouldn't block us for more than a day or two but flagging internally",
            parsed_summary="Eligibility API sandbox credentials expired; renewal ticket opened with Availity.",
            status_change=None,
            timestamp=days_ago(2),
            is_customer_visible=False,
        ),
    ])

    # ---------------------------------------------------------------
    # PROJECT 4 — Vantage Retail (inventory sync platform, in trouble)
    # ---------------------------------------------------------------
    p4 = Project(
        name="Real-Time Inventory Sync",
        customer_name="Vantage Retail Group",
        status=ProjectStatus.blocked,
        created_at=days_ago(75),
    )
    db.add(p4)
    db.flush()

    p4_owners = [
        Owner(name="Nina Petrova", type=OwnerType.internal),
        Owner(name="Owen Marsh", type=OwnerType.internal),
        Owner(name="Carlos Diaz", type=OwnerType.customer),
    ]
    db.add_all(p4_owners)
    db.flush()
    p4.owners = p4_owners

    m4a = Milestone(project_id=p4.id, name="POS system data mapping", status=MilestoneStatus.done, due_date=days_ago(50))
    m4b = Milestone(project_id=p4.id, name="Warehouse-to-store sync engine", status=MilestoneStatus.blocked, due_date=days_ago(8))
    m4c = Milestone(project_id=p4.id, name="Store manager alerting dashboard", status=MilestoneStatus.open, due_date=days_from_now(25))
    db.add_all([m4a, m4b, m4c])
    db.flush()

    db.add_all([
        Task(milestone_id=m4a.id, name="Map 3 legacy POS formats to unified schema", status=TaskStatus.done, owner_id=p4_owners[0].id),
        Task(milestone_id=m4b.id, name="Conflict resolution for concurrent stock updates", status=TaskStatus.blocked, owner_id=p4_owners[1].id),
        Task(milestone_id=m4b.id, name="Store-level sync latency under 2s", status=TaskStatus.blocked, owner_id=p4_owners[0].id),
        Task(milestone_id=m4c.id, name="Low-stock threshold alerts", status=TaskStatus.open, owner_id=p4_owners[1].id),
    ])

    db.add_all([
        Issue(project_id=p4.id, title="Duplicate stock decrements during network retries", category=IssueCategory.bug, status=IssueStatus.open, is_customer_visible=True),
        Issue(project_id=p4.id, title="Request: manual override for sync conflicts", category=IssueCategory.feature_request, status=IssueStatus.open, is_customer_visible=True),
        Issue(project_id=p4.id, title="Why did the sync latency target change from 1s to 2s?", category=IssueCategory.question, status=IssueStatus.open, is_customer_visible=True),
        Issue(project_id=p4.id, title="Internal: legacy POS #3 vendor unresponsive on API rate limit increase", category=IssueCategory.implementation, status=IssueStatus.open, is_customer_visible=False),
        Issue(project_id=p4.id, title="Internal: customer considering contract pause if sync isn't stable by EOM", category=IssueCategory.support, status=IssueStatus.open, is_customer_visible=False),
    ])

    db.add_all([
        UpdateEntry(
            project_id=p4.id,
            raw_text="sync engine is still blocked - the conflict resolution logic is causing duplicate stock decrements when a store loses connection mid-update. Owen's investigating a lock-based fix",
            parsed_summary="Warehouse-to-store sync engine remains blocked due to duplicate stock decrements from unresolved concurrent-update conflicts.",
            status_change="Warehouse-to-store sync engine -> blocked",
            timestamp=days_ago(8),
            is_customer_visible=True,
        ),
        UpdateEntry(
            project_id=p4.id,
            raw_text="internal - Carlos hinted on today's call that leadership is discussing pausing the contract if we can't stabilize sync by end of month. need exec attention on this",
            parsed_summary="Customer signaled possible contract pause if sync issues aren't resolved by end of month; needs executive attention.",
            status_change=None,
            timestamp=days_ago(1),
            is_customer_visible=False,
        ),
        UpdateEntry(
            project_id=p4.id,
            raw_text="legacy POS vendor #3 still hasn't responded about raising our API rate limit, been 9 days. escalating to their account manager directly",
            parsed_summary="Third legacy POS vendor unresponsive for 9 days on API rate limit increase request; escalating directly to their account manager.",
            status_change=None,
            timestamp=days_ago(4),
            is_customer_visible=False,
        ),
    ])

    db.commit()


def seed_if_empty():
    from models import init_db

    init_db()
    db = SessionLocal()
    try:
        if db.query(Project).count() == 0:
            build_data(db)
            print("Seeded database with 4 mock projects.")
        else:
            print("Database already has data, skipping seed.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_if_empty()
