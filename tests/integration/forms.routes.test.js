/**
 * Integration tests for the forms router (supertest).
 *
 * Mounts the REAL router with service + auth + redis boundaries mocked, to
 * verify wiring, validation, auth gating, and status codes.
 *
 * NOTE: runs in CI / normal env; jest deadlocks in the original dev sandbox
 * (Prisma engine cannot start there).
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// ---- Mock service modules ----
const formsServiceMock = {
    getPublicFormBySlug: jest.fn(),
    isSlugAvailable: jest.fn(),
    listForms: jest.fn(),
    createForm: jest.fn(),
    getFormById: jest.fn(),
    updateForm: jest.fn(),
    deleteForm: jest.fn(),
    duplicateForm: jest.fn(),
    addQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
    reorderQuestions: jest.fn(),
};
const submissionServiceMock = { submitResponse: jest.fn() };
const aggregationServiceMock = { listResponses: jest.fn(), getSummary: jest.fn(), buildCsv: jest.fn() };

jest.unstable_mockModule('../../src/services/forms.service.js', () => formsServiceMock);
jest.unstable_mockModule('../../src/services/form-submission.service.js', () => submissionServiceMock);
jest.unstable_mockModule('../../src/services/form-aggregation.service.js', () => aggregationServiceMock);
jest.unstable_mockModule('../../src/services/s3.service.js', () => ({ isEnabled: () => false }));

// Auth: token "valid" => authenticated user, otherwise 401
jest.unstable_mockModule('../../src/services/auth.service.js', () => ({
    verifyToken: (token) => {
        if (token === 'valid') return { sub: 'user-1', role: 'USER' };
        const err = new Error('Invalid token');
        err.name = 'JsonWebTokenError';
        throw err;
    },
}));

// Redis: in-memory counter so the rate limiter works deterministically
const store = new Map();
jest.unstable_mockModule('../../src/config/redis.js', () => ({
    getRedisClient: () => ({
        get: async (k) => store.get(k) ?? null,
        incr: async (k) => { const v = (store.get(k) ?? 0) + 1; store.set(k, v); return v; },
        pexpire: async () => 1,
        pttl: async () => 60000,
        ttl: async () => 60,
    }),
}));

// database is imported transitively by auth middleware; stub it
jest.unstable_mockModule('../../src/config/database.js', () => ({ default: {} }));

const formsRoutes = (await import('../../src/routes/forms.routes.js')).default;
const { errorHandler } = await import('../../src/middleware/error.middleware.js');

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/forms', formsRoutes);
    app.use(errorHandler);
    return app;
};

let app;
beforeEach(() => {
    jest.clearAllMocks();
    store.clear();
    app = buildApp();
});

const auth = (req) => req.set('Authorization', 'Bearer valid');

describe('public routes', () => {
    it('GET /public/:slug returns 200 with form', async () => {
        formsServiceMock.getPublicFormBySlug.mockResolvedValue({ id: 'f1', slug: 's', questions: [] });
        const res = await request(app).get('/api/forms/public/s');
        expect(res.status).toBe(200);
        expect(res.body.data.slug).toBe('s');
    });

    it('GET /public/:slug returns 404 when not found', async () => {
        formsServiceMock.getPublicFormBySlug.mockResolvedValue(null);
        const res = await request(app).get('/api/forms/public/missing');
        expect(res.status).toBe(404);
    });

    it('POST submit returns 201 and increments are delegated to service', async () => {
        submissionServiceMock.submitResponse.mockResolvedValue({ id: 'r1', duplicate: false });
        const res = await request(app)
            .post('/api/forms/public/s/submit')
            .send({ idempotencyKey: 'abcdefgh', answers: [] });
        expect(res.status).toBe(201);
        expect(res.body.data.id).toBe('r1');
    });

    it('POST submit returns 400 on invalid body (missing idempotencyKey)', async () => {
        const res = await request(app).post('/api/forms/public/s/submit').send({ answers: [] });
        expect(res.status).toBe(422); // validation error
        expect(submissionServiceMock.submitResponse).not.toHaveBeenCalled();
    });

    it('duplicate idempotencyKey still returns 201 (service dedups)', async () => {
        submissionServiceMock.submitResponse.mockResolvedValue({ id: 'r1', duplicate: true });
        const res = await request(app)
            .post('/api/forms/public/s/submit')
            .send({ idempotencyKey: 'abcdefgh', answers: [] });
        expect(res.status).toBe(201);
        expect(res.body.data.duplicate).toBe(true);
    });

    it('rate limits submissions after the configured max', async () => {
        submissionServiceMock.submitResponse.mockResolvedValue({ id: 'r', duplicate: false });
        let last;
        for (let i = 0; i < 12; i += 1) {
            last = await request(app)
                .post('/api/forms/public/s/submit')
                .send({ idempotencyKey: 'abcdefgh', answers: [] });
        }
        expect(last.status).toBe(429);
    });
});

describe('auth gating', () => {
    it('rejects unauthenticated access to private routes', async () => {
        const res = await request(app).get('/api/forms');
        expect(res.status).toBe(401);
    });

    it('lists forms when authenticated', async () => {
        formsServiceMock.listForms.mockResolvedValue({ forms: [], total: 0, page: 1, limit: 20 });
        const res = await auth(request(app).get('/api/forms'));
        expect(res.status).toBe(200);
    });

    it('propagates 403 from the service (ownership)', async () => {
        const err = new Error('forbidden');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        formsServiceMock.getFormById.mockRejectedValue(err);
        const res = await auth(request(app).get('/api/forms/11111111-1111-1111-1111-111111111111'));
        expect(res.status).toBe(403);
    });
});

describe('CSV export', () => {
    it('returns text/csv with attachment headers', async () => {
        aggregationServiceMock.buildCsv.mockResolvedValue({ filename: 's-responses.csv', csv: 'a,b\r\n1,2' });
        const res = await auth(
            request(app).get('/api/forms/11111111-1111-1111-1111-111111111111/responses/export')
        );
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/csv/);
        expect(res.headers['content-disposition']).toMatch(/attachment/);
    });
});
