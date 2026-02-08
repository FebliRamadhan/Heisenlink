"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Download, Copy, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"

interface QRCodeModalProps {
    open: boolean
    onClose: () => void
    linkId: string
    linkCode: string
    shortUrl: string
}

const SIZE_OPTIONS = [
    { value: "200", label: "Small (200px)" },
    { value: "300", label: "Medium (300px)" },
    { value: "400", label: "Large (400px)" },
    { value: "500", label: "Extra Large (500px)" },
]

export function QRCodeModal({
    open,
    onClose,
    linkId,
    linkCode,
    shortUrl,
}: QRCodeModalProps) {
    const { toast } = useToast()
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [size, setSize] = useState("300")

    useEffect(() => {
        if (open && linkId) {
            fetchQRCode()
        }
    }, [open, linkId, size])

    const fetchQRCode = async () => {
        setLoading(true)
        try {
            const res = await api.get(`/links/${linkId}/qr`, {
                params: { format: "dataurl", size },
            })
            setQrDataUrl(res.data.data.qrCode)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error loading QR code",
            })
        } finally {
            setLoading(false)
        }
    }

    const downloadQR = async (format: "png" | "svg") => {
        try {
            if (format === "png") {
                const res = await api.get(`/links/${linkId}/qr`, {
                    params: { format: "dataurl", size },
                })
                const link = document.createElement("a")
                link.href = res.data.data.qrCode
                link.download = `${linkCode}-qr.png`
                link.click()
            } else {
                const res = await api.get(`/links/${linkId}/qr`, {
                    params: { format: "svg" },
                    responseType: "text",
                })
                const blob = new Blob([res.data], { type: "image/svg+xml" })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = `${linkCode}-qr.svg`
                link.click()
                URL.revokeObjectURL(url)
            }
            toast({ description: `QR code downloaded as ${format.toUpperCase()}` })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error downloading QR code",
            })
        }
    }

    const copyQRToClipboard = async () => {
        if (!qrDataUrl) return
        try {
            // Convert data URL to blob
            const res = await fetch(qrDataUrl)
            const blob = await res.blob()
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ])
            toast({ description: "QR code copied to clipboard" })
        } catch (error) {
            // Fallback: copy the short URL instead
            navigator.clipboard.writeText(shortUrl)
            toast({ description: "Short URL copied to clipboard" })
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code</DialogTitle>
                    <DialogDescription className="break-all">
                        {shortUrl}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-4">
                    {/* QR Code Preview */}
                    <div className="relative flex items-center justify-center w-full aspect-square max-w-[300px] rounded-lg bg-white p-4 border">
                        {loading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt={`QR code for ${linkCode}`}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <span className="text-muted-foreground">Failed to load</span>
                        )}
                    </div>

                    {/* Size Selector */}
                    <div className="flex items-center space-x-2 w-full">
                        <Label htmlFor="size" className="shrink-0">
                            Size:
                        </Label>
                        <Select value={size} onValueChange={setSize}>
                            <SelectTrigger id="size" className="flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SIZE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 w-full justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadQR("png")}
                            disabled={loading}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            PNG
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadQR("svg")}
                            disabled={loading}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            SVG
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyQRToClipboard}
                            disabled={loading || !qrDataUrl}
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
