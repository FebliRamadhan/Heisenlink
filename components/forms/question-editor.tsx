"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash, Plus, X } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import type { FormQuestion, QuestionType, QuestionOption } from "@/types"
import {
    QUESTION_TYPE_META,
    isChoiceType,
    isDisplayType,
    defaultOptionsFor,
    defaultConfigFor,
} from "./question-type-meta"

const ALL_TYPES = Object.keys(QUESTION_TYPE_META) as QuestionType[]

export function QuestionEditor({
    question,
    formId,
    onChange,
}: {
    question: FormQuestion
    formId: string
    onChange: () => void
}) {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const [local, setLocal] = useState<FormQuestion>(question)
    const [confirmDelete, setConfirmDelete] = useState(false)

    useEffect(() => setLocal(question), [question])

    const patch = async (data: Partial<FormQuestion>) => {
        try {
            await api.patch(`/forms/${formId}/questions/${question.id}`, data)
            onChange()
        } catch (e: any) {
            toast({ variant: "destructive", title: "Failed to save question", description: e.response?.data?.error?.message })
        }
    }

    const remove = async () => {
        try {
            await api.delete(`/forms/${formId}/questions/${question.id}`)
            queryClient.invalidateQueries({ queryKey: ["form", formId] })
        } catch {
            toast({ variant: "destructive", title: "Failed to delete" })
        } finally {
            setConfirmDelete(false)
        }
    }

    const changeType = (type: QuestionType) => {
        const next: Partial<FormQuestion> = { type }
        if (isChoiceType(type) && !local.options?.length) next.options = defaultOptionsFor(type)
        next.config = defaultConfigFor(type) ?? null
        setLocal({ ...local, ...next } as FormQuestion)
        patch(next)
    }

    const display = isDisplayType(local.type)
    const titlePlaceholder =
        local.type === "STATEMENT" ? "Description text"
        : local.type === "SECTION" ? "Section title"
        : local.type === "IMAGE" ? "Caption (optional)"
        : "Question"

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
                <Input
                    value={local.title}
                    onChange={(e) => setLocal({ ...local, title: e.target.value })}
                    onBlur={() => local.title !== question.title && patch({ title: local.title })}
                    placeholder={titlePlaceholder}
                    className="flex-1"
                    aria-label="Question title"
                />
                <Select value={local.type} onValueChange={(v) => changeType(v as QuestionType)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ALL_TYPES.map((t) => {
                            const Icon = QUESTION_TYPE_META[t].icon
                            return (
                                <SelectItem key={t} value={t}>
                                    <span className="flex items-center"><Icon className="mr-2 h-4 w-4" /> {QUESTION_TYPE_META[t].label}</span>
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
            </div>

            {/* Optional description for input questions */}
            {!display && (
                <Input
                    value={local.description || ""}
                    onChange={(e) => setLocal({ ...local, description: e.target.value })}
                    onBlur={() => (local.description || "") !== (question.description || "") && patch({ description: local.description || null })}
                    placeholder="Help text (optional)"
                    className="text-sm"
                    aria-label="Help text"
                />
            )}

            {/* Type-specific editors */}
            {isChoiceType(local.type) && (
                <OptionsEditor
                    options={local.options || []}
                    onSave={(options) => { setLocal({ ...local, options }); patch({ options }) }}
                />
            )}

            {local.type === "LINEAR_SCALE" && (
                <ScaleEditor
                    config={local.config || { min: 1, max: 5 }}
                    onSave={(config) => { setLocal({ ...local, config }); patch({ config }) }}
                />
            )}

            {local.type === "FILE_UPLOAD" && (
                <FileConfigEditor
                    config={local.config || { maxFiles: 1, maxSizeMb: 5 }}
                    onSave={(config) => { setLocal({ ...local, config }); patch({ config }) }}
                />
            )}

            {local.type === "IMAGE" && (
                <ImageEditor
                    formId={formId}
                    config={local.config || {}}
                    onSave={(config) => { setLocal({ ...local, config }); patch({ config }) }}
                />
            )}

            {/* Footer: required toggle (input only) + delete */}
            <div className="flex items-center justify-between border-t pt-3">
                {!display ? (
                    <label className="flex items-center gap-2 text-sm">
                        <Switch
                            checked={local.isRequired}
                            onCheckedChange={(checked) => { setLocal({ ...local, isRequired: checked }); patch({ isRequired: checked }) }}
                        />
                        Required
                    </label>
                ) : <span className="text-xs text-muted-foreground">Display-only — not answered</span>}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDelete(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label="Delete question"
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </div>

            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                        <AlertDialogDescription>This question and its collected answers will be removed.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function OptionsEditor({ options, onSave }: { options: QuestionOption[]; onSave: (o: QuestionOption[]) => void }) {
    const [items, setItems] = useState<QuestionOption[]>(options)
    useEffect(() => setItems(options), [options])

    const update = (idx: number, label: string) => {
        const next = items.map((o, i) => (i === idx ? { ...o, label } : o))
        setItems(next)
    }
    const commit = () => onSave(items)
    const add = () => {
        const next = [...items, { id: `opt-${Date.now().toString(36)}-${items.length}`, label: `Option ${items.length + 1}` }]
        setItems(next)
        onSave(next)
    }
    const remove = (idx: number) => {
        const next = items.filter((_, i) => i !== idx)
        setItems(next)
        onSave(next)
    }

    return (
        <div className="space-y-2">
            {items.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                    <Input
                        value={opt.label}
                        onChange={(e) => update(idx, e.target.value)}
                        onBlur={commit}
                        className="flex-1"
                        aria-label={`Option ${idx + 1}`}
                    />
                    <Button variant="ghost" size="icon" onClick={() => remove(idx)} aria-label="Remove option" disabled={items.length <= 1}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={add}><Plus className="mr-2 h-4 w-4" /> Add option</Button>
        </div>
    )
}

function ScaleEditor({ config, onSave }: { config: NonNullable<FormQuestion["config"]>; onSave: (c: any) => void }) {
    const [c, setC] = useState(config)
    useEffect(() => setC(config), [config])
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <Label className="text-xs">Min</Label>
                <Input type="number" value={c.min ?? 1} onChange={(e) => setC({ ...c, min: Number(e.target.value) })} onBlur={() => onSave(c)} />
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Max</Label>
                <Input type="number" value={c.max ?? 5} onChange={(e) => setC({ ...c, max: Number(e.target.value) })} onBlur={() => onSave(c)} />
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Min label</Label>
                <Input value={c.minLabel || ""} onChange={(e) => setC({ ...c, minLabel: e.target.value })} onBlur={() => onSave(c)} placeholder="e.g. Poor" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Max label</Label>
                <Input value={c.maxLabel || ""} onChange={(e) => setC({ ...c, maxLabel: e.target.value })} onBlur={() => onSave(c)} placeholder="e.g. Excellent" />
            </div>
        </div>
    )
}

function ImageEditor({
    formId,
    config,
    onSave,
}: {
    formId: string
    config: NonNullable<FormQuestion["config"]>
    onSave: (c: any) => void
}) {
    const { toast } = useToast()
    const [uploading, setUploading] = useState(false)
    const [alt, setAlt] = useState(config.alt || "")

    const handleFile = async (file: File | undefined) => {
        if (!file) return
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append("image", file)
            const res = await api.post(`/forms/${formId}/image`, fd)
            onSave({ ...config, imageUrl: res.data.data.url, alt })
            toast({ title: "Image uploaded" })
        } catch (e: any) {
            toast({ variant: "destructive", title: "Upload failed", description: e.response?.data?.error?.message })
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-3">
            {config.imageUrl ? (
                <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={config.imageUrl} alt={config.alt || "preview"} className="max-h-48 rounded-md border" />
                </div>
            ) : (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No image yet</div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
                <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    className="max-w-xs"
                    aria-label="Upload image"
                />
                <Input
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    onBlur={() => onSave({ ...config, alt })}
                    placeholder="Alt text (accessibility)"
                    className="flex-1"
                    aria-label="Image alt text"
                />
            </div>
            {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
        </div>
    )
}

function FileConfigEditor({ config, onSave }: { config: NonNullable<FormQuestion["config"]>; onSave: (c: any) => void }) {
    const [c, setC] = useState(config)
    useEffect(() => setC(config), [config])
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <Label className="text-xs">Max files</Label>
                <Input type="number" min={1} max={10} value={c.maxFiles ?? 1} onChange={(e) => setC({ ...c, maxFiles: Number(e.target.value) })} onBlur={() => onSave(c)} />
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Max size (MB)</Label>
                <Input type="number" min={1} value={c.maxSizeMb ?? 5} onChange={(e) => setC({ ...c, maxSizeMb: Number(e.target.value) })} onBlur={() => onSave(c)} />
            </div>
        </div>
    )
}
