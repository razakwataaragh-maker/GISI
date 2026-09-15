import type {
    StudentDocument,
    StudentListQuery,
    StudentManagementRepository,
    StudentProfile,
    StudentStatus,
    StudentStatusHistoryEntry,
    StudentTranscript,
} from '../contracts/student-profile.js';

interface StudentRecord {
    readonly id: string;
    readonly studentNumber: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phone: string | null;
    readonly nationalId: string | null;
    readonly addressLine1: string | null;
    readonly addressLine2: string | null;
    readonly city: string | null;
    readonly country: string | null;
    readonly emergencyContactName: string | null;
    readonly emergencyContactPhone: string | null;
    readonly status: StudentStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly statusChangedAt: Date;
    readonly statusChangedBy: string;
    readonly statusHistory: readonly StudentStatusHistoryEntry[];
    readonly documents?: readonly StudentDocument[];
    readonly transcript?: StudentTranscript;
}

interface StudentStore {
    readonly student: {
        findMany(args: {
            readonly where?: Record<string, unknown>;
            readonly select: StudentSelect;
            readonly orderBy?: { readonly createdAt: 'asc' | 'desc' };
        }): Promise<StudentRecord[]>;
        findUnique(args: {
            readonly where:
                | { readonly id: string }
                | { readonly studentNumber: string };
            readonly select: StudentSelect;
        }): Promise<StudentRecord | null>;
        create(args: {
            readonly data: Record<string, unknown>;
        }): Promise<StudentRecord>;
        update(args: {
            readonly where: { readonly id: string };
            readonly data: Record<string, unknown>;
            readonly select: StudentSelect;
        }): Promise<StudentRecord>;
    };
}

interface StudentSelect {
    readonly id: true;
    readonly studentNumber: true;
    readonly firstName: true;
    readonly lastName: true;
    readonly email: true;
    readonly phone: true;
    readonly nationalId: true;
    readonly addressLine1: true;
    readonly addressLine2: true;
    readonly city: true;
    readonly country: true;
    readonly emergencyContactName: true;
    readonly emergencyContactPhone: true;
    readonly status: true;
    readonly createdAt: true;
    readonly updatedAt: true;
    readonly statusChangedAt: true;
    readonly statusChangedBy: true;
    readonly statusHistory: true;
}

const studentSelect: StudentSelect = {
    id: true,
    studentNumber: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    nationalId: true,
    addressLine1: true,
    addressLine2: true,
    city: true,
    country: true,
    emergencyContactName: true,
    emergencyContactPhone: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    statusChangedAt: true,
    statusChangedBy: true,
    statusHistory: true,
};

export class PrismaStudentRepository implements StudentManagementRepository {
    constructor(private readonly store: StudentStore) {}

    async findMany(query: StudentListQuery = {}): Promise<readonly StudentProfile[]> {
        const records = await this.store.student.findMany({
            where: {
                ...(query.status === undefined ? {} : { status: query.status }),
                ...(query.studentNumber === undefined ? {} : { studentNumber: query.studentNumber }),
                ...(query.email === undefined ? {} : { email: { contains: query.email, mode: 'insensitive' } }),
            },
            select: studentSelect,
            orderBy: { createdAt: 'desc' },
        });
        return records.map(normalize);
    }

    async findById(id: string): Promise<StudentProfile | null> {
        const record = await this.store.student.findUnique({
            where: { id },
            select: studentSelect,
        });
        return record === null ? null : normalize(record);
    }

    async findByStudentNumber(studentNumber: string): Promise<StudentProfile | null> {
        const record = await this.store.student.findUnique({
            where: { studentNumber },
            select: studentSelect,
        });
        return record === null ? null : normalize(record);
    }

