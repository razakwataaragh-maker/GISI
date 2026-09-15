import type {
    AuditEventInput,
    AuditWriter,
} from '../../audit/domain/audit-writer.js';
import type {
    CreateStudentProfileInput,
    StudentAuthorization,
    StudentDocument,
    StudentManagementRepository,
    StudentProfile,
    StudentProfileUpdateFields,
    StudentStatus,
    StudentStatusHistoryEntry,
    TransitionStudentStatusInput,
    UpdateStudentProfileInput,
} from '../contracts/student-profile.js';
import {
    applyStudentStatusChange,
    DuplicateStudentNumberError,
    InvalidStudentStatusTransitionError,
    InvalidStudentUpdateError,
    nextStudentStatus,
    StudentNotFoundError,
    UnauthorizedStudentManagementError,
} from '../domain/student-profile.js';

export interface ManageStudentsDependencies {
    readonly studentRepository: StudentManagementRepository;
    readonly authorization: StudentAuthorization;
    readonly auditWriter: AuditWriter;
    readonly clock?: () => Date;
}

export class ManageStudents {
    private readonly clock: () => Date;

    constructor(private readonly dependencies: ManageStudentsDependencies) {
        this.clock = dependencies.clock ?? (() => new Date());
    }

    async create(input: CreateStudentProfileInput): Promise<StudentProfile> {
        try {
            await this.assertAuthorized(input.actor, 'student.create');
        } catch (error) {
            if (error instanceof UnauthorizedStudentManagementError) {
                await this.writeAudit({
                    eventName: 'authorization_denied',
                    actorId: input.actor.id,
                    actorType: input.actor.type,
                    targetType: 'student',
                    action: 'create',
                    outcome: 'failure',
                    reason: 'authorization_denied',
                    ...correlation(input.correlationId),
                });
            }
            throw error;
        }

        const existing = await this.dependencies.studentRepository.findByStudentNumber(
            input.studentNumber,
        );
        if (existing !== null) {
            await this.writeAudit({
                eventName: 'student_create_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'student',
                action: 'create',
                outcome: 'failure',
                reason: 'duplicate_student_number',
                ...correlation(input.correlationId),
            });
            throw new DuplicateStudentNumberError(input.studentNumber);
        }

        const now = this.clock();
        const created = await this.dependencies.studentRepository.create({
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
            createdAt: now,
            updatedAt: now,
            statusChangedAt: now,
            statusChangedBy: input.actor.id,
            statusHistory: [
                {
                    status: 'ACTIVE',
                    changedAt: now,
                    changedBy: input.actor.id,
                    reason: input.reason,
                },
            ],
        });

        await this.writeAudit({
            eventName: 'student_created',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'student',
            targetId: created.id,
            action: 'create',
            outcome: 'success',
            reason: input.reason,
            afterState: { status: created.status },
            ...correlation(input.correlationId),
        });

        return created;
    }

    async list(
        actor: CreateStudentProfileInput['actor'],
        query: Partial<{
            readonly status: StudentStatus;
            readonly studentNumber: string;
            readonly email: string;
        }> = {},
    ): Promise<readonly StudentProfile[]> {
        try {
            await this.assertAuthorized(actor, 'student.read');
        } catch (error) {
            if (error instanceof UnauthorizedStudentManagementError) {
                await this.writeAudit({
                    eventName: 'authorization_denied',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'student',
                    action: 'read',
                    outcome: 'failure',
                    reason: 'authorization_denied',
                });
            }
            throw error;
        }

        return this.dependencies.studentRepository.findMany(query);
    }

    async findById(id: string, actor: CreateStudentProfileInput['actor']): Promise<StudentProfile | null> {
        try {
            await this.assertAuthorized(actor, 'student.read', id);
        } catch (error) {
            if (error instanceof UnauthorizedStudentManagementError) {
                await this.writeAudit({
                    eventName: 'authorization_denied',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'student',
                    targetId: id,
                    action: 'read',
                    outcome: 'failure',
                    reason: 'authorization_denied',
                });
            }
            throw error;
        }
        return this.dependencies.studentRepository.findById(id);
    }

    async history(
        id: string,
        actor: CreateStudentProfileInput['actor'],
    ): Promise<readonly StudentStatusHistoryEntry[]> {
        const student = await this.findById(id, actor);
        if (student === null) {
            throw new StudentNotFoundError(id);
        }
        return student.statusHistory;
    }

    async transcript(
        id: string,
        actor: CreateStudentProfileInput['actor'],
    ): Promise<StudentProfile['transcript']> {
        const student = await this.findById(id, actor);
        if (student === null) {
            throw new StudentNotFoundError(id);
        }
        return {
            studentId: student.id,
            status: student.status,
            currentProgram: student.transcript.currentProgram,
            issuedAt: student.transcript.issuedAt,
            history: student.statusHistory,
        };
    }

