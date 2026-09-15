import { describe, expect, it } from 'vitest';
import { createApplication } from '../../src/bootstrap/application.js';
import { loadConfiguration } from '../../src/bootstrap/configuration.js';

const configuration = loadConfiguration({
    environment: {
        APP_NAME: 'gisi-test',
        APP_VERSION: '1.2.3',
        NODE_ENV: 'test',
        API_HOST: '127.0.0.1',
        API_PORT: '4000',
        DATABASE_URL: 'postgresql://localhost:5432/gisi_test',
        LOG_LEVEL: 'info',
        AUTH_PROVIDER: 'cognito',
    },
});

describe('application bootstrap', () => {
    it('registers the version endpoint and student routes without requiring a live database connection', async () => {
        const application = await createApplication({
            configuration,
            prisma: {
                student: {
                    findUnique: async () => null,
                    create: async ({ data }: { data: Record<string, unknown> }) => ({
                        ...data,
                        id: String(data.id ?? 'student-bootstrap'),
                        status: data.status ?? 'ACTIVE',
                        createdAt: new Date('2026-09-14T00:00:00.000Z'),
                        updatedAt: new Date('2026-09-14T00:00:00.000Z'),
                        statusChangedAt: new Date('2026-09-14T00:00:00.000Z'),
                        statusChangedBy: String(data.statusChangedBy ?? 'system'),
                        statusHistory: Array.isArray(data.statusHistory)
                            ? data.statusHistory
                            : [],
                        studentNumber: String(data.studentNumber ?? 'ST-BOOTSTRAP'),
                        firstName: String(data.firstName ?? 'Bootstrap'),
                        lastName: String(data.lastName ?? 'Student'),
                        email: String(data.email ?? 'bootstrap@example.com'),
                        phone: data.phone ?? null,
                        nationalId: data.nationalId ?? null,
                        addressLine1: data.addressLine1 ?? null,
                        addressLine2: data.addressLine2 ?? null,
                        city: data.city ?? null,
                        country: data.country ?? null,
                        emergencyContactName: data.emergencyContactName ?? null,
                        emergencyContactPhone: data.emergencyContactPhone ?? null,
                    }),
                    update: async ({ data }: { data: Record<string, unknown> }) => ({
                        id: 'student-bootstrap',
                        studentNumber: 'ST-BOOTSTRAP',
                        firstName: String(data.firstName ?? 'Bootstrap'),
                        lastName: String(data.lastName ?? 'Student'),
                        email: String(data.email ?? 'bootstrap@example.com'),
                        phone: data.phone ?? null,
                        nationalId: data.nationalId ?? null,
                        addressLine1: data.addressLine1 ?? null,
                        addressLine2: data.addressLine2 ?? null,
                        city: data.city ?? null,
                        country: data.country ?? null,
                        emergencyContactName: data.emergencyContactName ?? null,
                        emergencyContactPhone: data.emergencyContactPhone ?? null,
                        status: (data.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'WITHDRAWN') ?? 'ACTIVE',
                        createdAt: new Date('2026-09-14T00:00:00.000Z'),
                        updatedAt: new Date('2026-09-14T00:00:00.000Z'),
                        statusChangedAt: new Date('2026-09-14T00:00:00.000Z'),
                        statusChangedBy: String(data.statusChangedBy ?? 'system'),
                        statusHistory: Array.isArray(data.statusHistory)
                            ? data.statusHistory
                            : [],
                    }),
                },
                $connect: async () => undefined,
                $disconnect: async () => undefined,
                $queryRawUnsafe: async () => [{ '?column?': 1 }],
            } as any,
            authorization: { authorize: async () => true },
            auditWriter: {
                append: async (event: Record<string, unknown>) => ({
                    id: 'audit-bootstrap',
                    ...event,
                    occurredAt: event.occurredAt ?? new Date('2026-09-14T00:00:00.000Z'),
                    recordedAt: new Date('2026-09-14T00:00:00.000Z'),
                }),
            } as any,
        });

        const healthResponse = await application.inject({
            method: 'GET',
            url: '/health',
        });

        expect(healthResponse.statusCode).toBe(200);
        expect(healthResponse.json()).toEqual({ status: 'ok' });

        const versionResponse = await application.inject({
            method: 'GET',
            url: '/version',
        });

        expect(versionResponse.statusCode).toBe(200);
        expect(versionResponse.json()).toEqual({
            name: 'gisi-test',
            version: '1.2.3',
            buildIdentity: 'gisi-test@1.2.3',
        });

        const studentResponse = await application.inject({
            method: 'POST',
            url: '/students',
            payload: {
                studentNumber: 'ST-BOOTSTRAP',
                firstName: 'Bootstrap',
                lastName: 'Student',
                email: 'bootstrap@example.com',
                reason: 'bootstrap composition test',
            },
        });

        expect(studentResponse.statusCode).toBe(201);
        await application.close();
    });
});
