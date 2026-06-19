// Plain-node verification of Forms logic (jest deadlocks in this sandbox).
// Run: node tests/manual-verify.mjs
import assert from 'node:assert/strict';
import {
    createFormSchema,
    createQuestionSchema,
    updateQuestionSchema,
    submitFormSchema,
} from '../src/validators/forms.validator.js';
import { buildAnswerRows, validateAndNormalize } from '../src/services/answer-normalizer.js';

let passed = 0;
const check = (name, fn) => {
    try {
        fn();
        passed += 1;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        console.error(`  ✗ ${name}: ${e.message}`);
        process.exitCode = 1;
    }
};

console.log('Validator:');
check('createFormSchema accepts valid slug', () =>
    assert.equal(createFormSchema.safeParse({ slug: 'my-form_1' }).success, true)
);
check('createFormSchema rejects uppercase slug', () =>
    assert.equal(createFormSchema.safeParse({ slug: 'My Form' }).success, false)
);
check('choice question without options fails', () =>
    assert.equal(createQuestionSchema.safeParse({ type: 'MULTIPLE_CHOICE', title: 'x' }).success, false)
);
check('choice question with options passes', () =>
    assert.equal(
        createQuestionSchema.safeParse({
            type: 'DROPDOWN',
            title: 'x',
            options: [{ id: 'a', label: 'A' }],
        }).success,
        true
    )
);
check('linear scale min>=max fails', () =>
    assert.equal(
        createQuestionSchema.safeParse({ type: 'LINEAR_SCALE', title: 'x', config: { min: 5, max: 5 } })
            .success,
        false
    )
);
check('updateQuestionSchema allows partial without type', () =>
    assert.equal(updateQuestionSchema.safeParse({ title: 'New' }).success, true)
);
check('submit requires 8-char idempotency key', () => {
    assert.equal(submitFormSchema.safeParse({ idempotencyKey: 'short', answers: [] }).success, false);
    assert.equal(
        submitFormSchema.safeParse({ idempotencyKey: 'abcdefgh', answers: [] }).success,
        true
    );
});
check('submit rejects invalid email', () =>
    assert.equal(
        submitFormSchema.safeParse({ idempotencyKey: 'abcdefgh', respondentEmail: 'nope', answers: [] })
            .success,
        false
    )
);

console.log('Answer normalization:');
const shortText = { id: 'q1', type: 'SHORT_TEXT', title: 'Name', config: null };
check('SHORT_TEXT enforces max length', () => {
    const q = { ...shortText, config: { maxLength: 3 } };
    assert.throws(() => buildAnswerRows(q, 'abcd'));
    assert.deepEqual(buildAnswerRows(shortText, 'hi'), [{ questionId: 'q1', textValue: 'hi' }]);
});

const mc = { id: 'q2', type: 'MULTIPLE_CHOICE', title: 'Pick', options: [{ id: 'a', label: 'Apple' }] };
check('MULTIPLE_CHOICE invalid option throws', () => assert.throws(() => buildAnswerRows(mc, 'z')));
check('MULTIPLE_CHOICE valid stores optionId + label', () =>
    assert.deepEqual(buildAnswerRows(mc, 'a'), [{ questionId: 'q2', optionId: 'a', textValue: 'Apple' }])
);

const cb = {
    id: 'q3',
    type: 'CHECKBOXES',
    title: 'Pick many',
    options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
};
check('CHECKBOXES produces one row per selection', () =>
    assert.equal(buildAnswerRows(cb, ['a', 'b']).length, 2)
);
check('CHECKBOXES rejects invalid member', () => assert.throws(() => buildAnswerRows(cb, ['a', 'z'])));

const scale = { id: 'q4', type: 'LINEAR_SCALE', title: 'Rate', config: { min: 1, max: 5 } };
check('LINEAR_SCALE rejects out of range', () => assert.throws(() => buildAnswerRows(scale, 9)));
check('LINEAR_SCALE accepts in range', () =>
    assert.deepEqual(buildAnswerRows(scale, 3), [{ questionId: 'q4', numberValue: 3 }])
);

console.log('validateAndNormalize:');
const form = {
    questions: [
        { id: 'qs', type: 'SECTION', title: 'Intro' },
        { id: 'q1', type: 'SHORT_TEXT', title: 'Name', isRequired: true, config: null },
        { id: 'q2', type: 'SHORT_TEXT', title: 'Nick', isRequired: false, config: null },
    ],
};
check('required missing throws', () =>
    assert.throws(() => validateAndNormalize(form, [{ questionId: 'q2', value: 'x' }]))
);
check('display-only + optional skipped, required kept', () => {
    const rows = validateAndNormalize(form, [{ questionId: 'q1', value: 'Alice' }]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].textValue, 'Alice');
});

console.log(`\n${passed} checks passed${process.exitCode ? ' (with failures)' : ''}`);
// PrismaClient (imported transitively) keeps the event loop alive; exit explicitly.
process.exit(process.exitCode || 0);
