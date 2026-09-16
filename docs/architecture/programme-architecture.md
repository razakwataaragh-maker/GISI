# Programme Module Architecture

## Module Purpose

Manage academic programmes offered by GISI, including programme creation, versioning, publication, and archival.

## Module Boundaries

The programme module is responsible for:
- Programme lifecycle management (creation, modification, publication, archival)
- Programme version tracking and historical preservation
- Programme status management (Draft, Published, Archived)
- Programme data integrity and validation

The programme module is NOT responsible for:
- Student programme enrollment (handled by Registration Management)
- Session association (handled by Session Management)
- Fee structure management (handled by Finance Management)
- Course/module content within programmes (future version)

## Dependency Direction

```
API Layer → Application Layer → Domain Layer → Infrastructure Interfaces → Infrastructure Implementations
```

### External Dependencies
- **Identity & Access Management**: Authentication and authorization for programme operations
- **Audit**: Audit logging for programme changes
- **Infrastructure**: Database persistence via Prisma

### Future Dependencies
- **Session Management**: Programmes will be associated with sessions
- **Finance Management**: Programmes will have associated fee structures
- **Registration Management**: Students will be enrolled in programmes

## Module Structure

```
src/modules/programme/
├── api/
│   └── programme-routes.ts          # REST API endpoints
├── application/
│   ├── index.ts                     # Application service exports
│   └── manage-programmes.ts         # Programme CRUD operations
├── contracts/
│   └── programme.ts                 # TypeScript interfaces and types
├── domain/
│   ├── index.ts                     # Domain exports
│   ├── programme.ts                 # Domain errors and types
│   └── programme-status-transitions.ts  # Status transition logic
└── infrastructure/
    └── programme-repository.ts      # Prisma repository implementation
```

## Core Responsibilities

### Domain Layer
- **Programme Entity**: Core programme business logic
- **Status Transitions**: Valid status changes (Draft → Published → Archived)
- **Version Management**: Programme version tracking
- **Business Rules**: Publication constraints, archival rules
- **Domain Errors**: Specific error types for programme operations

### Application Layer
- **ManageProgrammes Service**: Programme CRUD operations
- **Version Operations**: Version creation and comparison
- **Publication Workflow**: Draft to Published transitions
- **Audit Integration**: Comprehensive logging of programme changes
- **Authorization Checks**: Permission-based access control

### API Layer
- **REST Endpoints**: `/api/v1/programmes` versioned API
- **Request Validation**: Input validation and sanitization
- **Response Formatting**: Consistent API responses
- **Error Handling**: Standardized error responses

### Infrastructure Layer
- **ProgrammeRepository**: Database operations via Prisma
- **Version Persistence**: Historical programme record storage
- **Data Mapping**: Prisma entities to domain objects

## Programme Data Model

### Core Programme Attributes
- Programme code (unique identifier)
- Programme name
- Programme description
- Programme status (Draft, Published, Archived)
- Version number
- Effective dates
- Metadata (created by, updated by, timestamps)

### Programme Versioning Strategy
- **Immutable Versions**: Once published, programme versions are immutable
- **Historical Preservation**: All versions remain accessible
- **Student Linkage**: Student records link to specific programme versions
- **Version Comparison**: Support for comparing programme versions

### Status Transitions
```
Draft → Published → Archived
```

**Rules:**
- Draft programmes can be modified
- Published programmes cannot be modified (must create new version)
- Archived programmes cannot be modified or unarchived
- Only Published programmes can be associated with sessions/registrations

## Persistence Strategy

### Programme Table
- Primary programme records
- Current active version reference
- Status and lifecycle metadata
- Audit fields (created_by, updated_by, timestamps)

### ProgrammeVersion Table
- Historical programme versions
- Version-specific data
- Effective date ranges
- Student linkages (future)

### ProgrammeHistory Table
- Programme change history
- Status change tracking
- Publication event logging
- Modification audit trail

## Historical Preservation

### Requirements
- Programme versions must never be silently overwritten
- Historical versions must remain accessible
- Student records must maintain links to programme versions at time of enrollment
- Publication events must be auditable

### Implementation
- Append-only version records
- Foreign key constraints prevent deletion of referenced versions
- Change history tracking for all modifications
- Status change audit trail

## Audit Integration

### Audit Events
- Programme creation
- Programme modification
- Programme publication
- Programme archival
- Status changes
- Version creation

### Audit Context
- Actor information (user ID, role)
- Programme information (ID, code, version)
- Action (create, update, publish, archive)
- Outcome (success, failure)
- Before/after state for state changes
- Change reason and reference

## Search and Indexing

### Indexed Fields
- Programme code (unique)
- Programme name
- Programme status
- Publication date
- Effective date range

### Search Capabilities
- Search by programme code
- Search by programme name
- Filter by status
- Filter by publication date range
- Filter by effective date range

## Integration Points

### Current Integrations
- **Identity & Access Management**: User authentication and authorization
- **Audit**: Change logging and audit trail

### Future Integrations
- **Session Management**: Programme-session associations
- **Finance Management**: Programme fee structures
- **Registration Management**: Student programme enrollment
- **Learning Management**: Course/module content

## Security Considerations

### Authorization
- Programme creation: Academic Officer or Administrator
- Programme modification: Academic Officer or Administrator
- Programme publication: Academic Officer or Administrator
- Programme archival: Administrator only
- Programme viewing: All authenticated users (read-only)

### Validation
- Programme code uniqueness
- Programme name required
- Publication constraints (all required fields populated)
- Archival constraints (no active registrations - future)
- Version consistency checks

## Testing Strategy

### Unit Tests
- Status transition validation
- Domain error handling
- Version management logic
- Business rule enforcement

### Integration Tests
- Repository operations
- Database constraints
- Version persistence
- Historical preservation

### API Tests
- Endpoint validation
- Request/response schemas
- Authorization checks
- Error handling

## Performance Considerations

### Caching
- Programme metadata caching for frequently accessed programmes
- Version cache for comparison operations

### Database Optimization
- Appropriate indexes for search operations
- Query optimization for programme listings
- Efficient version history queries

## Future Enhancements

### Version 2.0 Considerations
- Programme curriculum management
- Module/unit organization within programmes
- Learning outcomes and competencies
- Accreditation information
- Programme prerequisites and dependencies

### Scalability
- Support for large programme catalogs
- Efficient version comparison algorithms
- Bulk programme operations
- Programme templates and cloning
