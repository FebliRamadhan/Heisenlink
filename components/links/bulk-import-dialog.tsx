"use client"

import { useState, useRef, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react"

interface ParsedLink {
    url: string
    alias?: string
}

interface BulkResult {
    created: any[]
    failed: { url: string; alias?: string; error: string }[]
}

type Step = "upload" | "preview" | "result"

export function BulkImportDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<Step>("upload")
    const [parsedLinks, setParsedLinks] = useState<ParsedLink[]>([])
    const [parseErrors, setParseErrors] = useState<string[]>([])
    const [result, setResult] = useState<BulkResult | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const resetState = useCallback(() => {
        setStep("upload")
        setParsedLinks([])
        setParseErrors([])
        setResult(null)
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }, [])

    const downloadTemplate = () => {
        const csv = "url,alias\nhttps://example.com,my-link\nhttps://google.com,\n"
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "heisenlink-bulk-template.csv"
        a.click()
        URL.revokeObjectURL(url)
    }

    const parseCSV = (text: string): { links: ParsedLink[]; errors: string[] } => {
        const lines = text.trim().split("\n")
        const links: ParsedLink[] = []
        const errors: string[] = []

        if (lines.length < 2) {
            errors.push("CSV must have a header row and at least one data row")
            return { links, errors }
        }

        // Parse header
        const header = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""))
        const urlIdx = header.indexOf("url")

        if (urlIdx === -1) {
            errors.push("CSV must have a 'url' column")
            return { links, errors }
        }

        const aliasIdx = header.indexOf("alias")

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            // Skip empty lines, whitespace-only lines, and comma-only lines
            if (!line || /^[,\s]*$/.test(line)) continue

            const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""))
            const url = cols[urlIdx]

            if (!url) {
                errors.push(`Row ${i + 1}: URL is empty`)
                continue
            }

            try {
                new URL(url)
            } catch {
                errors.push(`Row ${i + 1}: Invalid URL "${url}"`)
                continue
            }

            const alias = aliasIdx !== -1 ? cols[aliasIdx] || undefined : undefined
            links.push({ url, alias: alias || undefined })
        }

        if (links.length > 100) {
            errors.push(`Too many links (${links.length}). Maximum is 100 per import.`)
            return { links: links.slice(0, 100), errors }
        }

        return { links, errors }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith(".csv")) {
            toast({ title: "Invalid file", description: "Please select a CSV file", variant: "destructive" })
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            const { links, errors } = parseCSV(text)
            setParsedLinks(links)
            setParseErrors(errors)

            if (links.length > 0) {
                setStep("preview")
            } else {
                toast({
                    title: "No valid links found",
                    description: errors[0] || "Please check your CSV format",
                    variant: "destructive",
                })
            }
        }
        reader.readAsText(file)
    }

    const handleSubmit = async () => {
        setIsUploading(true)
        try {
            const res = await api.post("/links/bulk", { links: parsedLinks })
            setResult(res.data.data)
            setStep("result")
            // Clean up parsed data and file input after successful import
            setParsedLinks([])
            setParseErrors([])
            if (fileInputRef.current) fileInputRef.current.value = ""
            queryClient.invalidateQueries({ queryKey: ["links"] })
        } catch (error: any) {
            toast({
                title: "Import failed",
                description: error.response?.data?.message || "Failed to create links",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleClose = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) resetState()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Bulk Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                {step === "upload" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Bulk Import Links</DialogTitle>
                            <DialogDescription>
                                Upload a CSV file to create multiple short links at once. Maximum 100 links per import.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Button variant="outline" className="w-full" onClick={downloadTemplate}>
                                <Download className="mr-2 h-4 w-4" /> Download CSV Template
                            </Button>
                            <div className="relative">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <Button
                                    variant="secondary"
                                    className="w-full h-24 border-2 border-dashed"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Click to select CSV file</span>
                                    </div>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                CSV columns: <code className="bg-muted px-1 rounded">url</code> (required), <code className="bg-muted px-1 rounded">alias</code> (optional)
                            </p>
                        </div>
                    </>
                )}

                {step === "preview" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Preview Import</DialogTitle>
                            <DialogDescription>
                                {parsedLinks.length} link{parsedLinks.length !== 1 ? "s" : ""} ready to import
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                            {parseErrors.length > 0 && (
                                <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3 space-y-1">
                                    <div className="flex items-center gap-1 font-medium">
                                        <AlertCircle className="h-4 w-4" /> Warnings
                                    </div>
                                    {parseErrors.map((err, i) => (
                                        <p key={i} className="text-xs">{err}</p>
                                    ))}
                                </div>
                            )}
                            <div className="max-h-60 overflow-y-auto rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted sticky top-0">
                                        <tr>
                                            <th className="text-left px-3 py-2 font-medium">#</th>
                                            <th className="text-left px-3 py-2 font-medium">URL</th>
                                            <th className="text-left px-3 py-2 font-medium">Alias</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedLinks.map((link, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                                                <td className="px-3 py-2 truncate max-w-[200px]">{link.url}</td>
                                                <td className="px-3 py-2 text-muted-foreground">{link.alias || "auto"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={resetState}>Back</Button>
                            <Button onClick={handleSubmit} disabled={isUploading}>
                                {isUploading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                                ) : (
                                    <>Import {parsedLinks.length} Link{parsedLinks.length !== 1 ? "s" : ""}</>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === "result" && result && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Import Complete</DialogTitle>
                            <DialogDescription>
                                {result.created.length} created, {result.failed.length} failed
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                            {result.created.length > 0 && (
                                <div className="bg-green-500/10 text-green-700 dark:text-green-400 text-sm rounded-md p-3">
                                    <div className="flex items-center gap-1 font-medium mb-1">
                                        <CheckCircle2 className="h-4 w-4" /> {result.created.length} links created successfully
                                    </div>
                                </div>
                            )}
                            {result.failed.length > 0 && (
                                <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3 space-y-1">
                                    <div className="flex items-center gap-1 font-medium">
                                        <XCircle className="h-4 w-4" /> {result.failed.length} links failed
                                    </div>
                                    <div className="max-h-32 overflow-y-auto">
                                        {result.failed.map((f, i) => (
                                            <p key={i} className="text-xs">
                                                {f.url}{f.alias ? ` (${f.alias})` : ""}: {f.error}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={() => handleClose(false)}>Done</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
