import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = join(repositoryRoot, 'src');
const providerImportPattern = /(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g;
const providerPackages = ['@prisma/client', 'pino', 'aws-sdk', '@aws-sdk/'];

async function sourceFiles(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await sourceFiles(path)));
        } else if (entry.isFile() && path.endsWith('.ts')) {
            files.push(path);
        }
    }

    return files;
}

describe('module boundaries', () => {
    it('keeps provider-specific imports inside infrastructure', async () => {
        const files = await sourceFiles(sourceRoot);
        const violations: string[] = [];

        for (const file of files) {
            const content = await readFile(file, 'utf8');
            for (const match of content.matchAll(providerImportPattern)) {
                const importedPackage = match[1];
                if (
                    importedPackage !== undefined &&
                    providerPackages.some(
                        (providerPackage) =>
                            importedPackage === providerPackage ||
                            importedPackage.startsWith(providerPackage),
                    ) &&
                    !relative(sourceRoot, file).startsWith('infrastructure/')
                ) {
                    violations.push(
                        `${relative(repositoryRoot, file)} imports ${importedPackage}`,
                    );
                }
            }
        }

        expect(violations).toEqual([]);
    });

    it('does not allow business-layer directories to import infrastructure adapters', async () => {
        const violations: string[] = [];

        for (const layer of ['domain', 'application']) {
            const layerPath = join(sourceRoot, layer);
            try {
                const files = await sourceFiles(layerPath);
                for (const file of files) {
                    const content = await readFile(file, 'utf8');
                    if (
                        /(?:from\s+|import\s*\()\s*['"][^'"]*infrastructure\//.test(
                            content,
                        )
                    ) {
                        violations.push(relative(repositoryRoot, file));
                    }
                }
            } catch (error) {
                const code =
                    error instanceof Error && 'code' in error
                        ? (error as Error & { code?: unknown }).code
                        : undefined;
                if (code !== 'ENOENT') {
                    throw error;
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