    async uploadDocument(
        id: string,
        actor: CreateStudentProfileInput['actor'],
        document: {
            readonly name: string;
            readonly mimeType: string;
            readonly sizeBytes: number;
            readonly reason?: string | undefined;
            readonly url?: string | undefined;
            readonly uploadedBy?: string | undefined;
        },
    ): Promise<StudentDocument> {
        const student = await this.findById(id, actor);
        if (student === null) {
            throw new StudentNotFoundError(id);
        }

        const now = this.clock();
        const entry: StudentDocument = {
            id: `doc-${now.getTime()}-${Math.random().toString(16).slice(2)}`,
            name: document.name,
            mimeType: document.mimeType,
            sizeBytes: document.sizeBytes,
            uploadedAt: now,
            uploadedBy: document.uploadedBy ?? actor.id,
            reason: document.reason,
            url: document.url,
        };

        const updated = await this.dependencies.studentRepository.update(id, {
            documents: [...student.documents, entry],
            updatedAt: now,
        });

        const saved = updated.documents[updated.documents.length - 1];
        return saved ?? entry;
    }

    async findByStudentNumber(
        studentNumber: string,
        actor: CreateStudentProfileInput['actor'],
    ): Promise<StudentProfile | null> {
        try {
            await this.assertAuthorized(actor, 'student.read');
        } catch (error) {
            if (error instanceof UnauthorizedStudentManagementError) {
                await this.writeAudit({
                    eventName: 'authorization_denied',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'student',
                    action: 'read',
                    outcome: 'failure',
                    reason: 'authorization_denied',
                });
            }
            throw error;
        }
        return this.dependencies.studentRepository.findByStudentNumber(
            studentNumber,
        );
    }

    async update(input: UpdateStudentProfileInput): Promise<StudentProfile> {
        try {
            await this.assertAuthorized(input.actor, 'student.update', input.id);
        } catch (error) {
            if (error instanceof UnauthorizedStudentManagementError) {
                await this.writeAudit({
                    eventName: 'authorization_denied',
                    actorId: input.actor.id,
                    actorType: input.actor.type,
                    targetType: 'student',
                    targetId: input.id,
                    action: 'update',
                    outcome: 'failure',
                    reason: 'authorization_denied',
                    ...correlation(input.correlationId),
                });
            }
            throw error;
        }

        const allowedFields: Array<keyof StudentProfileUpdateFields> = [
            'firstName',
            'lastName',
            'email',
            'phone',
            'nationalId',
            'addressLine1',
            'addressLine2',
            'city',
            'country',
            'emergencyContactName',
            'emergencyContactPhone',
        ];

        for (const field of Object.keys(input.changes) as Array<keyof StudentProfileUpdateFields>) {
            if (!allowedFields.includes(field)) {
                await this.writeAudit({
                    eventName: 'student_update_failed',
                    actorId: input.actor.id,
                    actorType: input.actor.type,
                    targetType: 'student',
                    targetId: input.id,
                    action: 'update',
                    outcome: 'failure',
                    reason: 'invalid_student_update_field',
                    ...correlation(input.correlationId),
                });
                throw new InvalidStudentUpdateError(field);
            }
        }

        const current = await this.dependencies.studentRepository.findById(input.id);
        if (current === null) {
            await this.writeAudit({
                eventName: 'student_not_found',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'student',
                targetId: input.id,
                action: 'update',
                outcome: 'failure',
                reason: 'student_not_found',
                ...correlation(input.correlationId),
            });
            throw new StudentNotFoundError(input.id);
        }

        const now = this.clock();
        const updated = await this.dependencies.studentRepository.update(
            input.id,
            {
                ...input.changes,
                updatedAt: now,
            },
        );

        await this.writeAudit({
            eventName: 'student_updated',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'student',
            targetId: updated.id,
            action: 'update',
            outcome: 'success',
            reason: input.reason,
            beforeState: { status: current.status },
            afterState: { status: updated.status },
            ...correlation(input.correlationId),
        });

        return updated;
    }

