import { describe, expect, it } from 'vitest';
import type {
    AuditEvent,
    AuditEventInput,
} from '../../src/modules/audit/domain/audit-writer.js';
import { ManageStudents } from '../../src/modules/student/application/manage-students.js';
import { createStudentManagementModule } from '../../src/modules/student/index.js';
import type {
    StudentManagementRepository,
    StudentProfile,
} from '../../src/modules/student/contracts/student-profile.js';
import {
    DuplicateStudentNumberError,
    InvalidStudentStatusTransitionError,
    InvalidStudentUpdateError,
    StudentNotFoundError,
    UnauthorizedStudentManagementError,
} from '../../src/modules/student/domain/student-profile.js';

const actor = { id: 'admin-1', type: 'user' as const };
const firstTime = new Date('2026-09-14T10:00:00.000Z');

function profile(overrides: Partial<StudentProfile> = {}): StudentProfile {
    return {
        id: 'student-1',
        studentNumber: 'ST-1001',
        firstName: 'Amina',
        lastName: 'Yusuf',
        email: 'amina@example.com',
        phone: '+2348000000000',
        nationalId: 'NIN-1001',
        addressLine1: '1 Main Street',
        addressLine2: null,
        city: 'Kano',
        country: 'Nigeria',
        emergencyContactName: 'Musa Yusuf',
        emergencyContactPhone: '+2348000000001',
        status: 'ACTIVE',
        createdAt: firstTime,
        updatedAt: firstTime,
        statusChangedAt: firstTime,
        statusChangedBy: actor.id,
        statusHistory: [
            {
                status: 'ACTIVE',
                changedAt: firstTime,
                changedBy: actor.id,
                reason: 'initial profile',
            },
        ],
        documents: [],
        transcript: {
            studentId: 'student-1',
            status: 'ACTIVE',
            currentProgram: null,
            issuedAt: null,
            history: [
                {
                    status: 'ACTIVE',
                    changedAt: firstTime,
                    changedBy: actor.id,
                    reason: 'initial profile',
                },
            ],
        },
        ...overrides,
    };
}

function harness(initial: StudentProfile | null = null) {
    const records = new Map<string, StudentProfile>(
        initial === null ? [] : [[initial.id, initial]],
    );
    const events: AuditEventInput[] = [];
    const repository: StudentManagementRepository = {
        findMany: async (query = {}) => {
            const items = [...records.values()];
            return items.filter((item) => {
                const matchesStatus =
                    query.status === undefined || item.status === query.status;
                const matchesStudentNumber =
                    query.studentNumber === undefined ||
                    item.studentNumber === query.studentNumber;
                const matchesEmail =
                    query.email === undefined ||
                    item.email.toLowerCase().includes(query.email.toLowerCase());
                return matchesStatus && matchesStudentNumber && matchesEmail;
            });
        },
        findById: async (id) =>
            [...records.values()].find((item) => item.id === id) ?? null,
        findByStudentNumber: async (number) =>
            [...records.values()].find(
                (item) => item.studentNumber === number,
            ) ?? null,
        create: async (input) => {
            const created = profile({
                ...input,
                id: input.id ?? 'student-created',
                statusHistory: input.statusHistory,
            });
            records.set(created.id, created);
            return created;
        },
        update: async (id, fields) => {
            const existing = records.get(id);
            if (existing === undefined) throw new Error('missing fixture');
            const updated = { ...existing, ...fields };
            records.set(id, updated);
            return updated;
        },
    };

    const service = new ManageStudents({
        studentRepository: repository,
        authorization: { authorize: async () => true },
        auditWriter: {
            append: async (event): Promise<AuditEvent> => {
                events.push(event);
                return {
                    id: `audit-${events.length}`,
                    ...event,
                    occurredAt: event.occurredAt ?? firstTime,
                    recordedAt: firstTime,
                };
            },
        },
        clock: () => firstTime,
    });

    return { service, events, records, repository };
}

