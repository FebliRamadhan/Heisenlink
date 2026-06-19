# Plan Implementasi Fitur "Forms" (mirip Google Forms)

> Dokumen handoff untuk dilanjutkan dengan Claude Code di lokal.
> Branch: `claude/trusting-maxwell-eXc0M`.
> Semua keputusan desain di bawah sudah dikonfirmasi bersama user.

## Keputusan Desain (FINAL)

| Item | Keputusan |
|---|---|
| Banyak form per user | `Form.userId` di-`@@index` (bukan unique). Dashboard list + editor per-form `/api/forms/:id`. |
| URL publik | Route Next baru `app/f/[slug]/page.tsx`. API publik di-namespace `/api/forms/public/:slug`. |
| LONG_TEXT | Maks **1.000 karakter** (hard cap 1.000), override per-soal via `config.maxLength`. |
| SHORT_TEXT | Maks 255 karakter. |
| FILE_UPLOAD | Aktif untuk responden anonim. File ke **S3** via endpoint upload terpisah (`s3Service.uploadObject`, bukan `uploadAvatar`). |
| Normalisasi jawaban | Kolom ternormalisasi di `FormAnswer`. CHECKBOXES & FILE = banyak baris (1 baris per opsi/file). `options`/`config` di `FormQuestion` pakai JSON. |
| Anti submit-ganda | `@@unique([formId, idempotencyKey])` + tangani race `P2002` sebagai sukses (idempotent replay). |
| Anti-abuse submit | Rate-limit Redis + honeypot field (terisi → balas 200 sukses semu, tidak disimpan). |
| Layout isi form | **Wizard via SECTION**: `SECTION` = page-break + judul grup. Tanpa SECTION → satu halaman. Progress bar, tombol Kembali/Lanjut, Kirim hanya di halaman terakhir, validasi per-halaman. |
| Autosave | Debounce ke `localStorage["form-draft:{slug}"]` (jawaban + idempotencyKey + posisi halaman terakhir). Restore saat reload, hapus saat submit sukses. |
| Submit tahan-gagal | Retry/backoff (2s/4s/8s/16s) pakai `idempotencyKey` sama → server dedup. |
| Cache & ISR | Redis `form:{slug}` + `revalidateFormTag(slug)` (tag `form:{slug}`), pola sama seperti Bio. |
| Testing | Jest **ESM** (perlu bootstrap `jest.config.js` + `NODE_OPTIONS=--experimental-vm-modules`). |
| Dependency baru | **Tidak ada** — recharts, multer, @aws-sdk/client-s3, zod, @dnd-kit, nanoid sudah tersedia. CSV di-hand-roll. |

## Pemetaan ke Pola yang Sudah Ada

| Kebutuhan Forms | Sumber pola di repo |
|---|---|
| Parent + child terurut | `BioPage` → `BioLink` (`position`, reorder transaksi) |
| Public page + cache + ISR | `getBioPageBySlug` (Redis) + `revalidateBioTag` + `app/[slug]/page.tsx` |
| Upload file | `src/services/s3.service.js` + `multer.memoryStorage()` (pola `uploadAvatar` di `bio.routes.js`) |
| Controller→service→Prisma, `errors.*`, `formatResponse` | `bio.controller/service.js`, `src/middleware/error.middleware.js`, `src/utils/helpers.js` |
| Validasi Zod + `validateBody/Query/Params` | `src/validators/bio.validator.js` + `src/middleware/validate.middleware.js` |
| Rate limit Redis | `src/middleware/rateLimiter.middleware.js` (`createRateLimiter`) |
| DnD reorder | `components/bio/bio-link-list.tsx` (`@dnd-kit`) |
| Query/mutation + invalidate | `app/(dashboard)/dashboard/bio/page.tsx` (TanStack Query) |

---

## 1. Model Prisma (`prisma/schema.prisma`)

Tambahkan relasi di model `User`: `forms Form[]`. Lalu tambahkan:

