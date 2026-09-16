import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ApiError } from '../../../infrastructure/http/api-error-boundary.js';
import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import type { ManageStudents } from '../application/index.js';
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

export function registerStudentRoutes(
    fastify: FastifyInstance,
    dependencies: {
        manageStudents: ManageStudents;
        auditWriter: AuditWriter;
    },
) {
    const { manageStudents } = dependencies;

    // POST /api/v1/students - Create student
    fastify.post(
        '/api/v1/students',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['firstName', 'lastName', 'createdBy'],
                    properties: {
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
                        gender: { type: 'string', nullable: true },
                        email: { type: 'string', nullable: true },
                        phone: { type: 'string', nullable: true },
                        nationalId: { type: 'string', nullable: true },
                        passportNumber: { type: 'string', nullable: true },
                        addressLine1: { type: 'string', nullable: true },
                        addressLine2: { type: 'string', nullable: true },
                        city: { type: 'string', nullable: true },
                        state: { type: 'string', nullable: true },
                        postalCode: { type: 'string', nullable: true },
                        country: { type: 'string', nullable: true },
                        emergencyContactName: { type: 'string', nullable: true },
                        emergencyContactPhone: { type: 'string', nullable: true },
                        emergencyContactRelationship: { type: 'string', nullable: true },
                        createdBy: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: CreateStudentInput }>) => {
            const student = await manageStudents.createStudent(request.body);
            return { data: student };
        },
    );

    // GET /api/v1/students - Search students
    fastify.get(
        '/api/v1/students',
        {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        studentNumber: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        email: { type: 'string' },
                        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN'] },
                        limit: { type: 'number', minimum: 1, maximum: 100 },
                        offset: { type: 'number', minimum: 0 },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Querystring: StudentSearchParams }>) => {
            const students = await manageStudents.searchStudents(request.query);
            return { data: students, count: students.length };
        },
    );

    // GET /api/v1/students/:id - Get student by ID
    fastify.get(
        '/api/v1/students/:id',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { id: string } }>) => {
            const student = await manageStudents.getStudentById(request.params.id);
            return { data: student };
        },
    );

    // PATCH /api/v1/students/:id - Update student
    fastify.patch(
        '/api/v1/students/:id',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string' },
                    },
                },
                body: {
                    type: 'object',
                    required: ['updatedBy', 'changeReason'],
                    properties: {
                        firstName: { type: 'string', nullable: true },
                        lastName: { type: 'string', nullable: true },
                        dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
                        gender: { type: 'string', nullable: true },
                        email: { type: 'string', nullable: true },
                        phone: { type: 'string', nullable: true },
                        nationalId: { type: 'string', nullable: true },
                        passportNumber: { type: 'string', nullable: true },
                        addressLine1: { type: 'string', nullable: true },
                        addressLine2: { type: 'string', nullable: true },
                        city: { type: 'string', nullable: true },
                        state: { type: 'string', nullable: true },
                        postalCode: { type: 'string', nullable: true },
                        country: { type: 'string', nullable: true },
                        emergencyContactName: { type: 'string', nullable: true },
                        emergencyContactPhone: { type: 'string', nullable: true },
                        emergencyContactRelationship: { type: 'string', nullable: true },
                        updatedBy: { type: 'string' },
                        changeReason: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateStudentInput }>) => {
            const student = await manageStudents.updateStudent(request.params.id, request.body);
            return { data: student };
        },
    );

    // GET /api/v1/students/:id/history - Get student status history
    fastify.get(
        '/api/v1/students/:id/history',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { id: string } }>) => {
            const history = await manageStudents.getStudentStatusHistory(request.params.id);
            return { data: history, count: history.length };
        },
    );

    // POST /api/v1/students/:id/documents - Upload student document
    fastify.post(
        '/api/v1/students/:id/documents',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string' },
                    },
                },
                body: {
                    type: 'object',
                    required: ['documentType', 'fileName', 'storagePath', 'fileSize', 'mimeType', 'uploadedBy'],
                    properties: {
                        documentType: { type: 'string' },
                        fileName: { type: 'string' },
                        storagePath: { type: 'string' },
                        fileSize: { type: 'number' },
                        mimeType: { type: 'string' },
                        uploadedBy: { type: 'string' },
                        uploadReason: { type: 'string', nullable: true },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { id: string }; Body: CreateStudentDocumentInput }>) => {
            const document = await manageStudents.createStudentDocument(request.params.id, request.body);
            return { data: document };
        },
    );
}
