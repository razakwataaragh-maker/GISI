# AI PROJECT INSTRUCTIONS

# GISI Student Management & Academic Administration Platform

Version: 1.0
Status: Approved
Authority: GISI Project Governance
Applies To: All AI Assistants, Developers, Architects, QA Engineers, and Contributors

---

# 1. PURPOSE

This document defines how AI assistants and developers must work on the GISI project.

This document is mandatory for:

- Claude
- ChatGPT
- Cursor
- GitHub Copilot
- Gemini
- Cline
- Roo Code
- Aider
- Continue
- Any future AI coding assistant

The purpose is to ensure all contributors work consistently and do not introduce conflicting designs, technologies, or business rules.

---

# 2. AUTHORITATIVE DOCUMENTS

Before performing any task, read:

1. GISI-MASTER-SRS.md
2. AI-PROJECT-INSTRUCTIONS.md
3. CLAUDE.md
4. README.md

If conflicts exist:

Priority Order:

1. GISI-MASTER-SRS.md
2. AI-PROJECT-INSTRUCTIONS.md
3. CLAUDE.md
4. README.md

The SRS is always the source of truth.

---

# 3. PROJECT VISION

GISI is a centralized academic administration platform designed to manage the complete student lifecycle.

Lifecycle:

Student Profile
→ Application
→ Admission
→ Registration
→ Payment
→ Activation
→ Learning
→ Examination
→ Results
→ Progression
→ Certification

The platform must be:

- Secure
- Auditable
- Scalable
- Maintainable
- Cloud portable
- Modular

---

# 4. DEVELOPMENT PRINCIPLES

Every implementation must follow:

## Principle 1

Business Rules First

Business requirements always take precedence over technical convenience.

---

## Principle 2

Security By Default

All functionality must be secure by design.

---

## Principle 3

Auditability

Important actions must be traceable.

---

## Principle 4

Historical Preservation

Historical records must never be silently lost.

---

## Principle 5

Maintainability

Code must remain understandable and maintainable.

---

## Principle 6

Modular Design

Modules must remain independent.

---

## Principle 7

Documentation Driven Development

No implementation begins without documentation.

---

# 5. ARCHITECTURE RULES

The GISI architecture is:

Modular Monolith

Required structure:

Frontend
↓
API
↓
Application Layer
↓
Domain Layer
↓
Infrastructure Interfaces
↓
Infrastructure Implementations

---

## Rules

Business logic must not exist inside:

- Controllers
- Routes
- Infrastructure services
- Database models

Business logic belongs in:

Application Layer
and
Domain Layer

---

# 6. CLOUD STRATEGY

Initial deployment target:

AWS

AWS is an implementation choice.

AWS is NOT the business architecture.

The system must remain portable.

All external services must be accessed through interfaces.

Examples:

Storage Interface
Email Interface
Authentication Interface
Scheduler Interface

Implementations:

AWS S3
AWS SES
AWS Cognito
AWS EventBridge

may be replaced in the future.

---

# 7. DATABASE RULES

Primary database:

PostgreSQL

Requirements:

- Foreign keys
- Transactions
- Constraints
- Indexes
- Historical preservation

Never bypass database integrity rules.

---

# 8. API RULES

API Style:

REST HTTP API

Requirements:

- JSON requests
- JSON responses
- Validation
- Authentication
- Authorization
- Consistent errors

---

## Standard Status Codes

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Error

---

# 9. BUSINESS RULES THAT CANNOT BE CHANGED

These rules are mandatory.

---

## Rule 1

Payment Is Not Activation

Forbidden:

Payment
→ Activated

Required:

Payment
→ Eligibility
→ Authorized Activation

---

## Rule 2

Finance Does Not Activate Students

Finance determines eligibility.

Academic administration performs activation.

---

## Rule 3

Activation Threshold Must Be Configurable

Never hard-code activation thresholds.

---

## Rule 4

Session Is Not Cohort

Session:

Academic intake period

Examples:

January 2025
June 2025

Cohort:

Learning group

Cohort is Version 2.0.

---

## Rule 5

Historical Preservation

Never overwrite important records without preserving history.

---

# 10. VERSION 1.0 IMPLEMENTATION ORDER

Modules must be implemented in this exact order.

001 Project Foundation

002 Identity & Access Management

003 Student Management

004 Programme Management

005 Session Management

006 Application Management

007 Admission Management

008 Registration Management

009 Finance Management

010 Activation Management

011 Learning Management

012 Examination Management

013 Results Management

014 Progression Management

015 Certificate Management

016 Notification Management

017 Reporting & Analytics

018 Administration & System Settings

019 Audit, Security & Compliance

Do not skip phases.

Do not implement future modules early.

---

# 11. VERSION 2.0 MODULES

Do not implement during Version 1.0.

Future modules:

- Cohort Management
- Facilitator Management
- Attendance Management
- Timetable Management
- Mobile Applications
- Online Assessment
- Payment Gateway Integration
- Alumni Management

---

# 12. AI WORKFLOW

Every feature must follow:

Requirements
↓
Clarification
↓
Technical Plan
↓
Task Breakdown
↓
Implementation
↓
Testing
↓
Review
↓
Documentation Update
↓
Commit

Do not skip steps.

---

# 13. REQUIRED OUTPUT FORMAT

Before coding, AI must provide:

## Feature Summary

Purpose

Objectives

Scope

Dependencies

---

## Technical Design

Architecture

Database Changes

API Changes

Security Impact

Testing Impact

---

## Implementation Tasks

Task 1

Task 2

Task 3

Task N

---

# 14. TESTING REQUIREMENTS

Every feature must include:

Unit Tests

Integration Tests

API Tests

Validation Tests

Permission Tests

---

## Minimum Targets

Domain Layer:
90%

Application Layer:
80%

API Layer:
70%

---

# 15. DOCUMENTATION REQUIREMENTS

After implementation update:

README

Architecture Docs

API Docs

Module Docs

Release Notes

When applicable.

---

# 16. GIT RULES

Branch Naming:

feature/module-name

Example:

feature/student-management

Bug Fix:

fix/student-search

---

## Commit Format

feat:

fix:

docs:

test:

refactor:

chore:

Examples:

feat(student): add student profile creation

fix(finance): correct balance calculation

docs(srs): update activation rules

---

# 17. SECURITY REQUIREMENTS

All modules must support:

Authentication

Authorization

Input Validation

Audit Logging

Rate Limiting

Secure Password Handling

Least Privilege Access

---

# 18. ERROR HANDLING RULES

All APIs must return:

Error Code

Message

Details

Correlation ID

Example:

{
"code": "VALIDATION_ERROR",
"message": "Invalid request",
"details": [],
"correlationId": "..."
}

---

# 19. LOGGING RULES

Use structured logging.

Required fields:

Timestamp

Level

Event

User

Correlation ID

Module

Action

No sensitive information in logs.

---

# 20. DEFINITION OF DONE

A task is complete only when:

Requirements implemented

Acceptance criteria passed

Tests passed

Documentation updated

Security reviewed

Code reviewed

No critical defects remain

---

# 21. AI BEHAVIOR RULES

Before coding:

Read repository

Read documentation

Identify current phase

Confirm dependencies

Produce implementation plan

Only then write code.

Never generate large amounts of code without approval.

Never change business rules.

Never introduce new technologies without justification.

Never skip tests.

Never skip documentation.

---

# 22. FIRST TASK

The first implementation task is:

001-project-foundation

Before implementation:

Assess repository.

Identify gaps.

Create foundation plan.

Obtain approval.

Then implement.

---

# END OF AI PROJECT INSTRUCTIONS VERSION 1.0