    async transition(input: TransitionStudentStatusInput): Promise<StudentProfile> {
        const action = `student.${input.transition}` as const;
        try {
            await this.assertAuthorized(input.actor, action, input.id);
        } catch (error) {
            if (error instanceof UnauthorizedStudentManagementError) {
                await this.writeAudit({
                    eventName: 'authorization_denied',
                    actorId: input.actor.id,
                    actorType: input.actor.type,
                    targetType: 'student',
                    targetId: input.id,
                    action: input.transition,
                    outcome: 'failure',
                    reason: 'authorization_denied',
                    ...correlation(input.correlationId),
                });
            }
            throw error;
        }

        const current = await this.dependencies.studentRepository.findById(
            input.id,
        );
        if (current === null) {
            await this.writeAudit({
                eventName: 'student_not_found',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'student',
                targetId: input.id,
                action: input.transition,
                outcome: 'failure',
                reason: 'student_not_found',
                ...correlation(input.correlationId),
            });
            throw new StudentNotFoundError(input.id);
        }

        let nextStatus: StudentStatus;
        try {
            nextStatus = nextStudentStatus(current.status, input.transition);
        } catch (error) {
            if (error instanceof InvalidStudentStatusTransitionError) {
                await this.writeAudit({
                    eventName: 'student_transition_failed',
                    actorId: input.actor.id,
                    actorType: input.actor.type,
                    targetType: 'student',
                    targetId: input.id,
                    action: input.transition,
                    outcome: 'failure',
                    reason: 'invalid_student_status_transition',
                    beforeState: { status: current.status },
                    ...correlation(input.correlationId),
                });
            }
            throw error;
        }

        const changedAt = this.clock();
        const updated = applyStudentStatusChange(
            current,
            nextStatus,
            changedAt,
            input.actor.id,
            input.reason,
        );

        const saved = await this.dependencies.studentRepository.update(input.id, {
            status: updated.status,
            updatedAt: updated.updatedAt,
            statusChangedAt: updated.statusChangedAt,
            statusChangedBy: updated.statusChangedBy,
            statusHistory: updated.statusHistory,
        });

        await this.writeAudit({
            eventName: transitionEventName(input.transition),
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'student',
            targetId: saved.id,
            action: input.transition,
            outcome: 'success',
            reason: input.reason,
            beforeState: { status: current.status },
            afterState: { status: saved.status },
            ...correlation(input.correlationId),
        });

        return saved;
    }

    activate(input: Omit<TransitionStudentStatusInput, 'transition'>): Promise<StudentProfile> {
        return this.transition({ ...input, transition: 'activate' });
    }

    deactivate(input: Omit<TransitionStudentStatusInput, 'transition'>): Promise<StudentProfile> {
        return this.transition({ ...input, transition: 'deactivate' });
    }

    suspend(input: Omit<TransitionStudentStatusInput, 'transition'>): Promise<StudentProfile> {
        return this.transition({ ...input, transition: 'suspend' });
    }

    reactivate(input: Omit<TransitionStudentStatusInput, 'transition'>): Promise<StudentProfile> {
        return this.transition({ ...input, transition: 'reactivate' });
    }

    graduate(input: Omit<TransitionStudentStatusInput, 'transition'>): Promise<StudentProfile> {
        return this.transition({ ...input, transition: 'graduate' });
    }

    withdraw(input: Omit<TransitionStudentStatusInput, 'transition'>): Promise<StudentProfile> {
        return this.transition({ ...input, transition: 'withdraw' });
    }

    private async assertAuthorized(
        actor: CreateStudentProfileInput['actor'],
        action: 'student.create' | 'student.read' | 'student.update' | 'student.activate' | 'student.deactivate' | 'student.suspend' | 'student.reactivate' | 'student.graduate' | 'student.withdraw',
        targetStudentId?: string,
    ): Promise<void> {
        const allowed = await this.dependencies.authorization.authorize({
            actor,
            action,
            ...(targetStudentId === undefined ? {} : { targetStudentId }),
        });
        if (!allowed) {
            throw new UnauthorizedStudentManagementError(action);
        }
    }

    private async writeAudit(
        event: Omit<
            AuditEventInput,
            'category' | 'owningModule' | 'sourceBoundary'
        >,
    ): Promise<void> {
        await this.dependencies.auditWriter.append({
            ...event,
            category: 'security',
            owningModule: 'student',
            sourceBoundary: 'application',
        });
    }
}

export { ManageStudents as StudentManagementService };

function correlation(correlationId: string | undefined): {
    readonly correlationId?: string;
} {
    return correlationId === undefined ? {} : { correlationId };
}

function transitionEventName(
    transition: TransitionStudentStatusInput['transition'],
):
    | 'student_activated'
    | 'student_deactivated'
    | 'student_suspended'
    | 'student_reactivated'
    | 'student_graduated'
    | 'student_withdrawn' {
    const names: Record<
        TransitionStudentStatusInput['transition'],
        | 'student_activated'
        | 'student_deactivated'
        | 'student_suspended'
        | 'student_reactivated'
        | 'student_graduated'
        | 'student_withdrawn'
    > = {
        activate: 'student_activated',
        deactivate: 'student_deactivated',
        suspend: 'student_suspended',
        reactivate: 'student_reactivated',
        graduate: 'student_graduated',
        withdraw: 'student_withdrawn',
    };

    return names[transition];
}
