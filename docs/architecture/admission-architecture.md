# Admission Module Architecture

## Module Purpose

Manage admission decisions for approved applications, including admission record creation, admission letter generation, acceptance/deferral workflows, and status management.

## Module Boundaries

The admission module is responsible for:
- Admission record creation from approved applications
- Admission letter generation and management
- Admission acceptance workflow
- Admission deferral workflow
- Admission expiration management
- Status management (Offered, Accepted, Declined, Deferred, Expired)
- Admission history tracking

The admission module is NOT responsible for:
- Application management (handled by Application Management)
- Student profile management (handled by Student Management)
- Programme management (handled by Programme Management)
- Session management (handled by Session Management)
- Registration processing (handled by Registration Management)
- Payment processing (handled by Finance Management)

## Dependency Direction

```
API Layer → Application Layer → Domain Layer → Infrastructure Interfaces → Infrastructure Implementations
```

### External Dependencies
- **Identity & Access Management**: Authentication and authorization for admission operations
- **Student Management**: Student information for admission records
- **Application Management**: Approved application data for admission creation
- **Programme Management**: Programme information for admission records
- **Session Management**: Session information for admission records
- **Audit**: Audit logging for admission changes

### Future Dependencies
- **Registration Management**: Accepted admission-to-registration transitions
- **Finance Management**: Admission fee payment processing
- **Notification Management**: Admission letter delivery (email triggers)

## Module Structure

```
src/modules/admission/
├── api/
│   └── admission-routes.ts         # REST API endpoints
├── application/
│   ├── index.ts                       # Application service exports
│   └── manage-admissions.ts          # Admission CRUD operations
├── contracts/
│   └── admission.ts                   # TypeScript interfaces and types
├── domain/
│   ├── index.ts                       # Domain exports
│   ├── admission.ts                   # Domain errors and types
│   └── admission-status-transitions.ts  # Status transition logic
└── infrastructure/
    └── admission-repository.ts       # Prisma repository implementation
```

## Core Responsibilities

### Domain Layer
- **Admission Entity**: Core admission business logic
- **Status Transitions**: Valid status changes (Offered → Accepted/Declined/Deferred → Expired)
- **Validation Logic**: Admission completeness and correctness validation
- **Business Rules**: Acceptance deadlines, deferral constraints, expiration rules
- **Domain Errors**: Specific error types for admission operations

### Application Layer
- **ManageAdmissions Service**: Admission CRUD operations
- **Admission Creation**: Create admission from approved application
- **Letter Generation**: Admission letter generation and management
- **Acceptance Workflow**: Student acceptance of admission offer
- **Deferral Workflow**: Student deferral of admission offer
- **Decline Workflow**: Student decline of admission offer
- **Expiration Management**: Admission expiration handling
- **Audit Integration**: Comprehensive logging of admission changes
- **Authorization Checks**: Permission-based access control

### API Layer
- **REST Endpoints**: `/api/v1/admissions` versioned API
- **Request Validation**: Input validation and sanitization
- **Response Formatting**: Consistent API responses
- **Error Handling**: Standardized error responses

### Infrastructure Layer
- **AdmissionRepository**: Database operations via Prisma
- **History Persistence**: Historical admission record storage
- **Data Mapping**: Prisma entities to domain objects

## Admission Data Model

### Core Admission Attributes
- Admission ID (unique identifier)
- Application ID (foreign key to Application)
- Student ID (foreign key to Student)
- Programme ID (foreign key to Programme)
- Session ID (foreign key to Session)
- Admission status (Offered, Accepted, Declined, Deferred, Expired)
- Offer date
- Acceptance deadline
- Accepted date
- Deferred date
- Deferral end date
- Declined date
- Expired date
- Admission letter content
- Admission letter generated at
- Metadata (created by, updated by, timestamps)

### Admission Status Management
- **Offered**: Initial state after admission creation from approved application
- **Accepted**: Student has accepted the admission offer
- **Declined**: Student has declined the admission offer
- **Deferred**: Student has deferred the admission offer
- **Expired**: Admission offer has expired (not accepted by deadline)

### Status Transitions
```
Offered → Accepted (terminal)
Offered → Declined (terminal)
Offered → Deferred → Accepted/Declined/Expired
Deferred → Expired (if not accepted by deferral end date)
```

**Rules:**
- Only Offered admissions can be accepted, declined, or deferred
- Accepted admissions are terminal (cannot be changed)
- Declined admissions are terminal (cannot be changed)
- Deferred admissions can be accepted or declined within deferral period
- Deferred admissions expire if not accepted by deferral end date
- Expired admissions are terminal (cannot be changed)
- Admission letters are generated when admission is Offered

## Validation Requirements

### Pre-Admission Creation Validation
- Application must be in APPROVED status
- Application must not already have an admission record
- Student must be valid and active
- Programme must be published
- Session must be open

### Acceptance Validation
- Admission must be in OFFERED or DEFERRED status
- Current date must be before acceptance deadline
- Student must be authenticated as the admission owner

