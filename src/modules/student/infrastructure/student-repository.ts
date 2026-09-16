import type { PrismaClient } from '@prisma/client';
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
    StudentAlreadyGraduatedError,
    StudentAlreadyWithdrawnError,
    StudentNotFoundError,
    StudentNumberAlreadyExistsError,
} from '../domain/student.js';

export class StudentRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async createStudent(input: CreateStudentInput): Promise<Student> {
        // Generate student number (simple sequential for now)
        const studentNumber = await this.generateStudentNumber();

        try {
            const student = await this.prisma.student.create({
                data: {
                    studentNumber,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    dateOfBirth: input.dateOfBirth ?? null,
                    gender: input.gender ?? null,
                    email: input.email ?? null,
                    phone: input.phone ?? null,
                    nationalId: input.nationalId ?? null,
                    passportNumber: input.passportNumber ?? null,
                    addressLine1: input.addressLine1 ?? null,
                    addressLine2: input.addressLine2 ?? null,
                    city: input.city ?? null,
                    state: input.state ?? null,
                    postalCode: input.postalCode ?? null,
                    country: input.country ?? null,
                    emergencyContactName: input.emergencyContactName ?? null,
                    emergencyContactPhone: input.emergencyContactPhone ?? null,
                    emergencyContactRelationship: input.emergencyContactRelationship ?? null,
                    status: 'ACTIVE',
                    createdBy: input.createdBy,
                    updatedBy: input.createdBy,
                    statusChangedBy: input.createdBy,
                    statusChangeReason: 'Initial student creation',
                    statusChangedAt: new Date(),
                },
            });

            return this.mapToStudent(student);
        } catch (error) {
            // Handle unique constraint violation on student_number
            if (error instanceof Error && error.message.includes('unique constraint')) {
                throw new StudentNumberAlreadyExistsError(studentNumber);
            }
            throw error;
        }
    }

    async getStudentById(id: string): Promise<Student> {
        const student = await this.prisma.student.findUnique({
            where: { id },
        });

        if (!student) {
            throw new StudentNotFoundError(id);
        }

        return this.mapToStudent(student);
    }

    async getStudentByStudentNumber(studentNumber: string): Promise<Student> {
        const student = await this.prisma.student.findUnique({
            where: { studentNumber },
        });

        if (!student) {
            throw new StudentNotFoundError(studentNumber);
        }

        return this.mapToStudent(student);
    }

    async searchStudents(params: StudentSearchParams): Promise<Student[]> {
        const where: any = {};

        if (params.studentNumber) {
            where.studentNumber = { contains: params.studentNumber, mode: 'insensitive' };
        }
        if (params.firstName) {
            where.firstName = { contains: params.firstName, mode: 'insensitive' };
        }
        if (params.lastName) {
            where.lastName = { contains: params.lastName, mode: 'insensitive' };
        }
        if (params.email) {
            where.email = { contains: params.email, mode: 'insensitive' };
        }
        if (params.status) {
            where.status = params.status;
        }

        const students = await this.prisma.student.findMany({
            where,
            take: params.limit || 50,
            skip: params.offset || 0,
            orderBy: { createdAt: 'desc' },
        });

        return students.map((s) => this.mapToStudent(s));
    }

    async updateStudent(id: string, input: UpdateStudentInput): Promise<Student> {
        const existing = await this.getStudentById(id);

        // Check if student can be modified
        if (existing.status === 'GRADUATED') {
            throw new StudentAlreadyGraduatedError(id);
        }
        if (existing.status === 'WITHDRAWN') {
            throw new StudentAlreadyWithdrawnError(id);
        }

        // Track profile changes for history
        const changes: Array<{ field: string; previous: string; new: string }> = [];
        if (input.firstName && input.firstName !== existing.firstName) {
            changes.push({ field: 'firstName', previous: existing.firstName, new: input.firstName });
        }
        if (input.lastName && input.lastName !== existing.lastName) {
            changes.push({ field: 'lastName', previous: existing.lastName, new: input.lastName });
        }
        if (input.email !== undefined && input.email !== existing.email) {
            changes.push({ field: 'email', previous: existing.email || '', new: input.email || '' });
        }
        if (input.phone !== undefined && input.phone !== existing.phone) {
            changes.push({ field: 'phone', previous: existing.phone || '', new: input.phone || '' });
        }

        const student = await this.prisma.student.update({
            where: { id },
            data: {
                ...(input.firstName !== undefined && { firstName: input.firstName }),
                ...(input.lastName !== undefined && { lastName: input.lastName }),
                ...(input.dateOfBirth !== undefined && { dateOfBirth: input.dateOfBirth }),
                ...(input.gender !== undefined && { gender: input.gender }),
                ...(input.email !== undefined && { email: input.email }),
                ...(input.phone !== undefined && { phone: input.phone }),
                ...(input.nationalId !== undefined && { nationalId: input.nationalId }),
                ...(input.passportNumber !== undefined && { passportNumber: input.passportNumber }),
                ...(input.addressLine1 !== undefined && { addressLine1: input.addressLine1 }),
                ...(input.addressLine2 !== undefined && { addressLine2: input.addressLine2 }),
                ...(input.city !== undefined && { city: input.city }),
                ...(input.state !== undefined && { state: input.state }),
                ...(input.postalCode !== undefined && { postalCode: input.postalCode }),
                ...(input.country !== undefined && { country: input.country }),
                ...(input.emergencyContactName !== undefined && { emergencyContactName: input.emergencyContactName }),
                ...(input.emergencyContactPhone !== undefined && { emergencyContactPhone: input.emergencyContactPhone }),
                ...(input.emergencyContactRelationship !== undefined && { emergencyContactRelationship: input.emergencyContactRelationship }),
                updatedBy: input.updatedBy,
            },
        });

        // Create profile history records
        for (const change of changes) {
            await this.prisma.studentProfileHistory.create({
                data: {
                    studentId: id,
                    changedField: change.field,
                    previousValue: change.previous,
                    newValue: change.new,
                    changedAt: new Date(),
                    changedBy: input.updatedBy,
                    changeReason: input.changeReason,
                },
            });
        }

        return this.mapToStudent(student);
    }

    async updateStudentStatus(id: string, input: UpdateStudentStatusInput): Promise<Student> {
        const existing = await this.getStudentById(id);

        const student = await this.prisma.student.update({
            where: { id },
            data: {
                status: input.newStatus,
                statusChangedAt: new Date(),
                statusChangedBy: input.changedBy,
                statusChangeReason: input.changeReason,
                updatedBy: input.changedBy,
            },
        });

        // Create status history record
        await this.prisma.studentStatusHistory.create({
            data: {
                studentId: id,
                previousStatus: existing.status,
                newStatus: input.newStatus,
                changedAt: new Date(),
                changedBy: input.changedBy,
                changeReason: input.changeReason,
            },
        });

        return this.mapToStudent(student);
    }

    async getStudentStatusHistory(studentId: string): Promise<StudentStatusHistory[]> {
        const history = await this.prisma.studentStatusHistory.findMany({
            where: { studentId },
            orderBy: { changedAt: 'desc' },
        });

        return history.map((h) => ({
            id: h.id,
            studentId: h.studentId,
            previousStatus: h.previousStatus as any,
            newStatus: h.newStatus as any,
            changedAt: h.changedAt,
            changedBy: h.changedBy,
            changeReason: h.changeReason,
            changeReference: h.changeReference || null,
            createdAt: h.createdAt,
        }));
    }

    async createStudentDocument(studentId: string, input: CreateStudentDocumentInput): Promise<StudentDocument> {
        const document = await this.prisma.studentDocument.create({
            data: {
                studentId,
                documentType: input.documentType,
                fileName: input.fileName,
                storagePath: input.storagePath,
                fileSize: input.fileSize,
                mimeType: input.mimeType,
                uploadedAt: new Date(),
                uploadedBy: input.uploadedBy,
                uploadReason: input.uploadReason || null,
            },
        });

        return {
            id: document.id,
            studentId: document.studentId,
            documentType: document.documentType,
            fileName: document.fileName,
            storagePath: document.storagePath,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            uploadedAt: document.uploadedAt,
            uploadedBy: document.uploadedBy,
            uploadReason: document.uploadReason || '',
            changeReference: document.changeReference || null,
            createdAt: document.createdAt,
        };
    }

    async getStudentDocuments(studentId: string): Promise<StudentDocument[]> {
        const documents = await this.prisma.studentDocument.findMany({
            where: { studentId },
            orderBy: { uploadedAt: 'desc' },
        });

        return documents.map((d) => ({
            id: d.id,
            studentId: d.studentId,
            documentType: d.documentType,
            fileName: d.fileName,
            storagePath: d.storagePath,
            fileSize: d.fileSize,
            mimeType: d.mimeType,
            uploadedAt: d.uploadedAt,
            uploadedBy: d.uploadedBy,
            uploadReason: d.uploadReason || '',
            changeReference: d.changeReference || null,
            createdAt: d.createdAt,
        }));
    }

    private async generateStudentNumber(): Promise<string> {
        // Simple sequential student number generation
        // Format: STU followed by 8-digit zero-padded number
        const count = await this.prisma.student.count();
        const nextNumber = count + 1;
        return `STU${String(nextNumber).padStart(8, '0')}`;
    }

    private mapToStudent(prismaStudent: any): Student {
        return {
            id: prismaStudent.id,
            studentNumber: prismaStudent.studentNumber,
            firstName: prismaStudent.firstName,
            lastName: prismaStudent.lastName,
            dateOfBirth: prismaStudent.dateOfBirth ?? null,
            gender: prismaStudent.gender ?? null,
            email: prismaStudent.email ?? null,
            phone: prismaStudent.phone ?? null,
            nationalId: prismaStudent.nationalId ?? null,
            passportNumber: prismaStudent.passportNumber ?? null,
            addressLine1: prismaStudent.addressLine1 ?? null,
            addressLine2: prismaStudent.addressLine2 ?? null,
            city: prismaStudent.city ?? null,
            state: prismaStudent.state ?? null,
            postalCode: prismaStudent.postalCode ?? null,
            country: prismaStudent.country ?? null,
            emergencyContactName: prismaStudent.emergencyContactName ?? null,
            emergencyContactPhone: prismaStudent.emergencyContactPhone ?? null,
            emergencyContactRelationship: prismaStudent.emergencyContactRelationship ?? null,
            status: prismaStudent.status as any,
            createdAt: prismaStudent.createdAt,
            updatedAt: prismaStudent.updatedAt,
            createdBy: prismaStudent.createdBy,
            updatedBy: prismaStudent.updatedBy,
            statusChangedAt: prismaStudent.statusChangedAt,
            statusChangedBy: prismaStudent.statusChangedBy,
            statusChangeReason: prismaStudent.statusChangeReason,
        };
    }
}
