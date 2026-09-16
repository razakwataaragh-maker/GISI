import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import type { StudentRepository } from '../infrastructure/student-repository.js';
import type {
    CreateStudentDocumentInput,
    CreateStudentInput,
    Student,
    StudentDocument,
    StudentSearchParams,
    StudentStatusHistory,
    UpdateStudentInput,
    UpdateStudentStatusInput,
} from '../contracts/student.js';
import {
    InvalidStudentStatusTransitionError,
    StudentAlreadyGraduatedError,
    StudentAlreadyWithdrawnError,
    StudentNotFoundError,
} from '../domain/student.js';
import { validateStatusTransition } from '../domain/student-status-transitions.js';

export class ManageStudents {
    constructor(
        private readonly studentRepository: StudentRepository,
        private readonly auditWriter: AuditWriter,
    ) {}

    async createStudent(input: CreateStudentInput): Promise<Student> {
        try {
            const student = await this.studentRepository.createStudent(input);

            await this.auditWriter.write({
                eventName: 'student.created',
                category: 'student',
                actorId: input.createdBy,
                actorType: 'user',
                targetType: 'student',
                targetId: student.id,
                action: 'create',
                outcome: 'success',
                owningModule: 'student',
                sourceBoundary: 'application',
                reason: 'Student profile creation',
                beforeState: null,
                afterState: {
                    studentNumber: student.studentNumber,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    status: student.status,
                },
            });

            return student;
        } catch (error) {
            if (error instanceof Error) {
                await this.auditWriter.write({
                    eventName: 'student.creation_failed',
                    category: 'student',
                    actorId: input.createdBy,
                    actorType: 'user',
                    targetType: 'student',
                    action: 'create',
                    outcome: 'failure',
                    owningModule: 'student',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async getStudentById(id: string): Promise<Student> {
        return this.studentRepository.getStudentById(id);
    }

    async getStudentByStudentNumber(studentNumber: string): Promise<Student> {
        return this.studentRepository.getStudentByStudentNumber(studentNumber);
    }

    async searchStudents(params: StudentSearchParams): Promise<Student[]> {
        return this.studentRepository.searchStudents(params);
    }

    async updateStudent(id: string, input: UpdateStudentInput): Promise<Student> {
        try {
            const existing = await this.studentRepository.getStudentById(id);

            // Check if student can be modified
            if (existing.status === 'GRADUATED') {
                throw new StudentAlreadyGraduatedError(id);
            }
            if (existing.status === 'WITHDRAWN') {
                throw new StudentAlreadyWithdrawnError(id);
            }

            const student = await this.studentRepository.updateStudent(id, input);

            await this.auditWriter.write({
                eventName: 'student.updated',
                category: 'student',
                actorId: input.updatedBy,
                actorType: 'user',
                targetType: 'student',
                targetId: id,
                action: 'update',
                outcome: 'success',
                owningModule: 'student',
                sourceBoundary: 'application',
                reason: input.changeReason,
                beforeState: {
                    firstName: existing.firstName,
                    lastName: existing.lastName,
                    email: existing.email,
                },
                afterState: {
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email,
                },
            });

            return student;
        } catch (error) {
            if (error instanceof Error) {
                await this.auditWriter.write({
                    eventName: 'student.update_failed',
                    category: 'student',
                    actorId: input.updatedBy,
                    actorType: 'user',
                    targetType: 'student',
                    targetId: id,
                    action: 'update',
                    outcome: 'failure',
                    owningModule: 'student',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async updateStudentStatus(id: string, input: UpdateStudentStatusInput): Promise<Student> {
        try {
            const existing = await this.studentRepository.getStudentById(id);

            // Validate status transition
            validateStatusTransition(existing.status, input.newStatus);

            const student = await this.studentRepository.updateStudentStatus(id, input);

            await this.auditWriter.write({
                eventName: 'student.status_changed',
                category: 'student',
                actorId: input.changedBy,
                actorType: 'user',
                targetType: 'student',
                targetId: id,
                action: 'status_change',
                outcome: 'success',
                owningModule: 'student',
                sourceBoundary: 'application',
                reason: input.changeReason,
                beforeState: { status: existing.status },
                afterState: { status: student.status },
            });

            return student;
        } catch (error) {
            if (error instanceof InvalidStudentStatusTransitionError) {
                await this.auditWriter.write({
                    eventName: 'student.status_change_invalid',
                    category: 'student',
                    actorId: input.changedBy,
                    actorType: 'user',
                    targetType: 'student',
                    targetId: id,
                    action: 'status_change',
                    outcome: 'failure',
                    owningModule: 'student',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async getStudentStatusHistory(studentId: string): Promise<StudentStatusHistory[]> {
        return this.studentRepository.getStudentStatusHistory(studentId);
    }

    async createStudentDocument(studentId: string, input: CreateStudentDocumentInput): Promise<StudentDocument> {
        try {
            const document = await this.studentRepository.createStudentDocument(studentId, input);

            await this.auditWriter.write({
                eventName: 'student.document_uploaded',
                category: 'student',
                actorId: input.uploadedBy,
                actorType: 'user',
                targetType: 'student_document',
                targetId: document.id,
                action: 'upload',
                outcome: 'success',
                owningModule: 'student',
                sourceBoundary: 'application',
                reason: input.uploadReason || 'Document upload',
                afterState: {
                    documentType: document.documentType,
                    fileName: document.fileName,
                },
            });

            return document;
        } catch (error) {
            if (error instanceof Error) {
                await this.auditWriter.write({
                    eventName: 'student.document_upload_failed',
                    category: 'student',
                    actorId: input.uploadedBy,
                    actorType: 'user',
                    targetType: 'student_document',
                    action: 'upload',
                    outcome: 'failure',
                    owningModule: 'student',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async getStudentDocuments(studentId: string): Promise<StudentDocument[]> {
        return this.studentRepository.getStudentDocuments(studentId);
    }
}
