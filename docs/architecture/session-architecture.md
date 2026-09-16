# Session Module Architecture

## Module Purpose

Manage academic intake periods (sessions) for GISI, including session creation, modification, opening, closing, and archival.

## Module Boundaries

The session module is responsible for:
- Session lifecycle management (creation, modification, opening, closing, archival)
- Session status management (Draft, Open, Closed, Archived)
- Application and registration window management
- Session reporting and history tracking
- Temporal period management for academic cycles

The session module is NOT responsible for:
- Student applications (handled by Application Management)
- Student registrations (handled by Registration Management)
- Programme-session associations (future enhancement)
- Cohort management (Cohort Management is Version 2.0)

## Dependency Direction

```
API Layer → Application Layer → Domain Layer → Infrastructure Interfaces → Infrastructure Implementations
```

### External Dependencies
- **Identity & Access Management**: Authentication and authorization for session operations
- **Audit**: Audit logging for session changes
- **Infrastructure**: Database persistence via Prisma

### Future Dependencies
- **Application Management**: Sessions will be associated with application windows
- **Registration Management**: Sessions will be associated with registration windows
- **Programme Management**: Sessions may be associated with programmes (future)
- **Finance Management**: Sessions may have associated fee schedules (future)

## Module Structure

```
src/modules/session/
├── api/
│   └── session-routes.ts            # REST API endpoints
├── application/
│   ├── index.ts                      # Application service exports
│   └── manage-sessions.ts            # Session CRUD operations
├── contracts/
│   └── session.ts                    # TypeScript interfaces and types
├── domain/
│   ├── index.ts                      # Domain exports
│   ├── session.ts                    # Domain errors and types
│   └── session-status-transitions.ts # Status transition logic
└── infrastructure/
    └── session-repository.ts         # Prisma repository implementation
```

## Core Responsibilities

### Domain Layer
- **Session Entity**: Core session business logic
- **Status Transitions**: Valid status changes (Draft → Open → Closed → Archived)
- **Window Management**: Application and registration window validation
- **Business Rules**: Opening constraints, closing rules, archival rules
- **Domain Errors**: Specific error types for session operations

### Application Layer
- **ManageSessions Service**: Session CRUD operations
- **Window Operations**: Application and registration window management
- **Opening Workflow**: Draft to Open transitions with validation
- **Closing Workflow**: Open to Closed transitions with validation
- **Audit Integration**: Comprehensive logging of session changes
- **Authorization Checks**: Permission-based access control

### API Layer
- **REST Endpoints**: `/api/v1/sessions` versioned API
- **Request Validation**: Input validation and sanitization
- **Response Formatting**: Consistent API responses
- **Error Handling**: Standardized error responses

### Infrastructure Layer
- **SessionRepository**: Database operations via Prisma
- **History Persistence**: Historical session record storage
- **Data Mapping**: Prisma entities to domain objects

## Session Data Model

### Core Session Attributes
- Session name (e.g., "January 2025", "June 2025")
- Start date
- End date
- Application window (start, end)
- Registration window (start, end)
- Session status (Draft, Open, Closed, Archived)
- Metadata (created by, updated by, timestamps)

### Session Status Management
- **Draft**: Initial state, can be modified
- **Open**: Active state, applications and registrations can be processed
- **Closed**: Inactive state, no new applications/registrations
- **Archived**: Terminal state, read-only historical record

### Status Transitions
```
Draft → Open → Closed → Archived
```

**Rules:**
- Draft sessions can be modified
- Open sessions can have limited modifications (critical fields protected)
- Closed sessions cannot be modified
- Archived sessions cannot be modified or unarchived
- Only Open sessions can accept applications and registrations
- Session windows must be within session start/end dates

## Window Management

### Application Window
- Defines when students can apply for programmes in this session
- Must be within session start/end dates
- Must be before registration window
- Can be modified only in Draft status

### Registration Window
- Defines when students can register for programmes in this session
- Must be within session start/end dates
- Must be after application window
- Can be modified only in Draft status