describe('ManageStudents', () => {
    it('composes a ready-to-register student management module', () => {
        const { service, routes } = createStudentManagementModule({
            studentRepository: {
                findMany: async () => [],
                findById: async () => null,
                findByStudentNumber: async () => null,
                create: async (input) => profile({ ...input, id: 'module-student' }),
                update: async (id, fields) => profile({ id, ...fields }),
            },
            authorization: { authorize: async () => true },
            auditWriter: {
                append: async (event) => ({
                    id: `audit-${event.eventName}`,
                    ...event,
                    occurredAt: event.occurredAt ?? firstTime,
                    recordedAt: firstTime,
                }),
            },
        });

        expect(service).toBeInstanceOf(ManageStudents);
        expect(typeof routes).toBe('function');
    });

    it('creates a student profile and records a success audit event', async () => {
        const { service, events } = harness();

        const created = await service.create({
            studentNumber: 'ST-2001',
            firstName: 'Chiamaka',
            lastName: 'Okafor',
            email: 'chiamaka@example.com',
            actor,
            reason: 'initial admission',
        });

        expect(created.studentNumber).toBe('ST-2001');
        expect(created.status).toBe('ACTIVE');
        expect(events[0]).toMatchObject({
            eventName: 'student_created',
            actorId: actor.id,
            targetId: created.id,
            outcome: 'success',
        });
    });

    it('rejects duplicate student numbers', async () => {
        const { service, events } = harness(profile());

        await expect(
            service.create({
                studentNumber: 'ST-1001',
                firstName: 'Duplicate',
                lastName: 'Student',
                email: 'duplicate@example.com',
                actor,
                reason: 'duplicate',
            }),
        ).rejects.toBeInstanceOf(DuplicateStudentNumberError);

        expect(events[events.length - 1]).toMatchObject({
            eventName: 'student_create_failed',
            actorId: actor.id,
            outcome: 'failure',
            reason: 'duplicate_student_number',
        });
    });

    it('lists students with optional filtering', async () => {
        const { service } = harness(profile());

        const results = await service.list(actor, { status: 'ACTIVE' });
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ id: 'student-1', status: 'ACTIVE' });
    });

    it('returns a student history log', async () => {
        const { service } = harness(profile());

        const history = await service.history('student-1', actor);
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
            status: 'ACTIVE',
            changedBy: actor.id,
            reason: 'initial profile',
        });
    });

    it('allows approved profile updates and rejects unsupported fields', async () => {
        const { service, events } = harness(profile());

        const updated = await service.update({
            id: 'student-1',
            actor,
            changes: { email: 'new@example.com' },
            reason: 'correct email',
        });
        expect(updated.email).toBe('new@example.com');

        await expect(
            service.update({
                id: 'student-1',
                actor,
                changes: { studentNumber: 'ST-3000' } as never,
                reason: 'invalid field',
            }),
        ).rejects.toBeInstanceOf(InvalidStudentUpdateError);

        expect(events[events.length - 1]).toMatchObject({
            eventName: 'student_update_failed',
            actorId: actor.id,
            outcome: 'failure',
            reason: 'invalid_student_update_field',
        });
    });

    it('enforces valid status transitions and preserves history', async () => {
        const { service } = harness(
            profile({
                status: 'ACTIVE',
                statusHistory: [
                    {
                        status: 'ACTIVE',
                        changedAt: firstTime,
                        changedBy: actor.id,
                        reason: 'initial',
                    },
                ],
            }),
        );

        const suspended = await service.suspend({
            id: 'student-1',
            actor,
            reason: 'misconduct review',
        });
        expect(suspended.status).toBe('SUSPENDED');
        expect(suspended.statusHistory).toHaveLength(2);
        expect(suspended.statusHistory[1]).toMatchObject({
            status: 'SUSPENDED',
            changedBy: actor.id,
            reason: 'misconduct review',
        });

        await expect(
            service.reactivate({
                id: 'student-1',
                actor,
                reason: 'review cleared',
            }),
        ).resolves.toMatchObject({ status: 'ACTIVE' });
    });

    it('rejects invalid status transitions', async () => {
        const { service, events } = harness(profile({ status: 'INACTIVE' }));

        await expect(
            service.suspend({
                id: 'student-1',
                actor,
                reason: 'invalid transition',
            }),
        ).rejects.toBeInstanceOf(InvalidStudentStatusTransitionError);

        expect(events[events.length - 1]).toMatchObject({
            eventName: 'student_transition_failed',
            actorId: actor.id,
            outcome: 'failure',
            reason: 'invalid_student_status_transition',
        });
    });

    it('throws a not found error when updating a missing student', async () => {
        const { service, events } = harness();

        await expect(
            service.update({
                id: 'missing-student',
                actor,
                changes: { email: 'new@example.com' },
                reason: 'record update',
            }),
        ).rejects.toBeInstanceOf(StudentNotFoundError);

        expect(events[events.length - 1]).toMatchObject({
            eventName: 'student_not_found',
            actorId: actor.id,
            outcome: 'failure',
            reason: 'student_not_found',
            targetId: 'missing-student',
        });
    });

    it('audits authorization denials', async () => {
        const { repository } = harness();
        const events: AuditEventInput[] = [];
        const denied = new ManageStudents({
            studentRepository: repository,
            authorization: { authorize: async () => false },
            auditWriter: {
                append: async (event): Promise<AuditEvent> => {
                    events.push(event);
                    return {
                        id: `audit-${events.length}`,
                        ...event,
                        occurredAt: event.occurredAt ?? firstTime,
                        recordedAt: firstTime,
                    };
                },
            },
        });

        await expect(
            denied.create({
                studentNumber: 'ST-777',
                firstName: 'No',
                lastName: 'Access',
                email: 'noaccess@example.com',
                actor,
                reason: 'forbidden',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedStudentManagementError);

        expect(events[events.length - 1]).toMatchObject({
            eventName: 'authorization_denied',
            actorId: actor.id,
            action: 'create',
            outcome: 'failure',
            reason: 'authorization_denied',
        });
    });
});
