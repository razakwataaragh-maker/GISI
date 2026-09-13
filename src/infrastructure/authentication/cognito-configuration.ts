import {
    ConfigurationError,
    type EnvironmentVariables,
} from '../../bootstrap/configuration.js';

export interface CognitoConfiguration {
    readonly region: string;
    readonly userPoolId: string;
    readonly clientId: string;
}

export function loadCognitoConfiguration(
    environment: EnvironmentVariables = process.env,
): CognitoConfiguration {
    const issues: string[] = [];
    const region = required(environment, 'AWS_REGION', issues);
    const userPoolId = required(environment, 'AWS_USER_POOL_ID', issues);
    const clientId = required(environment, 'AWS_CLIENT_ID', issues);

    if (issues.length > 0) {
        throw new ConfigurationError(issues);
    }

    return Object.freeze({
        region: region!,
        userPoolId: userPoolId!,
        clientId: clientId!,
    });
}

function required(
    environment: EnvironmentVariables,
    key: string,
    issues: string[],
): string | undefined {
    const value = environment[key]?.trim();
    if (!value) {
        issues.push(`${key} is required for Cognito authentication`);
    }
    return value;
}
