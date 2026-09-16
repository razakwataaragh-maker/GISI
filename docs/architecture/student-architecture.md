# Student Module Architecture

**Phase:** Phase 2 - Student Management
**Status:** Architecture Definition
**Date:** 2026-09-16

---

## Purpose

Maintain the authoritative student record throughout the student lifecycle.

---

## Module Boundaries

The Student module follows the modular monolith architecture with clear layer boundaries:

```
API Layer → Application Layer → Domain Layer → Infrastructure Interfaces → Infrastructure Implementations
```

### Layer Responsibilities

**API Layer (`src/modules/student/api/`)**
- HTTP endpoints for student CRUD operations
- Request validation and authentication/authorization
- Response formatting and error handling
- RESTful API with `/api/v1/students` versioning

**Application Layer (`src/modules/student/application/`)**
- Use cases for student operations
- Orchestration of domain logic and infrastructure
- Transaction management
- Audit logging integration

**Domain Layer (`src/modules/student/domain/`)**
- Student business logic
- Status transitions and validation
- Domain-specific errors
- Business rules enforcement

**Infrastructure Layer (`src/modules/student/infrastructure/`)**
- Database access (Prisma repositories)
- Document storage interfaces
- External service integrations

**Contracts Layer (`src/modules/student/contracts/`)**
- TypeScript interfaces and types
- Data transfer objects
- Domain contracts shared across layers

---

## Dependencies

### Internal Dependencies
- `src/modules/audit` - Audit logging interface
- `src/modules/identity-access` - Authentication and authorization
- `src/infrastructure/http` - HTTP infrastructure
- `src/infrastructure/database` - Database connection
- `src/shared` - Shared utilities and types

### External Dependencies
- PostgreSQL (via Prisma)
- Document storage (S3 interface, future implementation)

### Dependency Direction
```
Student Module → IAM Module (for authentication/authorization)
Student Module → Audit Module (for audit logging)
Student Module → Infrastructure (for database/storage)
```

---

## Key Business Rules

### Student Number
- Each student must have a unique student number
- Student numbers are system-generated and immutable
- Student numbers serve as the primary identifier for academic records

### Student Status
- Students can be: ACTIVE, INACTIVE, SUSPENDED, GRADUATED, WITHDRAWN
- Status transitions must be audited
- Historical status records must be preserved
- Status changes require authorization

### Historical Preservation
- All student profile changes must be preserved
- Status history must be maintained
- Document changes must be traceable
- No student data is ever deleted

### Privacy and Security
- Student data is sensitive and requires appropriate access controls
- PII (Personally Identifiable Information) must be protected
- Document access requires authorization
- Audit trail for all student data access

---

## Data Model Overview

### Core Entities

**Student**
- Unique student number (system-generated)
- Personal information (name, date of birth, gender)
- Contact information (email, phone)
- Identification information (national ID, passport)
- Address information (residential, mailing)
- Emergency contacts
- Current status
- Timestamps (created, updated)

**StudentStatusHistory**
- Historical record of status changes
- Previous and new status
- Change reason and actor
- Timestamp

**StudentProfileHistory**
- Historical record of profile changes
- Before/after state
- Change reason and actor
- Timestamp

**StudentDocument**
- Document metadata
- Storage reference
- Document type
- Upload timestamp
- Uploaded by

---

## API Endpoints

Following the `/api/v1/*` versioning pattern:

```
POST   /api/v1/students                      - Create new student
GET    /api/v1/students                      - List/search students
GET    /api/v1/students/{id}                 - Get student by ID
PATCH  /api/v1/students/{id}                 - Update student profile
GET    /api/v1/students/{id}/history        - Get student history
POST   /api/v1/students/{id}/documents       - Upload student document
GET    /api/v1/students/{id}/documents/{id}  - Retrieve student document
```

---

## Security Considerations

### Authentication
- All student endpoints require authentication
- Student profile access requires appropriate permissions
- Document access requires additional authorization

### Authorization
- `student.read` - View student profiles
- `student.write` - Create/update student profiles
- `student.delete` - Deactivate/delete students (restricted)
- `student.admin` - Full administrative access

### Audit Logging
- All student CRUD operations must be audited
- Profile changes must capture before/after state
- Status changes must include reason and actor
- Document uploads must be logged

### Data Privacy
- PII fields require special handling
- Document access must be controlled
- Audit logs must not contain sensitive data
- Search functionality must respect access controls

---

## Integration Points

### Upstream Dependencies
- **IAM Module** - User authentication and authorization
- **Audit Module** - Audit logging infrastructure

### Downstream Dependencies
- **Application Module** - Student applications reference student records
- **Admission Module** - Admission decisions reference student profiles
- **Registration Module** - Course registrations reference student status
- **Finance Module** - Payment records reference student accounts
- **Activation Module** - Portal activation references student eligibility

---

## Implementation Strategy

### Phase 2.1: Architecture and Data Model
1. Define module structure and boundaries
2. Design Prisma schema for students, history, and documents
3. Define TypeScript contracts and interfaces

### Phase 2.2: Domain and Application Logic
1. Implement student domain logic and status transitions
2. Create application services for CRUD operations
3. Integrate audit logging

### Phase 2.3: API and Testing
1. Implement REST API endpoints
2. Add comprehensive test coverage
3. Security hardening and validation

### Phase 2.4: Review and Approval
1. Independent review of implementation
2. SRS requirements verification
3. Security and audit review
4. Final approval

---

## Success Criteria

- ✅ All SRS functional requirements implemented
- ✅ API endpoints follow `/api/v1/*` versioning
- ✅ Student number generation system functional
- ✅ Status transitions validated and audited
- ✅ Historical preservation enforced
- ✅ Test coverage meets minimum targets (Domain 90%, Application 80%, API 70%)
- ✅ Security controls implemented (authentication, authorization, audit logging)
- ✅ Document storage interface defined (implementation may be deferred)
- ✅ Integration with IAM module for authentication/authorization
- ✅ Integration with Audit module for audit logging

---

## Known Constraints

- Document storage implementation may be deferred to later phase
- Student number generation algorithm to be defined during implementation
- Document upload size limits to be configured
- Student search capabilities may be basic in initial implementation
