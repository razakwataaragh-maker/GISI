# ADR 0011: AWS with Portable Infrastructure Interfaces

- **Status:** Accepted
- **Date:** 2026-09-13

## Decision

Use AWS as the initial cloud platform with API Gateway, Lambda, RDS PostgreSQL, S3, CloudFront, Cognito, CloudWatch, and EventBridge as appropriate. Use AWS CDK in TypeScript for infrastructure as code.

## Rationale

- Aligns with the SRS cloud strategy.
- Provides managed services for API hosting, compute, PostgreSQL, storage, identity, observability, and scheduling/events.
- CDK allows infrastructure to be expressed in the selected backend language with reusable constructs.
- Provider adapters preserve portability of business logic.

## Alternatives rejected

- **Kubernetes-first deployment:** adds operational complexity and is not required for Version 1.0.
- **AWS-specific calls throughout the application:** violates the cloud-portability principle.
- **Multi-cloud deployment from the beginning:** increases cost and complexity without a Version 1.0 requirement.

## Constraints

AWS-specific implementations belong in infrastructure adapters. Domain and application layers must depend on interfaces, not AWS SDK types. The initial deployment choice must not change GISI business rules.
