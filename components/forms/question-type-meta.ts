import type { QuestionType } from "@/types"
import {
    Type,
    AlignLeft,
    CircleDot,
    CheckSquare,
    ChevronDownSquare,
    SlidersHorizontal,
    Calendar,
    Clock,
    Upload,
    Heading,
    Text,
    Image as ImageIcon,
    type LucideIcon,
} from "lucide-react"

export const QUESTION_TYPE_META: Record<QuestionType, { label: string; icon: LucideIcon; group: "input" | "display" }> = {
    SHORT_TEXT: { label: "Short answer", icon: Type, group: "input" },
    LONG_TEXT: { label: "Paragraph", icon: AlignLeft, group: "input" },
    MULTIPLE_CHOICE: { label: "Multiple choice", icon: CircleDot, group: "input" },
    CHECKBOXES: { label: "Checkboxes", icon: CheckSquare, group: "input" },
    DROPDOWN: { label: "Dropdown", icon: ChevronDownSquare, group: "input" },
    LINEAR_SCALE: { label: "Linear scale", icon: SlidersHorizontal, group: "input" },
    DATE: { label: "Date", icon: Calendar, group: "input" },
    TIME: { label: "Time", icon: Clock, group: "input" },
    FILE_UPLOAD: { label: "File upload", icon: Upload, group: "input" },
    SECTION: { label: "Section break", icon: Heading, group: "display" },
    STATEMENT: { label: "Text / description", icon: Text, group: "display" },
    IMAGE: { label: "Image", icon: ImageIcon, group: "display" },
}

export const CHOICE_TYPES: QuestionType[] = ["MULTIPLE_CHOICE", "CHECKBOXES", "DROPDOWN"]
export const DISPLAY_TYPES: QuestionType[] = ["SECTION", "STATEMENT", "IMAGE"]

export const isChoiceType = (t: QuestionType) => CHOICE_TYPES.includes(t)
export const isDisplayType = (t: QuestionType) => DISPLAY_TYPES.includes(t)

export const defaultOptionsFor = (t: QuestionType) =>
    isChoiceType(t) ? [{ id: `opt-${Date.now().toString(36)}`, label: "Option 1" }] : undefined

export const defaultConfigFor = (t: QuestionType) => {
    if (t === "LINEAR_SCALE") return { min: 1, max: 5 }
    if (t === "FILE_UPLOAD") return { maxFiles: 1, maxSizeMb: 5 }
    return undefined
}
