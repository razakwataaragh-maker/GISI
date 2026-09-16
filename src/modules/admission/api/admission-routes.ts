import { FastifyInstance, FastifyRequest } from 'fastify';
import { ManageAdmissions } from '../application/manage-admissions';
import {
  CreateAdmissionInput,
  SearchAdmissionsInput,
  AcceptAdmissionInput,
  DeferAdmissionInput,
  DeclineAdmissionInput,
} from '../contracts/admission';

export async function admissionRoutes(
  fastify: FastifyInstance,
  options: { manageAdmissions: ManageAdmissions },
) {
  const { manageAdmissions } = options;

  // GET /api/v1/admissions/my - Get my admissions (student-specific)
  fastify.get('/api/v1/admissions/my', async (request: FastifyRequest<{ Querystring: SearchAdmissionsInput }>, reply) => {
    try {
      const result = await manageAdmissions.searchAdmissions(request.query);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/v1/admissions - Search admissions (admin-specific)
  fastify.get('/api/v1/admissions', async (request: FastifyRequest<{ Querystring: SearchAdmissionsInput }>, reply) => {
    try {
      const result = await manageAdmissions.searchAdmissions(request.query);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/v1/admissions/:id - Get admission by ID
  fastify.get('/api/v1/admissions/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    try {
      const result = await manageAdmissions.getAdmission(request.params.id);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/v1/admissions/:id/accept - Accept admission
  fastify.post('/api/v1/admissions/:id/accept', async (request: FastifyRequest<{ Params: { id: string }; Body: AcceptAdmissionInput }>, reply) => {
    try {
      const result = await manageAdmissions.acceptAdmission(request.params.id, request.body);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/v1/admissions/:id/defer - Defer admission
  fastify.post('/api/v1/admissions/:id/defer', async (request: FastifyRequest<{ Params: { id: string }; Body: DeferAdmissionInput }>, reply) => {
    try {
      const result = await manageAdmissions.deferAdmission(request.params.id, request.body);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/v1/admissions/:id/decline - Decline admission
  fastify.post('/api/v1/admissions/:id/decline', async (request: FastifyRequest<{ Params: { id: string }; Body: DeclineAdmissionInput }>, reply) => {
    try {
      const result = await manageAdmissions.declineAdmission(request.params.id, request.body);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/v1/admissions/:id/letter - Get admission letter
  fastify.get('/api/v1/admissions/:id/letter', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    try {
      const result = await manageAdmissions.getAdmissionLetter(request.params.id);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/v1/admissions/:id/history - Get history
  fastify.get('/api/v1/admissions/:id/history', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    try {
      const result = await manageAdmissions.getHistory(request.params.id);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
