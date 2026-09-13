# CLAUDE.md

## GISI Project Instructions

Before performing any task on this project, you MUST read:

1. GISI-MASTER-SRS.md
2. AI-PROJECT-INSTRUCTIONS.md

These documents are the authoritative source of truth for the GISI platform.

Do not create functionality that conflicts with those documents.

---

## First Responsibility

Before writing code:

1. Inspect the repository.
2. Understand the project structure.
3. Read the SRS.
4. Read AI-PROJECT-INSTRUCTIONS.md.
5. Identify the current implementation phase.
6. Confirm the next task before coding.

---

## Development Order

The required implementation order is:

1. Project Foundation
2. Identity & Access Management
3. Student Management
4. Programme Management
5. Session Management
6. Application Management
7. Admission Management
8. Registration Management
9. Finance Management
10. Activation Management
11. Learning Management
12. Examination Management
13. Results Management
14. Progression Management
15. Certificate Management
16. Notification Management
17. Reporting & Analytics
18. Administration & System Settings
19. Audit, Security & Compliance

Do not skip phases.

---

## Critical Business Rules

- Payment does NOT equal Activation.
- Finance determines eligibility but does NOT activate students.
- Activation requires authorized action.
- Activation thresholds must be configurable.
- Historical records must be preserved.
- Session is NOT Cohort.
- Cohort Management is Version 2.0.
- In-portal notifications are primary.
- Only three automatic email triggers exist in Version 1.0:
    - Admission Granted
    - Portal Activation
    - Certificate Issuance

---

## First Development Task

The first feature is:

001-project-foundation

Before implementation, inspect the repository and report:

- Current project structure
- Missing foundation components
- Recommended foundation tasks
- Risks
- Proposed implementation plan

Do not immediately generate large amounts of code.
