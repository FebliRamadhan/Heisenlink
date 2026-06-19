import { describe, it, expect } from '@jest/globals';
import {
    createFormSchema,
    updateFormSchema,
    createQuestionSchema,
    updateQuestionSchema,
    submitFormSchema,
    reorderQuestionsSchema,
} from '../../src/validators/forms.validator.js';

describe('createFormSchema', () => {
    it('accepts an empty object (all optional)', () => {
        expect(createFormSchema.safeParse({}).success).toBe(true);
    });

    it('accepts a valid slug', () => {
        expect(createFormSchema.safeParse({ title: 'Survey', slug: 'my-form_1' }).success).toBe(true);
    });

    it('rejects uppercase / invalid slug', () => {
        expect(createFormSchema.safeParse({ slug: 'My Form' }).success).toBe(false);
        expect(createFormSchema.safeParse({ slug: 'ab' }).success).toBe(false); // too short
    });
});

describe('updateFormSchema', () => {
    it('accepts toggles and ISO closesAt', () => {
        const res = updateFormSchema.safeParse({
            isPublished: true,
            acceptingResponses: false,
            closesAt: '2026-12-31T00:00:00.000Z',
        });
        expect(res.success).toBe(true);
    });

    it('rejects non-ISO closesAt', () => {
        expect(updateFormSchema.safeParse({ closesAt: 'tomorrow' }).success).toBe(false);
    });
});

describe('createQuestionSchema', () => {
    it('accepts a short text question', () => {
        expect(createQuestionSchema.safeParse({ type: 'SHORT_TEXT', title: 'Name' }).success).toBe(true);
    });

    it('rejects a choice question without options', () => {
        const res = createQuestionSchema.safeParse({ type: 'MULTIPLE_CHOICE', title: 'Pick' });
        expect(res.success).toBe(false);
    });

    it('accepts a choice question with options', () => {
        const res = createQuestionSchema.safeParse({
            type: 'DROPDOWN',
            title: 'Pick',
            options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
        });
        expect(res.success).toBe(true);
    });

    it('rejects a linear scale where min >= max', () => {
        const res = createQuestionSchema.safeParse({
            type: 'LINEAR_SCALE',
            title: 'Rate',
            config: { min: 5, max: 5 },
        });
        expect(res.success).toBe(false);
    });

    it('accepts a valid linear scale', () => {
        const res = createQuestionSchema.safeParse({
            type: 'LINEAR_SCALE',
            title: 'Rate',
            config: { min: 1, max: 5, minLabel: 'Low', maxLabel: 'High' },
        });
        expect(res.success).toBe(true);
    });

    it('rejects an unknown question type', () => {
        expect(createQuestionSchema.safeParse({ type: 'RATING', title: 'x' }).success).toBe(false);
    });
});

describe('updateQuestionSchema', () => {
    it('allows partial update without type', () => {
        expect(updateQuestionSchema.safeParse({ title: 'New title' }).success).toBe(true);
    });

    it('still enforces options when type provided', () => {
        expect(updateQuestionSchema.safeParse({ type: 'CHECKBOXES' }).success).toBe(false);
    });
});

describe('reorderQuestionsSchema', () => {
    it('requires at least one uuid', () => {
        expect(reorderQuestionsSchema.safeParse({ questionIds: [] }).success).toBe(false);
        expect(
            reorderQuestionsSchema.safeParse({
                questionIds: ['11111111-1111-1111-1111-111111111111'],
            }).success
        ).toBe(true);
    });
});

describe('submitFormSchema', () => {
    const key = 'abcdefgh-1234';

    it('accepts a valid submission', () => {
        const res = submitFormSchema.safeParse({
            idempotencyKey: key,
            answers: [{ questionId: '11111111-1111-1111-1111-111111111111', value: 'hi' }],
        });
        expect(res.success).toBe(true);
    });

    it('rejects a short idempotency key', () => {
        expect(submitFormSchema.safeParse({ idempotencyKey: 'short', answers: [] }).success).toBe(false);
    });

    it('rejects an invalid respondent email', () => {
        const res = submitFormSchema.safeParse({
            idempotencyKey: key,
            respondentEmail: 'not-an-email',
            answers: [],
        });
        expect(res.success).toBe(false);
    });

    it('accepts a filled honeypot (handled as fake-success in service, not rejected here)', () => {
        const res = submitFormSchema.safeParse({
            idempotencyKey: key,
            website: 'http://spam.example',
            answers: [],
        });
        expect(res.success).toBe(true);
    });
});
