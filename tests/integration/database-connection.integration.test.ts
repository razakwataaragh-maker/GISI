import { describe, expect, it } from 'vitest';
import { loadConfiguration } from '../../src/bootstrap/configuration.js';
import { PrismaDatabaseConnection } from '../../src/infrastructure/database/database-connection.js';

const enabled = process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true';

describe.skipIf(!enabled)('PostgreSQL connectivity', () => {
    it('connects to the configured PostgreSQL instance', async () => {
        const configuration = loadConfiguration();
        const connection = new PrismaDatabaseConnection(configuration.database);

        try {
            await connection.connect();
            expect(await connection.checkReadiness()).toEqual({ dependency: 'postgresql', ready: true });
        } finally {
            await connection.disconnect();
        }
    });
});
