import { describe, expect, it, vi } from 'vitest';
import {
    DatabaseConnectionError,
    PrismaDatabaseConnection,
    type DatabaseConnectionOptions,
} from '../../src/infrastructure/database/database-connection.js';

const options: DatabaseConnectionOptions = {
    url: 'postgresql://user:secret@localhost:5432/gisi_test',
};

function fakeClient() {
    return {
        $connect: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        $disconnect: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        $queryRawUnsafe: vi.fn<() => Promise<unknown>>().mockResolvedValue([{ '?column?': 1 }]),
    };
}

describe('PrismaDatabaseConnection', () => {
    it('connects, checks readiness, and disconnects through the boundary', async () => {
        const client = fakeClient();
        const connection = new PrismaDatabaseConnection(options, () => client);

        await connection.connect();

        expect(await connection.checkReadiness()).toEqual({ dependency: 'postgresql', ready: true });
        await connection.disconnect();
        expect(client.$connect).toHaveBeenCalledOnce();
        expect(client.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
        expect(client.$disconnect).toHaveBeenCalledOnce();
    });

    it('applies bounded pool and connection timeout defaults without logging the URL', async () => {
        let constructedUrl = '';
        const connection = new PrismaDatabaseConnection(options, (url) => {
            constructedUrl = url;
            return fakeClient();
        });

        await connection.connect();

        expect(constructedUrl).toContain('connection_limit=10');
        expect(constructedUrl).toContain('pool_timeout=10');
        expect(constructedUrl).toContain('connect_timeout=10');
    });

    it('reports not ready before connection and after a failed readiness query', async () => {
        const client = fakeClient();
        client.$queryRawUnsafe.mockRejectedValueOnce(new Error('database unavailable'));
        const connection = new PrismaDatabaseConnection(options, () => client);

        expect(await connection.checkReadiness()).toEqual({ dependency: 'postgresql', ready: false });
        await connection.connect();
        expect(await connection.checkReadiness()).toEqual({ dependency: 'postgresql', ready: false });
    });

    it('translates connection failures without exposing the URL', async () => {
        const client = fakeClient();
        client.$connect.mockRejectedValueOnce(new Error(options.url));
        const connection = new PrismaDatabaseConnection(options, () => client);

        try {
            await connection.connect();
            throw new Error('Expected connection to fail');
        } catch (error) {
            expect(error).toBeInstanceOf(DatabaseConnectionError);
            expect((error as Error).message).not.toContain(options.url);
        }
    });

    it('disconnects idempotently when it was never connected', async () => {
        const client = fakeClient();
        const connection = new PrismaDatabaseConnection(options, () => client);

        await connection.disconnect();

        expect(client.$disconnect).not.toHaveBeenCalled();
    });
});
