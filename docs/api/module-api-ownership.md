# GISI Module API Ownership

## Ownership model

Each business module owns the API paths that expose its use cases:

| Module              | API ownership                                     |
| ------------------- | ------------------------------------------------- |
| Identity and Access | Authentication, users, roles, permissions         |
| Student             | Student profile, status, history, documents       |
| Programme           | Programmes and programme versions                 |
| Session             | Academic sessions and session status              |
| Application         | Applications and review transitions               |
| Admission           | Admissions, acceptance, deferral, letters         |
| Registration        | Registrations and registration history            |
| Finance             | Charges, payments, balances, eligibility, reports |
| Activation          | Eligibility, activation, suspension, reactivation |
| Learning            | Resources and announcements                       |
| Examination         | Examinations and candidate registration           |
| Results             | Results, publication, corrections, transcripts    |
| Progression         | Progression evaluation and decisions              |
| Certificate         | Generation, issuance, verification                |
| Notification        | In-portal notifications and approved email events |
| Reporting           | Reports, exports, dashboards                      |
| Administration      | Settings and reference data                       |
| Audit               | Audit logs and security status                    |

## Cross-module API rules

- A module must not expose another module's private persistence model.
- Cross-module workflows coordinate through application contracts or documented events.
- An endpoint that spans modules requires an identified owning module and explicit contributor review.
- API authorization must be evaluated for every affected resource.
- Finance APIs may expose eligibility but cannot activate students.
- Activation APIs require authorized Academic Officer or Administrator permissions.
- Version 2.0 modules remain excluded from Version 1.0 API contracts.
