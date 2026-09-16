/**
 * Student module contracts and types
 */

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'WITHDRAWN';

export interface Student {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: string;
    email?: string;
    phone?: string;
    nationalId?: string;
    passportNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    status: StudentStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    statusChangedAt: Date;
    statusChangedBy: string;
    statusChangeReason: string;
}

export interface CreateStudentInput {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: string;
    email?: string;
    phone?: string;
    nationalId?: string;
    passportNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    createdBy: string;
}

export interface UpdateStudentInput {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: string;
    email?: string;
    phone?: string;
    nationalId?: string;
    passportNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    updatedBy: string;
    changeReason: string;
}

export interface UpdateStudentStatusInput {
    newStatus: StudentStatus;
    changedBy: string;
    changeReason: string;
}

export interface StudentStatusHistory {
    id: string;
    studentId: string;
    previousStatus: StudentStatus;
    newStatus: StudentStatus;
    changedAt: Date;
    changedBy: string;
    changeReason: string;
    changeReference?: string;
    createdAt: Date;
}

export interface StudentProfileHistory {
    id: string;
    studentId: string;
    changedField: string;
    previousValue?: string;
    newValue?: string;
    changedAt: Date;
    changedBy: string;
    changeReason: string;
    changeReference?: string;
    createdAt: Date;
}

export interface StudentDocument {
    id: string;
    studentId: string;
    documentType: string;
    fileName: string;
    storagePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
    uploadedBy: string;
    uploadReason?: string;
    changeReference?: string;
    createdAt: Date;
}

export interface CreateStudentDocumentInput {
    documentType: string;
    fileName: string;
    storagePath: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    uploadReason?: string;
}

export interface StudentSearchParams {
    studentNumber?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    status?: StudentStatus;
    limit?: number;
    offset?: number;
}