```prisma
enum FormQuestionType {
  SHORT_TEXT
  LONG_TEXT
  MULTIPLE_CHOICE
  CHECKBOXES
  DROPDOWN
  LINEAR_SCALE
  DATE
  TIME
  FILE_UPLOAD
  SECTION      // display-only: page-break + judul bagian
  STATEMENT    // display-only: narasi/teks
}

model Form {
  id                    String    @id @default(uuid())
  userId                String    @map("user_id")
  slug                  String    @unique
  title                 String    @default("Untitled form")
  description           String?
  theme                 String    @default("default")
  settings              Json?     // flag kosmetik/perilaku tambahan
  isPublished           Boolean   @default(false) @map("is_published")
  acceptingResponses    Boolean   @default(true)  @map("accepting_responses")
  collectEmail          Boolean   @default(false) @map("collect_email")
  oneResponsePerSession Boolean   @default(true)  @map("one_response_per_session")
  closesAt              DateTime? @map("closes_at")
  confirmationMessage   String?   @map("confirmation_message")
  closedMessage         String?   @map("closed_message")
  responseCount         Int       @default(0) @map("response_count")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  questions FormQuestion[]
  responses FormResponse[]

  @@index([userId])
  @@index([slug])
  @@map("forms")
}

model FormQuestion {
  id          String           @id @default(uuid())
  formId      String           @map("form_id")
  type        FormQuestionType
  title       String           @default("")
  description String?
  position    Int              @default(0)
  isRequired  Boolean          @default(false) @map("is_required")
  options     Json?            // pilihan: [{ id, label }]
  config      Json?            // per-tipe: scale {min,max,minLabel,maxLabel}, file {accept,maxSizeMb,maxFiles}, {maxLength}
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  form    Form         @relation(fields: [formId], references: [id], onDelete: Cascade)
  answers FormAnswer[]

  @@index([formId])
  @@map("form_questions")
}

model FormResponse {
  id              String   @id @default(uuid())
  formId          String   @map("form_id")
  idempotencyKey  String   @map("idempotency_key")
  respondentEmail String?  @map("respondent_email")
  ipAddress       String?  @map("ip_address")
  userAgent       String?  @map("user_agent")
  submittedAt     DateTime @default(now()) @map("submitted_at")

  form    Form         @relation(fields: [formId], references: [id], onDelete: Cascade)
  answers FormAnswer[]

  @@unique([formId, idempotencyKey])
  @@index([formId])
  @@index([submittedAt])
  @@map("form_responses")
}

model FormAnswer {
  id          String    @id @default(uuid())
  responseId  String    @map("response_id")
  questionId  String    @map("question_id")
  // kolom value ternormalisasi (satu terisi sesuai tipe pertanyaan)
  textValue   String?   @map("text_value") @db.Text  // SHORT/LONG_TEXT, DROPDOWN, TIME("HH:mm"), snapshot label opsi
  numberValue Float?    @map("number_value")          // LINEAR_SCALE
  dateValue   DateTime? @map("date_value")            // DATE
  optionId    String?   @map("option_id")             // id opsi terpilih (MULTIPLE_CHOICE/CHECKBOXES/DROPDOWN)
  fileUrl     String?   @map("file_url")              // FILE_UPLOAD (1 baris per file)
  fileName    String?   @map("file_name")
  fileSize    Int?      @map("file_size")
  createdAt   DateTime  @default(now()) @map("created_at")

  response FormResponse @relation(fields: [responseId], references: [id], onDelete: Cascade)
  question FormQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([responseId])
  @@index([questionId])
  @@map("form_answers")
}
```

Migrasi: `npx prisma migrate dev --name add_forms`.

> Catatan: CHECKBOXES menghasilkan banyak baris `FormAnswer` per response+question, jadi **jangan** menambahkan `@@unique([responseId, questionId])`.

---

## 2. Backend

### 2a. Routes (`src/routes/forms.routes.js`, mount di `src/routes/index.js`: `router.use('/api/forms', formsRoutes)`)

Urutan deklarasi penting: public dulu → `authenticate` → static path (`slug-check`, `reorder`) sebelum param dinamis (`/:id`, `/:qid`).

```
// PUBLIC (sebelum authenticate)
GET    /api/forms/public/:slug              getPublicForm     (cache + ISR tag)
POST   /api/forms/public/:slug/submit       submitForm        (rateLimiters.formSubmit + honeypot + idempotency)
POST   /api/forms/public/:slug/upload       uploadFormFile    (rateLimiters.formUpload + multer.single('file'))

router.use(authenticate)

// AUTHED - manajemen
GET    /api/forms                           listForms         (paginate)
POST   /api/forms                           createForm
GET    /api/forms/slug-check                checkSlug         (SEBELUM /:id)
GET    /api/forms/:id                       getForm           (full + questions, owner-only)
PATCH  /api/forms/:id                       updateForm
DELETE /api/forms/:id                       deleteForm
POST   /api/forms/:id/duplicate             duplicateForm

// AUTHED - pertanyaan
POST   /api/forms/:id/questions             addQuestion
PATCH  /api/forms/:id/questions/reorder     reorderQuestions  (SEBELUM /:qid)
PATCH  /api/forms/:id/questions/:qid        updateQuestion
DELETE /api/forms/:id/questions/:qid        deleteQuestion

// AUTHED - hasil
GET    /api/forms/:id/summary               getSummary
GET    /api/forms/:id/responses             listResponses     (paginate)
GET    /api/forms/:id/responses/export      exportResponses   (CSV stream)
DELETE /api/forms/:id/responses/:rid        deleteResponse    (opsional)
```

