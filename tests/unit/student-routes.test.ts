import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { ManageStudents } from '../../src/modules/student/application/manage-students.js';
import { studentRoutesPlugin } from '../../src/modules/student/api/student-routes.js';
import type { StudentProfile } from '../../src/modules/student/contracts/student-profile.js';

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
        statusChangedBy: 'admin-1',
        statusHistory: [
            {
                status: 'ACTIVE',
                changedAt: firstTime,
                changedBy: 'admin-1',
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
                    changedBy: 'admin-1',
                    reason: 'initial profile',
                },
            ],
        },
        ...overrides,
    };
}

function buildService() {
    const records = new Map<string, StudentProfile>();
    records.set('student-1', profile());

    const service = new ManageStudents({
        studentRepository: {
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
            findById: async (id) => records.get(id) ?? null,
            findByStudentNumber: async (number) =>
                [...records.values()].find((item) => item.studentNumber === number) ?? null,
            create: async (input) => {
                const created = profile({
                    id: input.id ?? 'student-created',
                    studentNumber: input.studentNumber,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    email: input.email,
                    phone: input.phone ?? null,
                    nationalId: input.nationalId ?? null,
                    addressLine1: input.addressLine1 ?? null,
                    addressLine2: input.addressLine2 ?? null,
                    city: input.city ?? null,
                    country: input.country ?? null,
                    emergencyContactName: input.emergencyContactName ?? null,
                    emergencyContactPhone: input.emergencyContactPhone ?? null,
                    status: 'ACTIVE',
                    createdAt: firstTime,
                    updatedAt: firstTime,
                    statusChangedAt: firstTime,
                    statusChangedBy: 'admin-1',
                    statusHistory: [
                        {
                            status: 'ACTIVE',
                            changedAt: firstTime,
                            changedBy: 'admin-1',
                            reason: 'fixture create',
                        },
                    ],
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
        clock: () => firstTime,
    });

    return { service, records };
}

describe('studentRoutesPlugin', () => {
    it('creates a student through the route', async () => {
        const { service } = buildService();
        const app = Fastify();
        await app.register(studentRoutesPlugin({ service }));

        const response = await app.inject({
            method: 'POST',
            url: '/students',
            payload: {
                studentNumber: 'ST-2001',
                firstName: 'Chiamaka',
                lastName: 'Okafor',
                email: 'chiamaka@example.com',
                reason: 'new admission',
                actor: { id: 'admin-1', type: 'user' },
            },
        });

        expect(response.statusCode).toBe(201);
        expect(response.json()).toMatchObject({
            studentNumber: 'ST-2001',
            firstName: 'Chiamaka',
            status: 'ACTIVE',
        });
    });

    it('lists students through the route', async () => {
        const { service } = buildService();
        const app = Fastify();
        await app.register(studentRoutesPlugin({ service }));

        const response = await app.inject({
            method: 'GET',
            url: '/students?status=ACTIVE',
            headers: { 'x-actor-id': 'admin-1' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual([
            expect.objectContaining({ id: 'student-1', status: 'ACTIVE' }),
        ]);
    });

    it('reads a student history log through the route', async () => {
        const { service } = buildService();
        const app = Fastify();
        await app.register(studentRoutesPlugin({ service }));

        const response = await app.inject({
            method: 'GET',
            url: '/students/student-1/history',
            headers: { 'x-actor-id': 'admin-1' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual([
            expect.objectContaining({
                status: 'ACTIVE',
                changedBy: 'admin-1',
            }),
        ]);
    });

    it('reads a transcript and uploads a document through the route', async () => {
        const { service } = buildService();
        const app = Fastify();
        await app.register(studentRoutesPlugin({ service }));

        const transcript = await app.inject({
            method: 'GET',
            url: '/students/student-1/transcript',
            headers: { 'x-actor-id': 'admin-1' },
        });
        expect(transcript.statusCode).toBe(200);
        expect(transcript.json()).toMatchObject({
            studentId: 'student-1',
            status: 'ACTIVE',
            history: [expect.objectContaining({ status: 'ACTIVE' })],
        });

        const document = await app.inject({
            method: 'POST',
            url: '/students/student-1/documents',
            payload: {
                name: 'admission-letter.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 2048,
                reason: 'admission record',
                actor: { id: 'admin-1', type: 'user' },
            },
        });

        expect(document.statusCode).toBe(200);
        expect(document.json()).toMatchObject({
            name: 'admission-letter.pdf',
            mimeType: 'application/pdf',
            uploadedBy: 'admin-1',
        });
    });

    it('reads and updates a student through the route', async () => {
        const { service } = buildService();
        const app = Fastify();
        await app.register(studentRoutesPlugin({ service }));

        const read = await app.inject({
            method: 'GET',
            url: '/students/student-1',
            headers: { 'x-actor-id': 'admin-1' },
        });
        expect(read.statusCode).toBe(200);
        expect(read.json()).toMatchObject({ id: 'student-1' });

        const updated = await app.inject({
            method: 'PATCH',
            url: '/students/student-1',
            payload: {
                changes: { email: 'updated@example.com' },
                reason: 'correct email',
                actor: { id: 'admin-1', type: 'user' },
            },
        });

        expect(updated.statusCode).toBe(200);
        expect(updated.json()).toMatchObject({
            id: 'student-1',
            email: 'updated@example.com',
        });
    });
});
