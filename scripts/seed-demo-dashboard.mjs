// Demo seed: a published form with responses + a published dashboard of widgets.
// Run inside the docker app container so it targets the compose DB:
//   docker exec linkhub-app-dev node scripts/seed-demo-dashboard.mjs
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const slug = (p) => `${p}-${Math.random().toString(36).slice(2, 8)}`
const pick = (a) => a[Math.floor(Math.random() * a.length)]

const main = async () => {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
    if (!admin) throw new Error("No admin user found — run npm run db:seed first")

    const options = [
        { id: "opt_sosmed", label: "Sosial Media" },
        { id: "opt_teman", label: "Teman" },
        { id: "opt_iklan", label: "Iklan" },
        { id: "opt_lainnya", label: "Lainnya" },
    ]

    // 1. Form + questions
    const form = await prisma.form.create({
        data: {
            userId: admin.id,
            slug: slug("survei-kepuasan"),
            title: "Survei Kepuasan Pelanggan (Demo)",
            description: "Data dummy untuk mendemonstrasikan dashboard dinamis.",
            isPublished: true,
            acceptingResponses: true,
            questions: {
                create: [
                    {
                        type: "MULTIPLE_CHOICE",
                        title: "Dari mana Anda mengetahui produk kami?",
                        position: 0,
                        isRequired: true,
                        options,
                    },
                    {
                        type: "LINEAR_SCALE",
                        title: "Seberapa puas Anda dengan layanan kami?",
                        position: 1,
                        isRequired: true,
                        config: { min: 1, max: 5, minLabel: "Sangat buruk", maxLabel: "Sangat baik" },
                    },
                    {
                        type: "SHORT_TEXT",
                        title: "Apa saran Anda untuk kami?",
                        position: 2,
                    },
                ],
            },
        },
        include: { questions: { orderBy: { position: "asc" } } },
    })
    const [q1, q2, q3] = form.questions

    // 2. Responses spread across the last 5 days (so OVER_TIME has buckets)
    const suggestions = [
        "Tingkatkan kecepatan layanan pelanggan",
        "Aplikasi sangat membantu pekerjaan",
        "Mohon tambahkan fitur ekspor data",
        "Layanan cepat dan ramah terima kasih",
        "Antarmuka mudah digunakan dan bersih",
        "Dokumentasi perlu lebih lengkap",
        "Aplikasi membantu dan ramah",
        null,
    ]
    const N = 18
    for (let i = 0; i < N; i++) {
        const daysAgo = Math.floor(Math.random() * 5)
        const submittedAt = new Date(Date.now() - daysAgo * 86400000 - i * 1000)
        const opt = pick(options)
        const answers = [
            { questionId: q1.id, optionId: opt.id, textValue: opt.label },
            { questionId: q2.id, numberValue: 1 + Math.floor(Math.random() * 5) },
        ]
        const s = pick(suggestions)
        if (s) answers.push({ questionId: q3.id, textValue: s })
        await prisma.formResponse.create({
            data: {
                formId: form.id,
                idempotencyKey: `demo-${i}-${Math.random().toString(36).slice(2)}`,
                submittedAt,
                answers: { create: answers },
            },
        })
    }
    await prisma.form.update({ where: { id: form.id }, data: { responseCount: N } })

    // 3. Dashboard + widgets
    const dashboard = await prisma.formDashboard.create({
        data: {
            formId: form.id,
            userId: admin.id,
            slug: slug("ringkasan-kepuasan"),
            title: "Ringkasan Kepuasan Pelanggan",
            description: "Dashboard dinamis dari respons survei.",
            isPublished: true,
            visibility: "LINK",
            widgets: {
                create: [
                    { questionId: null, type: "KPI", aggregation: "COUNT", title: "Total Responden", position: 0 },
                    { questionId: null, type: "LINE", aggregation: "OVER_TIME", title: "Respon per Hari", position: 1, config: { granularity: "day" } },
                    { questionId: q1.id, type: "PIE", aggregation: "DISTRIBUTION", title: "Sumber Informasi", position: 2 },
                    { questionId: q1.id, type: "BAR", aggregation: "DISTRIBUTION", title: "Sumber Informasi (Bar)", position: 3 },
                    { questionId: q2.id, type: "KPI", aggregation: "AVERAGE", title: "Rata-rata Kepuasan", position: 4 },
                    { questionId: q2.id, type: "SCALE_HISTOGRAM", aggregation: "DISTRIBUTION", title: "Distribusi Skor", position: 5 },
                    { questionId: q3.id, type: "WORDCLOUD", aggregation: "DISTRIBUTION", title: "Kata Kunci Saran", position: 6, config: { topN: 30 } },
                ],
            },
        },
    })

    console.log("DONE")
    console.log("FORM_SLUG=" + form.slug)
    console.log("DASHBOARD_SLUG=" + dashboard.slug)
}

main()
    .catch((e) => {
        console.error("SEED FAILED:", e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