    async create(input: {
        readonly id?: string;
        readonly studentNumber: string;
        readonly firstName: string;
        readonly lastName: string;
        readonly email: string;
        readonly phone: string | null;
        readonly nationalId: string | null;
        readonly addressLine1: string | null;
        readonly addressLine2: string | null;
        readonly city: string | null;
        readonly country: string | null;
        readonly emergencyContactName: string | null;
        readonly emergencyContactPhone: string | null;
        readonly status: StudentStatus;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly statusChangedAt: Date;
        readonly statusChangedBy: string;
        readonly statusHistory: readonly StudentStatusHistoryEntry[];
    }): Promise<StudentProfile> {
        const record = await this.store.student.create({
            data: {
                ...(input.id === undefined ? {} : { id: input.id }),
                studentNumber: input.studentNumber,
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                phone: input.phone,
                nationalId: input.nationalId,
                addressLine1: input.addressLine1,
                addressLine2: input.addressLine2,
                city: input.city,
                country: input.country,
                emergencyContactName: input.emergencyContactName,
                emergencyContactPhone: input.emergencyContactPhone,
                status: input.status,
                createdAt: input.createdAt,
                updatedAt: input.updatedAt,
                statusChangedAt: input.statusChangedAt,
                statusChangedBy: input.statusChangedBy,
                statusHistory: input.statusHistory.map((entry) => ({
                    status: entry.status,
                    changedAt: entry.changedAt.toISOString(),
                    changedBy: entry.changedBy,
                    reason: entry.reason,
                })),
            },
        });
        return normalize(record);
    }

    async update(
        id: string,
        fields: {
            readonly firstName?: string;
            readonly lastName?: string;
            readonly email?: string;
            readonly phone?: string | null;
            readonly nationalId?: string | null;
            readonly addressLine1?: string | null;
            readonly addressLine2?: string | null;
            readonly city?: string | null;
            readonly country?: string | null;
            readonly emergencyContactName?: string | null;
            readonly emergencyContactPhone?: string | null;
            readonly status?: StudentStatus;
            readonly updatedAt: Date;
            readonly statusChangedAt?: Date;
            readonly statusChangedBy?: string;
            readonly statusHistory?: readonly StudentStatusHistoryEntry[];
        },
    ): Promise<StudentProfile> {
        const record = await this.store.student.update({
            where: { id },
            data: {
                ...fields,
                statusHistory:
                    fields.statusHistory === undefined
                        ? undefined
                        : fields.statusHistory.map((entry) => ({
                              status: entry.status,
                              changedAt: entry.changedAt.toISOString(),
                              changedBy: entry.changedBy,
                              reason: entry.reason,
                          })),
            },
            select: studentSelect,
        });
        return normalize(record);
    }
}

export { PrismaStudentRepository as PrismaStudentProfileRepository };

function normalize(record: StudentRecord): StudentProfile {
    const statusHistory = parseHistory(record.statusHistory);
    return {
        id: record.id,
        studentNumber: record.studentNumber,
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        phone: record.phone,
        nationalId: record.nationalId,
        addressLine1: record.addressLine1,
        addressLine2: record.addressLine2,
        city: record.city,
        country: record.country,
        emergencyContactName: record.emergencyContactName,
        emergencyContactPhone: record.emergencyContactPhone,
        status: record.status,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        statusChangedAt: record.statusChangedAt,
        statusChangedBy: record.statusChangedBy,
        statusHistory,
        documents: Array.isArray(record.documents) ? record.documents : [],
        transcript: {
            studentId: record.id,
            status: record.status,
            currentProgram: null,
            issuedAt: null,
            history: statusHistory,
            ...(record.transcript ?? {}),
        },
    };
}

function parseHistory(history: unknown): StudentStatusHistoryEntry[] {
    if (!Array.isArray(history)) {
        return [];
    }

    return history.map((entry) => {
        const candidate = entry as Partial<StudentStatusHistoryEntry> & {
            readonly changedAt?: string | Date;
        };
        return {
            status: candidate.status ?? 'INACTIVE',
            changedAt:
                candidate.changedAt === undefined
                    ? new Date()
                    : new Date(candidate.changedAt),
            changedBy: candidate.changedBy ?? 'system',
            reason: candidate.reason ?? 'unknown',
        };
    });
}
