"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { FormQuestion } from "@/types"

interface QuestionFieldProps {
    question: FormQuestion
    value: unknown
    onChange: (value: unknown) => void
    disabled?: boolean
    error?: string
    idPrefix?: string
}

/**
 * Renders the input for a single question by type. Display-only types
 * (SECTION/STATEMENT) render as narrative and collect no value. Shared by the
 * dashboard preview and the public renderer.
 */
export function QuestionField({ question, value, onChange, disabled, error, idPrefix = "q" }: QuestionFieldProps) {
    const id = `${idPrefix}-${question.id}`

    if (question.type === "SECTION") {
        return (
            <div className="space-y-3">
                <div className="rounded-xl bg-primary px-6 py-4 text-primary-foreground shadow-sm">
                    <h3 className="text-base font-semibold uppercase tracking-wide">{question.title || "Section"}</h3>
                </div>
                {question.description && (
                    <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground whitespace-pre-line shadow-sm">
                        {question.description}
                    </div>
                )}
            </div>
        )
    }

    if (question.type === "STATEMENT") {
        return (
            <div className="prose-sm">
                {question.title && <p className="font-medium">{question.title}</p>}
                {question.description && <p className="text-sm text-muted-foreground">{question.description}</p>}
            </div>
        )
    }

    if (question.type === "IMAGE") {
        const src = question.config?.imageUrl
        return (
            <div className="space-y-1">
                {question.title && <p className="font-medium">{question.title}</p>}
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={question.config?.alt || question.title || "Image"} className="max-w-full rounded-md border" />
                ) : (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No image set</div>
                )}
            </div>
        )
    }

    const options = question.options || []

    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-base">
                {question.title || "Untitled question"}
                {question.isRequired && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
            </Label>
            {question.description && <p className="text-sm text-muted-foreground">{question.description}</p>}

            {question.type === "SHORT_TEXT" && (
                <Input id={id} value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled}
                    maxLength={question.config?.maxLength || 255} />
            )}

            {question.type === "LONG_TEXT" && (
                <textarea
                    id={id}
                    value={(value as string) || ""}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    maxLength={question.config?.maxLength || 1000}
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                />
            )}

            {question.type === "MULTIPLE_CHOICE" && (
                <RadioGroup name={id} value={(value as string) || ""} onValueChange={(v) => onChange(v)}>
                    {options.map((opt) => (
                        <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value={opt.id} id={`${id}-${opt.id}`} disabled={disabled} />
                            <span>{opt.label}</span>
                        </label>
                    ))}
                </RadioGroup>
            )}

            {question.type === "CHECKBOXES" && (
                <div className="grid gap-2">
                    {options.map((opt) => {
                        const arr = Array.isArray(value) ? (value as string[]) : []
                        const checked = arr.includes(opt.id)
                        return (
                            <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    id={`${id}-${opt.id}`}
                                    checked={checked}
                                    disabled={disabled}
                                    onCheckedChange={(c) => {
                                        const next = c ? [...arr, opt.id] : arr.filter((x) => x !== opt.id)
                                        onChange(next)
                                    }}
                                />
                                <span>{opt.label}</span>
                            </label>
                        )
                    })}
                </div>
            )}

            {question.type === "DROPDOWN" && (
                <Select value={(value as string) || ""} onValueChange={(v) => onChange(v)} disabled={disabled}>
                    <SelectTrigger id={id}><SelectValue placeholder="Choose…" /></SelectTrigger>
                    <SelectContent>
                        {options.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {question.type === "LINEAR_SCALE" && (
                <ScaleField id={id} question={question} value={value as number} onChange={onChange} disabled={disabled} />
            )}

            {question.type === "DATE" && (
                <Input id={id} type="date" value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="max-w-xs" />
            )}

            {question.type === "TIME" && (
                <Input id={id} type="time" value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="max-w-xs" />
            )}

            {question.type === "FILE_UPLOAD" && (
                <Input
                    id={id}
                    type="file"
                    disabled={disabled}
                    multiple={(question.config?.maxFiles ?? 1) > 1}
                    onChange={(e) => onChange(e.target.files)}
                    className="max-w-md"
                />
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
}

function ScaleField({
    id,
    question,
    value,
    onChange,
    disabled,
}: {
    id: string
    question: FormQuestion
    value: number
    onChange: (v: number) => void
    disabled?: boolean
}) {
    const min = question.config?.min ?? 1
    const max = question.config?.max ?? 5
    const points = []
    for (let i = min; i <= max; i += 1) points.push(i)
    return (
        <div className="flex items-end gap-3" id={id}>
            {question.config?.minLabel && <span className="text-xs text-muted-foreground pb-2">{question.config.minLabel}</span>}
            <div className="flex gap-3">
                {points.map((p) => (
                    <label key={p} className="flex flex-col items-center gap-1 cursor-pointer text-sm">
                        <span>{p}</span>
                        <input
                            type="radio"
                            name={id}
                            checked={value === p}
                            disabled={disabled}
                            onChange={() => onChange(p)}
                            className="h-4 w-4 accent-primary"
                        />
                    </label>
                ))}
            </div>
            {question.config?.maxLabel && <span className="text-xs text-muted-foreground pb-2">{question.config.maxLabel}</span>}
        </div>
    )
}
