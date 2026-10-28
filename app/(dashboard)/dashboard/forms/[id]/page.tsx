"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger, tabUnderline as TAB } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, ExternalLink, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { FormBuilder } from "@/components/forms/form-builder";
import { FormSettings } from "@/components/forms/form-settings";
import { FormPreview } from "@/components/forms/form-preview";
import { ShareFormDialog } from "@/components/forms/share-form-dialog";
import type { Form } from "@/types";

export default function FormEditorPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const tab = searchParams.get("tab") || "questions";

  const {
    data: form,
    isLoading,
    isError,
  } = useQuery<Form>({
    queryKey: ["form", id],
    queryFn: async () => {
      const res = await api.get(`/forms/${id}`);
      return res.data.data;
    },
  });

  const [title, setTitle] = useState("");
  useEffect(() => {
    if (form) setTitle(form.title);
  }, [form]);

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<Form>) => {
      const res = await api.patch(`/forms/${id}`, patch);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["form", id] }),
    onError: (e: any) =>
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: e.response?.data?.error?.message,
      }),
  });

  const setTab = (next: string) =>
    router.replace(`/dashboard/forms/${id}?tab=${next}`);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-muted-foreground">Form not found.</p>
        <Link href="/dashboard/forms" className="text-primary hover:underline">
          Back to forms
        </Link>
      </div>
    );
  }

  const togglePublish = (checked: boolean) =>
    updateMutation.mutate({ isPublished: checked });

  const isOwner = form.isOwner ?? true;
  const canEdit = form.myRole !== "VIEWER";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/forms" aria-label="Back to forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() =>
            canEdit && title !== form.title && updateMutation.mutate({ title })
          }
          readOnly={!canEdit}
          className="h-10 min-w-[200px] max-w-xl flex-1 border-transparent px-2 text-xl font-semibold shadow-none hover:border-input focus-visible:border-input"
          aria-label="Form title"
        />
        {!isOwner && (
          <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            Shared with you, {canEdit ? "editor" : "viewer"}
          </span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canEdit && (
            <label className="mr-2 flex items-center gap-2 text-sm">
              <Switch
                checked={form.isPublished}
                onCheckedChange={togglePublish}
              />
              <span className="w-16">{form.isPublished ? "Published" : "Draft"}</span>
            </label>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(form.url);
              toast({ description: "Link copied" });
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy link
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={form.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> View
            </a>
          </Button>
          {isOwner && <ShareFormDialog formId={id} />}
        </div>
      </div>

      {canEdit ? (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-end gap-1 border-b">
            <TabsList className="h-auto gap-1 rounded-none bg-transparent p-0">
              <TabsTrigger value="questions" className={TAB}>Questions</TabsTrigger>
              <TabsTrigger value="settings" className={TAB}>Settings</TabsTrigger>
              <TabsTrigger value="preview" className={TAB}>Preview</TabsTrigger>
            </TabsList>
            <SectionLinks id={id} responseCount={form.responseCount} />
          </div>

          <TabsContent value="questions" className="mt-6">
            <FormBuilder form={form} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6 max-w-2xl">
            <FormSettings form={form} />
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <FormPreview form={form} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-1 border-b">
            <SectionLinks id={id} responseCount={form.responseCount} />
          </div>
          <p className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            You have view-only access to this form. You can see its questions and
            responses but cannot make changes.
          </p>
          <FormPreview form={form} />
        </div>
      )}
    </div>
  );
}


function SectionLinks({ id, responseCount }: { id: string; responseCount: number }) {
  return (
    <>
      <Link href={`/dashboard/forms/${id}/responses`} className={`inline-flex items-center rounded-sm ${TAB} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
        Responses
        <span className="ml-2 rounded-full bg-muted px-1.5 text-xs tabular-nums text-foreground">{responseCount.toLocaleString("id-ID")}</span>
      </Link>
      <Link href={`/dashboard/forms/${id}/dashboards`} className={`inline-flex items-center rounded-sm ${TAB} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
        Dashboards
      </Link>
    </>
  );
}
