import { Source_Serif_4, Hanken_Grotesk } from "next/font/google"
import { cn } from "@/lib/utils"

// Display / UI fonts for the public form theme (design/ handoff).
const fontSerif = Source_Serif_4({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    style: ["normal", "italic"],
    variable: "--font-serif",
})

const fontUi = Hanken_Grotesk({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-ui",
})

export default function PublicFormLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={cn("form-theme form-app-bg", fontSerif.variable, fontUi.variable)}>
            {children}
        </div>
    )
}
