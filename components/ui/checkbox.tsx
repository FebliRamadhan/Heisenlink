"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Lightweight, dependency-free checkbox (native input) styled to match the
// shadcn design system. Used by the public form renderer for CHECKBOXES.

interface CheckboxProps {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    id?: string
    disabled?: boolean
    className?: string
}

export function Checkbox({ checked, onCheckedChange, id, disabled, className }: CheckboxProps) {
    return (
        <input
            type="checkbox"
            id={id}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            className={cn(
                "h-4 w-4 shrink-0 cursor-pointer rounded accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
        />
    )
}