multer dikonfigurasi seperti `bio.routes.js` tapi `fileFilter` lebih luas (gambar + pdf/word/excel/zip), `limits.fileSize` dari `config.upload.maxFileSize`.

### 2b. Controller (`src/controllers/forms.controller.js`)

Tipis, persis pola Bio: ambil `req.user.sub`, panggil service, balas `res.json(formatResponse(...))` / `res.status(201)`, `catch → next(error)`. Untuk export CSV: set `Content-Type: text/csv` + `Content-Disposition: attachment; filename="..."`. Honeypot terisi → balas 200 sukses semu tanpa simpan.

### 2c. Services

- **`src/services/forms.service.js`** — CRUD form & question; generate `slug` default `nanoid(8)` + custom (cek `isSlugAvailable` + reserved-alias); `assertFormOwner(formId, userId, role)` (ADMIN lolos); `reorderQuestions` via `prisma.$transaction([...update position])`; `getPublicFormBySlug` (cache Redis `form:{slug}`, hanya jika `isPublished`, strip data sensitif); `duplicateForm` (deep copy questions). Tiap mutasi struktur → `invalidateForm(slug)` + `revalidateFormTag(slug)`.
- **`src/services/form-submission.service.js`** — inti submit:
  1. Load form by slug; harus `isPublished && acceptingResponses && (!closesAt || now<closesAt)` else `errors.forbidden`.
  2. Validasi jawaban terhadap definisi pertanyaan (required, opsi valid, batas scale, format date/time, jumlah/ukuran file, maxLength) — server-side.
  3. Normalisasi → array `FormAnswer` (CHECKBOXES & FILE = banyak baris).
  4. `prisma.$transaction`: create `FormResponse` + `createMany(answers)` + `form.update({ responseCount: { increment: 1 } })`.
  5. Idempotency: tangkap `P2002` pada `(formId, idempotencyKey)` → ambil existing → balas sukses.
  - Rekam `ipAddress`/`userAgent` (ambil `x-forwarded-for`, pola seperti `analytics.service.js`).
- **`src/services/form-aggregation.service.js`** — `getSummary(formId)` & `buildCsv(formId)`:
  - choice → `groupBy(optionId)` count + totalAnswered.
  - LINEAR_SCALE → distribusi + `_avg(numberValue)`.
  - text → totalAnswered + sample N terbaru.
  - date/time → distribusi; file → jumlah.
  - CSV: header `Submitted At[, Email], <judul pertanyaan urut position>`; checkboxes digabung `", "`; file → URL gabung; escaping RFC4180 (`"`→`""`, bungkus jika ada `, " \n`).

Helper cache baru di `src/services/cache.service.js`: `cacheForm/getCachedForm/invalidateForm` (key `form:{slug}`, TTL baru `config.cache.formTTL`). Helper revalidate baru di `src/services/revalidate.service.js`: `revalidateFormTag(slug)`. Route internal Next `app/internal/revalidate/route.ts` **sudah** mendukung tag generik — tidak perlu diubah.

### 2d. Validators (`src/validators/forms.validator.js`, Zod)

`createFormSchema`, `updateFormSchema`, `formIdParamSchema`, `questionIdParamSchema`, `slugQuerySchema`, `createQuestionSchema`/`updateQuestionSchema` (pakai `z.discriminatedUnion('type', ...)` — options wajib untuk choice, `config.min<max` untuk scale, dst), `reorderQuestionsSchema` (`{questionIds: uuid[]}`), `submitFormSchema` (`{idempotencyKey, honeypot?, respondentEmail?, answers:[...]}`, LONG_TEXT `.max(1000)`), `listResponsesQuerySchema`, `exportQuerySchema`. Plug via `validateBody/Query/Params`.

### 2e. Anti-abuse (tambah di `rateLimiter.middleware.js`)

```js
formSubmit: createRateLimiter({ windowMs: 60000, max: 10, keyPrefix: 'rate:form-submit' }),
formUpload: createRateLimiter({ windowMs: 60000, max: 20, keyPrefix: 'rate:form-upload' }),
```

Honeypot field tersembunyi (mis. `website`) di renderer; terisi → sukses semu.

---

## 3. Frontend (Next.js / TypeScript)

### 3a. Dashboard

- `app/(dashboard)/dashboard/forms/page.tsx` — daftar form (kartu/tabel): judul, status (Draft/Published/Closed), `responseCount`, share `/f/:slug`, menu (Open/Duplicate/Delete). Query `["forms"]`.
- `app/(dashboard)/dashboard/forms/[id]/page.tsx` — editor, tab via `?tab=` (mirror Bio): Questions (builder) / Settings / Preview. Query `["forms", id]`.
- `app/(dashboard)/dashboard/forms/[id]/responses/page.tsx` — Summary (charts) / Individual (tabel) / Export CSV.
- Tambah entri nav "Forms" di sidebar dashboard (`components/layout/...`).