### Deferral Validation
- Admission must be in OFFERED status
- Current date must be before acceptance deadline
- Deferral must be within allowed deferral period
- Student must be authenticated as the admission owner

### Decline Validation
- Admission must be in OFFERED or DEFERRED status
- Student must be authenticated as the admission owner

## Persistence Strategy

### Admission Table
- Primary admission records
- Current status and lifecycle metadata
- Decision information
- Letter content and generation timestamp
- Audit fields (created_by, updated_by, timestamps)

### AdmissionHistory Table
- Admission change history
- Status change tracking
- Decision event logging
- Modification audit trail

## Historical Preservation

### Requirements
- Admission changes must never be silently overwritten
- Historical admission records must remain accessible
- Status changes must be auditable
- Decision events must be tracked
- Letter generation events must be tracked

### Implementation
- Append-only history records
- Change history tracking for all modifications
- Status change audit trail
- Decision event logging
- Foreign key constraints prevent deletion of referenced admissions

## Audit Integration

### Audit Events
- Admission creation
- Admission modification
- Admission acceptance
- Admission deferral
- Admission decline
- Admission expiration
- Admission letter generation
- Status changes

### Audit Context
- Actor information (user ID, role)
- Admission information (ID, student ID, programme ID)
- Action (create, accept, defer, decline, expire)
- Outcome (success, failure)
- Before/after state for state changes
- Change reason and reference

## Search and Indexing

### Indexed Fields
- Student ID
- Application ID
- Programme ID
- Session ID
- Admission status
- Offer date
- Acceptance deadline
- Accepted date

### Search Capabilities
- Search by student ID
- Filter by application ID
- Filter by programme
- Filter by session
- Filter by status
- Filter by offer date range
- Filter by acceptance deadline range

## Integration Points

### Current Integrations
- **Identity & Access Management**: User authentication and authorization
- **Student Management**: Student information for admissions
- **Application Management**: Approved application data for admission creation
- **Programme Management**: Programme information for admission records
- **Session Management**: Session information for admission records
- **Audit**: Change logging and audit trail

### Future Integrations
- **Registration Management**: Accepted admission-to-registration transitions
- **Finance Management**: Admission fee payment processing
- **Notification Management**: Admission letter delivery (email trigger)

## Security Considerations

### Authorization
- Admission creation: Administrators or Academic Officers
- Admission viewing: Students (own admissions) or Administrators
- Admission acceptance: Students (own admissions) or Administrators
- Admission deferral: Students (own admissions) or Administrators
- Admission decline: Students (own admissions) or Administrators
- Admission letter viewing: Students (own admissions) or Administrators
- All admissions viewing: Administrators only

### Validation
- Student must be authenticated
- Student can only access their own admissions (except administrators)
- Admission can only be created from approved applications
- Application must not already have an admission record
- Acceptance must be before deadline
- Deferral must be within allowed period

## Testing Strategy

### Unit Tests
- Status transition validation
- Domain error handling
- Validation logic
- Business rule enforcement
- Letter generation logic

### Integration Tests
- Repository operations
- Database constraints
- Validation persistence
- Historical preservation

### API Tests
- Endpoint validation
- Request/response schemas
- Authorization checks
- Error handling
- Letter operations

## Performance Considerations

### Caching
- Programme availability caching
- Session availability caching
- Admission metadata caching

### Database Optimization
- Appropriate indexes for search operations
- Query optimization for admission listings
- Efficient history queries
- Letter content queries

## Business Rules

### Admission Creation
- Admissions can only be created from approved applications
- One admission per application (no duplicate admissions)
- Admission letters are generated automatically on creation
- Acceptance deadline is set based on session rules

### Acceptance Workflow
- Students can accept admission offers
- Acceptance must be before deadline
- Accepted admissions proceed to registration
- Accepted admissions cannot be changed

### Deferral Workflow
- Students can defer admission offers
- Deferral must be before acceptance deadline
- Deferral has a defined end date
- Deferred admissions can be accepted within deferral period
- Deferred admissions expire if not accepted by deferral end date

### Decline Workflow
- Students can decline admission offers
- Declined admissions cannot be changed
- Declined admissions do not proceed to registration

### Expiration Rules
- Admissions expire if not accepted by deadline
- Deferred admissions expire if not accepted by deferral end date
- Expired admissions cannot be changed
- Expired admissions do not proceed to registration

### Letter Generation
- Admission letters are generated on admission creation
- Letters contain programme, session, and deadline information
- Letters are immutable once generated
- Letters can be viewed by students and administrators

## Future Enhancements

### Version 2.0 Considerations
- Conditional offers
- Scholarship offers
- Waitlist management
- Admission analytics and reporting
- Bulk admission processing
- Automated acceptance reminders
- Deferral approval workflow

### Scalability
- Support for high-volume admission periods
- Efficient letter generation
- Concurrent admission handling
- Admission conflict detection
