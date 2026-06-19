"use client"

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GripVertical, Plus } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import type { Form, FormQuestion, QuestionType } from "@/types"
import { QuestionEditor } from "./question-editor"
import {
    QUESTION_TYPE_META,
    defaultOptionsFor,
    defaultConfigFor,
} from "./question-type-meta"

export function FormBuilder({ form }: { form: Form }) {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const questions = form.questions || []

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["form", form.id] })

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = questions.findIndex((q) => q.id === active.id)
            const newIndex = questions.findIndex((q) => q.id === over.id)
            const reordered = arrayMove(questions, oldIndex, newIndex)
            try {
                await api.patch(`/forms/${form.id}/questions/reorder`, { questionIds: reordered.map((q) => q.id) })
                invalidate()
            } catch {
                toast({ variant: "destructive", title: "Failed to reorder" })
            }
        }
    }

    const addQuestion = async (type: QuestionType) => {
        try {
            await api.post(`/forms/${form.id}/questions`, {
                type,
                title: "",
                isRequired: false,
                options: defaultOptionsFor(type),
                config: defaultConfigFor(type),
            })
            invalidate()
        } catch (e: any) {
            toast({ variant: "destructive", title: "Failed to add question", description: e.response?.data?.error?.message })
        }
    }

    const inputTypes = (Object.keys(QUESTION_TYPE_META) as QuestionType[]).filter(
        (t) => QUESTION_TYPE_META[t].group === "input"
    )
    const displayTypes = (Object.keys(QUESTION_TYPE_META) as QuestionType[]).filter(
        (t) => QUESTION_TYPE_META[t].group === "display"
    )

    const AddMenu = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="w-full"><Plus className="mr-2 h-4 w-4" /> Add item</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Question</DropdownMenuLabel>
                {inputTypes.map((t) => {
                    const Icon = QUESTION_TYPE_META[t].icon
                    return (
                        <DropdownMenuItem key={t} onClick={() => addQuestion(t)}>
                            <Icon className="mr-2 h-4 w-4" /> {QUESTION_TYPE_META[t].label}
                        </DropdownMenuItem>
                    )
                })}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Layout</DropdownMenuLabel>
                {displayTypes.map((t) => {
                    const Icon = QUESTION_TYPE_META[t].icon
                    return (
                        <DropdownMenuItem key={t} onClick={() => addQuestion(t)}>
                            <Icon className="mr-2 h-4 w-4" /> {QUESTION_TYPE_META[t].label}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <div className="max-w-3xl space-y-4">
            {AddMenu}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-3 list-none p-0 m-0">
                        {questions.map((q) => (
                            <SortableQuestion key={q.id} question={q} formId={form.id} onChange={invalidate} />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>

            {!questions.length && (
                <div className="text-center py-10 text-muted-foreground border-dashed border-2 rounded-lg">
                    No questions yet. Click &ldquo;Add item&rdquo; to build your form.
                </div>
            )}
        </div>
    )
}

function SortableQuestion({
    question,
    formId,
    onChange,
}: {
    question: FormQuestion
    formId: string
    onChange: () => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id })
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }

    return (
        <li ref={setNodeRef} style={style} className="bg-card border rounded-lg shadow-sm">
            <div className="flex items-start gap-2 p-3">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="mt-1 cursor-grab text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    aria-label="Reorder question"
                >
                    <GripVertical className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="flex-1 min-w-0">
                    <QuestionEditor question={question} formId={formId} onChange={onChange} />
                </div>
            </div>
        </li>
    )
}