### 3b. Komponen (`components/forms/`)

- `form-builder.tsx` — list pertanyaan + `@dnd-kit` (salin pola `bio-link-list.tsx`), tombol "Add" per tipe + "Add section".
- `question-editor.tsx` (+ `question-type-picker.tsx`, `option-list-editor.tsx` dengan dnd opsi) — editor per tipe; SECTION/STATEMENT dirender khusus tanpa input jawaban.
- `form-settings.tsx`, `form-preview.tsx`.
- **Public renderer**: `public-form-view.tsx` (logika **stepper/wizard** berbasis SECTION) + `question-fields/*` (satu komponen per tipe). `react-hook-form` + skema Zod dinamis dari definisi pertanyaan. Honeypot tersembunyi.
- **Responses**: `responses-summary.tsx` (recharts), `responses-table.tsx`, `response-detail.tsx`, `export-button.tsx`.
- Komponen UI baru kecil: `components/ui/radio-group.tsx` & `checkbox.tsx` (belum ada; sisanya sudah tersedia).

### 3c. Public route

`app/f/[slug]/page.tsx` — Server Component, `fetch(`${API_URL}/api/forms/public/${slug}`, { next: { revalidate: 60, tags: [`form:${slug}`] } })` (pola `app/[slug]/page.tsx`), render `<PublicFormView>` (client). State: not-found / closed / not-accepting / confirmation.

### 3d. Wizard (SECTION) + Autosave + Submit tahan-gagal

- Helper pecah pertanyaan jadi halaman berdasarkan baris `SECTION`. Tanpa SECTION → satu halaman.
- Wizard: progress bar "Bagian X dari Y", tombol Kembali/Lanjut, Kirim di halaman terakhir, **validasi per-halaman** saat Lanjut.
- `hooks/use-form-autosave.ts` — debounce (`use-debounce` yang ada) tulis ke `localStorage["form-draft:{slug}"]` (jawaban + `idempotencyKey` di-generate sekali via `nanoid` + posisi halaman terakhir); restore saat mount; `clear()` saat submit sukses.
- `hooks/use-form-submit.ts` — `POST /public/:slug/submit` dengan retry/backoff (2s/4s/8s/16s) pada error jaringan; `idempotencyKey` tetap sama (server dedup). Sukses → `clear()`.

---

## 4. Testing (Jest ESM)

Repo belum punya `jest.config.js`/babel/test apa pun. Karena `"type":"module"`, Jest 29 butuh VM ESM.

```js
// jest.config.js
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
};
```

Ubah script di `package.json`: `"test": "NODE_OPTIONS=--experimental-vm-modules jest"`.

Mock prisma (ESM) pakai `jest.unstable_mockModule(...)` + `await import(...)` setelah mock. Cakupan:

- `tests/unit/forms.validator.test.js` — discriminatedUnion per tipe (valid/invalid: scale min>=max, choice tanpa options, email salah, LONG_TEXT >1000).
- `tests/unit/forms.service.test.js` — slug-gen/availability, `assertFormOwner` (forbidden), normalisasi checkbox→multi-row, submit idempoten (P2002→sukses), shaping summary, escaping CSV.
- `tests/integration/forms.routes.test.js` — supertest atas `app` (`src/app.js` sudah `export default` tanpa `listen`): CRUD authed, publish→public fetch, submit happy-path, honeypot→200-tanpa-simpan, duplicate idempotencyKey→tetap 1 response, rate-limit→429. S3 & Redis di-mock; DB pakai test database atau mock di batas modul.

---

## 5. Urutan Implementasi Bertahap

1. **Schema & migrasi** — model di atas + `User.forms`; `migrate dev`; bootstrap `jest.config.js` + update script test.
2. **Backend CRUD** — validator → `forms.service` → controller → routes → mount; cache + revalidate helper. Tes validator + service unit.
3. **Public + submit pipeline** — `getPublicFormBySlug` (cache/ISR), `form-submission.service` (validasi+normalisasi+transaksi+idempotency), rate-limit, honeypot, endpoint upload (S3). Tes integrasi submit/honeypot/idempotency/rate-limit.
4. **Agregasi & export** — `form-aggregation.service` (summary + CSV) + endpoints. Tes unit shaping & CSV escaping.
5. **Dashboard FE** — list + editor (builder dnd, settings, preview), query/mutation + invalidate, nav.
6. **Public renderer FE** — `app/f/[slug]`, wizard SECTION, field per tipe, autosave + submit-retry, upload, confirmation.
7. **Responses FE** — summary charts + tabel + export.
8. **Pemolesan** — empty/closed states, a11y dnd, dokumentasi di `CLAUDE.md`, lint/format, jalankan seluruh test.

Setiap fase di-commit terpisah ke branch `claude/trusting-maxwell-eXc0M`.
