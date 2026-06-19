"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Lightweight, dependency-free radio group (native inputs) styled to match the
// shadcn design system. Used by the public form renderer for MULTIPLE_CHOICE.

interface RadioGroupProps {
    value?: string
    onValueChange?: (value: string) => void
    name: string
    className?: string
    children: React.ReactNode
}

const RadioGroupContext = React.createContext<{
    value?: string
    onValueChange?: (value: string) => void
    name: string
} | null>(null)

export function RadioGroup({ value, onValueChange, name, className, children }: RadioGroupProps) {
    return (
        <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
            <div role="radiogroup" className={cn("grid gap-2", className)}>
                {children}
            </div>
        </RadioGroupContext.Provider>
    )
}

interface RadioGroupItemProps {
    value: string
    id?: string
    disabled?: boolean
}

export function RadioGroupItem({ value, id, disabled }: RadioGroupItemProps) {
    const ctx = React.useContext(RadioGroupContext)
    if (!ctx) throw new Error("RadioGroupItem must be used within RadioGroup")
    return (
        <input
            type="radio"
            id={id}
            name={ctx.name}
            value={value}
            checked={ctx.value === value}
            disabled={disabled}
            onChange={() => ctx.onValueChange?.(value)}
            className="h-4 w-4 shrink-0 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
    )
}
