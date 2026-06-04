/**
 * Unit tests for form services with Prisma mocked.
 *
 * NOTE: jest deadlocks in the original dev sandbox because the Prisma native
 * query engine cannot start there. These tests are written to run in CI / a
 * normal environment. The pure logic (answer normalization, validation) is
 * additionally verified by tests/manual-verify.mjs via plain node.
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ---- Mock modules pulled in by the services (ESM) ----
const prismaMock = {
    form: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    formQuestion: {
        aggregate: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    formResponse: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    formAnswer: { groupBy: jest.fn(), aggregate: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn(),
};

jest.unstable_mockModule('../../src/config/database.js', () => ({ default: prismaMock }));
jest.unstable_mockModule('../../src/services/cache.service.js', () => ({
    cacheForm: jest.fn(),
    getCachedForm: jest.fn().mockResolvedValue(null),
    invalidateForm: jest.fn(),
}));
jest.unstable_mockModule('../../src/services/revalidate.service.js', () => ({
    revalidateFormTag: jest.fn(),
}));

const formsService = await import('../../src/services/forms.service.js');
const submissionService = await import('../../src/services/form-submission.service.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('assertFormOwner', () => {
    it('throws notFound when form missing', async () => {
        prismaMock.form.findUnique.mockResolvedValue(null);
        await expect(formsService.assertFormOwner('f1', 'u1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws forbidden for a non-owner non-admin', async () => {
        prismaMock.form.findUnique.mockResolvedValue({ id: 'f1', userId: 'owner' });
        await expect(formsService.assertFormOwner('f1', 'intruder')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('allows ADMIN to bypass ownership', async () => {
        prismaMock.form.findUnique.mockResolvedValue({ id: 'f1', userId: 'owner' });
        await expect(formsService.assertFormOwner('f1', 'intruder', 'ADMIN')).resolves.toBeTruthy();
    });
});

describe('addQuestion auto-position', () => {
    it('places a new question at max+1', async () => {
        prismaMock.form.findUnique.mockResolvedValue({ id: 'f1', userId: 'u1', slug: 's' });
        prismaMock.formQuestion.aggregate.mockResolvedValue({ _max: { position: 2 } });
        prismaMock.formQuestion.create.mockImplementation(({ data }) => ({ id: 'q', ...data }));

        await formsService.addQuestion('f1', 'u1', 'USER', { type: 'SHORT_TEXT', title: 'x' });

        expect(prismaMock.formQuestion.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ position: 3 }) })
        );
    });
});

describe('reorderQuestions', () => {
    it('issues a position update per id in a transaction', async () => {
        prismaMock.form.findUnique.mockResolvedValue({ id: 'f1', userId: 'u1', slug: 's' });
        prismaMock.$transaction.mockResolvedValue([]);
        prismaMock.formQuestion.update.mockImplementation((args) => args);

        await formsService.reorderQuestions('f1', 'u1', 'USER', ['a', 'b', 'c']);

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(prismaMock.formQuestion.update).toHaveBeenCalledTimes(3);
    });
});

describe('submitResponse idempotency & honeypot', () => {
    const publishedForm = {
        id: 'f1',
        slug: 's',
        isPublished: true,
        acceptingResponses: true,
        closesAt: null,
        collectEmail: false,
        questions: [{ id: 'q1', type: 'SHORT_TEXT', title: 'Name', isRequired: false, config: null }],
    };

    it('returns fake success without saving when honeypot is filled', async () => {
        const res = await submissionService.submitResponse('s', {
            idempotencyKey: 'abcdefgh',
            website: 'http://spam',
            answers: [],
        });
        expect(res.honeypot).toBe(true);
        expect(prismaMock.formResponse.create).not.toHaveBeenCalled();
    });

    it('replays an existing response for the same idempotencyKey', async () => {
        prismaMock.form.findUnique.mockResolvedValue(publishedForm);
        prismaMock.formResponse.findUnique.mockResolvedValue({ id: 'existing' });

        const res = await submissionService.submitResponse('s', { idempotencyKey: 'abcdefgh', answers: [] });

        expect(res).toMatchObject({ id: 'existing', duplicate: true });
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('treats a P2002 race as success (returns the winning row)', async () => {
        prismaMock.form.findUnique.mockResolvedValue(publishedForm);
        prismaMock.formResponse.findUnique
            .mockResolvedValueOnce(null) // pre-check: none yet
            .mockResolvedValueOnce({ id: 'winner' }); // after race
        prismaMock.$transaction.mockRejectedValue({ code: 'P2002' });

        const res = await submissionService.submitResponse('s', { idempotencyKey: 'abcdefgh', answers: [] });

        expect(res).toMatchObject({ id: 'winner', duplicate: true });
    });

    it('rejects when form is not accepting responses', async () => {
        prismaMock.form.findUnique.mockResolvedValue({ ...publishedForm, acceptingResponses: false });
        await expect(
            submissionService.submitResponse('s', { idempotencyKey: 'abcdefgh', answers: [] })
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('increments responseCount on a fresh submission', async () => {
        prismaMock.form.findUnique.mockResolvedValue(publishedForm);
        prismaMock.formResponse.findUnique.mockResolvedValue(null);
        const tx = {
            formResponse: { create: jest.fn().mockResolvedValue({ id: 'new' }) },
            form: { update: jest.fn() },
        };
        prismaMock.$transaction.mockImplementation(async (fn) => fn(tx));

        const res = await submissionService.submitResponse('s', {
            idempotencyKey: 'abcdefgh',
            answers: [{ questionId: 'q1', value: 'Alice' }],
        });

        expect(res).toMatchObject({ id: 'new', duplicate: false });
        expect(tx.form.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { responseCount: { increment: 1 } } })
        );
    });
});
