import { FastifyInstance, FastifyRequest } from 'fastify';
import { ManageApplications } from '../application/manage-applications';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  SearchApplicationsInput,
  SubmitApplicationInput,
  RequestInformationInput,
  ApproveApplicationInput,
  RejectApplicationInput,
  DocumentUploadInput,
} from '../contracts/application';

export async function applicationRoutes(
  fastify: FastifyInstance,
  options: { manageApplications: ManageApplications },
) {
  const { manageApplications } = options;

  // POST /api/v1/applications - Create application
  fastify.post('/api/v1/applications', async (request: FastifyRequest<{ Body: CreateApplicationInput }>, reply) => {
    try {
      const result = await manageApplications.createApplication(request.body);
      return reply.status(201).send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/v1/applications/my - Get my applications (student-specific)
  fastify.get('/api/v1/applications/my', async (request: FastifyRequest<{ Querystring: SearchApplicationsInput }>, reply) => {
    try {
      const result = await manageApplications.searchApplications(request.query);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/v1/applications - Search applications (admin-specific)
  fastify.get('/api/v1/applications', async (request: FastifyRequest<{ Querystring: SearchApplicationsInput }>, reply) => {
    try {
      const result = await manageApplications.searchApplications(request.query);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/v1/applications/:id - Get application by ID
  fastify.get('/api/v1/applications/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    try {
      const result = await manageApplications.getApplication(request.params.id);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // PATCH /api/v1/applications/:id - Update application
  fastify.patch('/api/v1/applications/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateApplicationInput }>, reply) => {
    try {
      const result = await manageApplications.updateApplication(request.params.id, request.body);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/v1/applications/:id/submit - Submit application
  fastify.post('/api/v1/applications/:id/submit', async (request: FastifyRequest<{ Params: { id: string }; Body: SubmitApplicationInput }>, reply) => {
    try {
      const result = await manageApplications.submitApplication(request.params.id, request.body);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/v1/applications/:id/request-information - Request information
  fastify.post('/api/v1/applications/:id/request-information', async (request: FastifyRequest<{ Params: { id: string }; Body: RequestInformationInput }>, reply) => {
    try {
      const result = await manageApplications.requestInformation(request.params.id, request.body);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/v1/applications/:id/approve - Approve application
  fastify.post('/api/v1/applications/:id/approve', async (request: FastifyRequest<{ Params: { id: string }; Body: ApproveApplicationInput }>, reply) => {
    try {
      const result = await manageApplications.approveApplication(request.params.id, request.body);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/v1/applications/:id/reject - Reject application
  fastify.post('/api/v1/applications/:id/reject', async (request: FastifyRequest<{ Params: { id: string }; Body: RejectApplicationInput }>, reply) => {
    try {
      const result = await manageApplications.rejectApplication(request.params.id, request.body);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/v1/applications/:id/documents - Upload document
  fastify.post('/api/v1/applications/:id/documents', async (request: FastifyRequest<{ Params: { id: string }; Body: DocumentUploadInput }>, reply) => {
    try {
      const result = await manageApplications.uploadDocument(request.params.id, request.body);
      return reply.status(201).send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/v1/applications/:id/documents - Get documents
  fastify.get('/api/v1/applications/:id/documents', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    try {
      const result = await manageApplications.getDocuments(request.params.id);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/v1/applications/:id/history - Get history
  fastify.get('/api/v1/applications/:id/history', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    try {
      const result = await manageApplications.getHistory(request.params.id);
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
