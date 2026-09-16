import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

export interface SecurityMiddlewareDependencies {
    readonly environment: 'development' | 'staging' | 'production';
    readonly corsOrigins: readonly string[];
}

export const securityMiddlewarePlugin = (
    dependencies: SecurityMiddlewareDependencies,
): FastifyPluginAsync =>
    fastifyPlugin(async (fastify) => {
        // CORS configuration
        await fastify.register(cors, {
            origin: (origin, callback) => {
                if (dependencies.environment === 'development') {
                    // Allow all origins in development for testing
                    callback(null, true);
                    return;
                }

                // In staging/production, only allow configured origins
                if (!origin) {
                    callback(null, true); // Allow requests without Origin header
                    return;
                }

                if (dependencies.corsOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'), false);
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PATCH', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
            exposedHeaders: ['X-Correlation-ID'],
        });

        // Security headers
        await fastify.register(helmet, {
            contentSecurityPolicy: false, // Will be configured separately if needed
            crossOriginEmbedderPolicy: false,
        });

        // Rate limiting configuration
        await fastify.register(rateLimit, {
            max: 100, // Max requests per window
            timeWindow: '1 minute',
            standardHeaders: true,
            legacyHeaders: false,
            // Different limits for different routes can be configured
            keyGenerator: (request) => {
                // Use IP address for rate limiting
                return `ip:${request.ip}`;
            },
            errorResponseBuilder: (request) => ({
                code: 'TOO_MANY_REQUESTS',
                message: 'Too many requests',
                details: [],
                correlationId: request.headers['x-correlation-id'] as string,
            }),
            skipOnError: false,
        });

        // Request body size limit
        fastify.addHook('onRequest', async (request, reply) => {
            const contentLength = request.headers['content-length'];
            const maxBodySize = 10 * 1024 * 1024; // 10MB

            if (contentLength && parseInt(contentLength, 10) > maxBodySize) {
                reply.code(413).send({
                    code: 'PAYLOAD_TOO_LARGE',
                    message: 'Request body too large',
                    details: [`Maximum size is ${maxBodySize} bytes`],
                    correlationId: request.headers['x-correlation-id'] as string,
                });
                return reply;
            }
        });

        // Add security headers
        fastify.addHook('onSend', async (request, reply) => {
            // Add custom security headers
            if (dependencies.environment !== 'development') {
                reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            }
            reply.header('X-Content-Type-Options', 'nosniff');
            reply.header('X-Frame-Options', 'DENY');
            reply.header('Referrer-Policy', 'no-referrer');
            reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        });
    });
