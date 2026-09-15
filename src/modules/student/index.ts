export * from './contracts/index.js';
export * from './domain/index.js';
export * from './application/index.js';
export * from './api/index.js';
export * from './infrastructure/index.js';

import { ManageStudents, type ManageStudentsDependencies } from './application/manage-students.js';
import { studentRoutesPlugin } from './api/student-routes.js';

export interface StudentManagementModule {
    readonly service: ManageStudents;
    readonly routes: ReturnType<typeof studentRoutesPlugin>;
}

export function createStudentManagementModule(
    dependencies: ManageStudentsDependencies,
): StudentManagementModule {
    const service = new ManageStudents(dependencies);

    return {
        service,
        routes: studentRoutesPlugin({ service }),
    };
}
