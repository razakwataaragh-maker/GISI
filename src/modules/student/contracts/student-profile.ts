export type StudentStatus =
    | 'ACTIVE'
    | 'INACTIVE'
    | 'SUSPENDED'
    | 'GRADUATED'
    | 'WITHDRAWN';

export type StudentStatusTransition =
    | 'activate'
    | 'deactivate'
    | 'suspend'
    | 'reactivate'
    | 'graduate'
    | 'withdraw';

export interface StudentActor {
    readonly id: string;
    readonly type: 'user' | 'system' | 'service';
}

export interface StudentStatusHistoryEntry {
    readonly status: StudentStatus;
    readonly changedAt: Date;
    readonly changedBy: string;
    readonly reason: string;
}

export interface StudentDocument {
    readonly id: string;
    readonly name: string;
    readonly mimeType: string;
    readonly sizeBytes: number;
    readonly uploadedAt: Date;
    readonly uploadedBy: string;
    readonly reason?: string | undefined;
    readonly url?: string | undefined;
}

export interface StudentTranscript {
    readonly studentId: string;
    readonly status: StudentStatus;
    readonly currentProgram: string | null;
    readonly issuedAt: Date | null;
    readonly history: readonly StudentStatusHistoryEntry[];
}

export interface StudentProfile {
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
    readonly documents: readonly StudentDocument[];
    readonly transcript: StudentTranscript;
}

export interface StudentProfileUpdateFields {
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
}

export interface StudentListQuery {
    readonly status?: StudentStatus;
    readonly studentNumber?: string;
    readonly email?: string;
}

export interface CreateStudentProfileInput {
    readonly studentNumber: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phone?: string | null;
    readonly nationalId?: string | null;
    readonly addressLine1?: string | null;
    readonly addressLine2?: string | null;
    readonly city?: string | null;
    readonly country?: string | null;
    readonly emergencyContactName?: string | null;
    readonly emergencyContactPhone?: string | null;
    readonly actor: StudentActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export interface UpdateStudentProfileInput {
    readonly id: string;
    readonly actor: StudentActor;
    readonly changes: StudentProfileUpdateFields;
    readonly reason: string;
    readonly correlationId?: string;
}

export interface TransitionStudentStatusInput {
    readonly id: string;
    readonly transition: StudentStatusTransition;
    readonly actor: StudentActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export type StudentManagementAction =
    | 'student.create'
    | 'student.read'
    | 'student.update'
    | 'student.activate'
    | 'student.deactivate'
    | 'student.suspend'
    | 'student.reactivate'
    | 'student.graduate'
    | 'student.withdraw';

export interface StudentAuthorization {
    authorize(input: {
        readonly actor: StudentActor;
        readonly action: StudentManagementAction;
        readonly targetStudentId?: string;
    }): Promise<boolean>;
}

export interface StudentManagementRepository {
    findMany(query?: StudentListQuery): Promise<readonly StudentProfile[]>;
    findById(id: string): Promise<StudentProfile | null>;
    findByStudentNumber(studentNumber: string): Promise<StudentProfile | null>;
    create(input: {
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
        readonly documents?: readonly StudentDocument[];
        readonly transcript?: StudentTranscript;
    }): Promise<StudentProfile>;
    update(
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
            readonly documents?: readonly StudentDocument[];
            readonly transcript?: StudentTranscript;
        },
    ): Promise<StudentProfile>;
}
