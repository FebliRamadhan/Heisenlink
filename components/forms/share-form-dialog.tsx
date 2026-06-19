"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Trash2 } from "lucide-react";
import type { FormCollaborator } from "@/types";

type AccessRole = "EDITOR" | "VIEWER";

function initials(email: string, name?: string | null) {
  const base = (name || email).trim();
  return base.slice(0, 2).toUpperCase();
}

export function ShareFormDialog({ formId }: { formId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AccessRole>("EDITOR");

  const { data: collaborators = [], isLoading } = useQuery<FormCollaborator[]>({
    queryKey: ["form-collaborators", formId],
    queryFn: async () => {
      const res = await api.get(`/forms/${formId}/collaborators`);
      return res.data.data;
    },
    enabled: open,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["form-collaborators", formId] });

  const addMutation = useMutation({
    mutationFn: async (payload: { email: string; role: AccessRole }) => {
      const res = await api.post(`/forms/${formId}/collaborators`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      setEmail("");
      invalidate();
      toast({ title: "Collaborator added" });
    },
    onError: (e: any) =>
      toast({
        variant: "destructive",
        title: "Failed to add collaborator",
        description: e.response?.data?.error?.message,
      }),
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/forms/${formId}/collaborators/${userId}`);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Collaborator removed" });
    },
    onError: () =>
      toast({ variant: "destructive", title: "Failed to remove collaborator" }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    addMutation.mutate({ email: trimmed, role });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share form</DialogTitle>
          <DialogDescription>
            Invite registered users by email to collaborate. Editors can edit
            this form; viewers can only see it and its responses.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as AccessRole)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EDITOR">Editor</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={addMutation.isPending}>
            Invite
          </Button>
        </form>

        <div className="mt-2 space-y-2">
          <p className="text-sm font-medium">People with access</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No collaborators yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {collaborators.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {initials(c.user.email, c.user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {c.user.displayName || c.user.username}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                      {c.role.toLowerCase()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      aria-label="Remove collaborator"
                      onClick={() => removeMutation.mutate(c.user.id)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