### Window Validation Rules
- Application window start must be >= session start date
- Application window end must be <= session end date
- Registration window start must be >= application window end
- Registration window end must be <= session end date
- Windows cannot overlap (application and registration)

## Persistence Strategy

### Session Table
- Primary session records
- Current status and lifecycle metadata
- Window definitions (application, registration)
- Audit fields (created_by, updated_by, timestamps)

### SessionHistory Table
- Session change history
- Status change tracking
- Window modification tracking
- Publication event logging
- Modification audit trail

## Historical Preservation

### Requirements
- Session changes must never be silently overwritten
- Historical session records must remain accessible
- Window changes must be tracked
- Status changes must be auditable
- Opening and closing events must be recorded

### Implementation
- Append-only history records
- Change history tracking for all modifications
- Status change audit trail
- Window modification tracking
- Foreign key constraints prevent deletion of referenced sessions

## Audit Integration

### Audit Events
- Session creation
- Session modification
- Session opening
- Session closing
- Session archival
- Window modifications
- Status changes

### Audit Context
- Actor information (user ID, role)
- Session information (ID, name, dates)
- Action (create, update, open, close, archive)
- Outcome (success, failure)
- Before/after state for state changes
- Change reason and reference

## Search and Indexing

### Indexed Fields
- Session name
- Session status
- Start date
- End date
- Application window dates
- Registration window dates

### Search Capabilities
- Search by session name
- Filter by status
- Filter by date ranges
- Filter by window availability
- Sort by start date

## Integration Points

### Current Integrations
- **Identity & Access Management**: User authentication and authorization
- **Audit**: Change logging and audit trail

### Future Integrations
- **Application Management**: Session-application window association
- **Registration Management**: Session-registration window association
- **Programme Management**: Session-programme associations
- **Finance Management**: Session-fee schedule associations

## Security Considerations

### Authorization
- Session creation: Academic Officer or Administrator
- Session modification: Academic Officer or Administrator
- Session opening: Academic Officer or Administrator
- Session closing: Academic Officer or Administrator
- Session archival: Administrator only
- Session viewing: All authenticated users (read-only)

### Validation
- Session name required
- Start date must be before end date
- Windows must be within session dates
- Window validation rules
- Status transition validation
- Cannot open session with invalid windows

## Testing Strategy

### Unit Tests
- Status transition validation
- Domain error handling
- Window management logic
- Business rule enforcement
- Date validation logic

### Integration Tests
- Repository operations
- Database constraints
- Window persistence
- Historical preservation

### API Tests
- Endpoint validation
- Request/response schemas
- Authorization checks
- Error handling
- Window operations

## Performance Considerations

### Caching
- Session metadata caching for frequently accessed sessions
- Window availability caching

### Database Optimization
- Appropriate indexes for search operations
- Query optimization for session listings
- Efficient history queries
- Date range query optimization

## Business Rules

### Session Is Not Cohort
- A Session represents an academic intake period (e.g., January 2025, June 2025)
- A Cohort represents a learning group within a session
- Cohort Management is excluded from Version 1.0
- Session module must not implement cohort functionality

### Opening Constraints
- Session must have valid application and registration windows
- Windows must be within session date range
- Application window must end before registration window starts
- Session cannot be opened if validation fails

### Closing Constraints
- Open sessions can be closed
- Closed sessions cannot be reopened
- Closing prevents new applications and registrations
- Existing applications/registrations are preserved

### Archival Constraints
- Only closed sessions can be archived
- Archived sessions cannot be modified
- Archival preserves historical data
- Student records maintain links to archived sessions

## Future Enhancements

### Version 2.0 Considerations
- Session-programme associations
- Session-fee schedule associations
- Session templates and cloning
- Bulk session operations
- Session reporting and analytics
- Cross-session comparison

### Scalability
- Support for large session catalogs
- Efficient date range queries
- Concurrent session management
- Session conflict detection
