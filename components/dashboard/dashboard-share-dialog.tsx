"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check, Lock } from "lucide-react";
import type { Dashboard, DashboardVisibility } from "@/types";

interface ShareDialogProps {
  dashboard: Dashboard;
  publicUrl: string;
  onUpdate: (patch: {
    isPublished?: boolean;
    visibility?: DashboardVisibility;
  }) => void;
  onSetPassword: (password: string | null) => void;
}

export const DashboardShareDialog = ({
  dashboard,
  publicUrl,
  onUpdate,
  onSetPassword,
}: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!dashboard.isPublished) return;
    let active = true;
    import("qrcode")
      .then((QR) => QR.toDataURL(publicUrl, { width: 180, margin: 1 }))
      .then((url) => active && setQr(url))
      .catch(() => active && setQr(null));
    return () => {
      active = false;
    };
  }, [publicUrl, dashboard.isPublished]);

  const copy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share dashboard</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Published</Label>
              <p className="text-xs text-muted-foreground">
                Make this dashboard accessible via its link.
              </p>
            </div>
            <Switch
              checked={dashboard.isPublished}
              onCheckedChange={(c) =>
                onUpdate({
                  isPublished: c,
                  visibility:
                    c && dashboard.visibility === "PRIVATE"
                      ? "LINK"
                      : undefined,
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Who can view</Label>
            <Select
              value={dashboard.visibility}
              onValueChange={(v) =>
                onUpdate({ visibility: v as DashboardVisibility })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Private (only me)</SelectItem>
                <SelectItem value="LINK">Anyone with the link</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs">
              <Lock className="h-3 w-3" /> Password protection
            </Label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder={
                  dashboard.hasPassword ? "••••••••" : "Set a password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  onSetPassword(password || null);
                  setPassword("");
                }}
              >
                {password ? "Set" : dashboard.hasPassword ? "Clear" : "Set"}
              </Button>
            </div>
          </div>

          {dashboard.isPublished && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex gap-2">
                <Input readOnly value={publicUrl} className="text-xs" />
                <Button variant="outline" size="icon" onClick={copy}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {qr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qr}
                  alt="Dashboard QR code"
                  className="mx-auto h-44 w-44"
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
