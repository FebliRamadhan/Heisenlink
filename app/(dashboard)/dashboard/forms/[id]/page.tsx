"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  ExternalLink,
  BarChart2,
  Copy,
  LayoutDashboard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { FormBuilder } from "@/components/forms/form-builder";
import { FormSettings } from "@/components/forms/form-settings";
import { FormPreview } from "@/components/forms/form-preview";
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
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="flex-1 p-8 pt-6">
        <p className="text-muted-foreground">Form not found.</p>
        <Link href="/dashboard/forms" className="text-primary hover:underline">
          Back to forms
        </Link>
      </div>
    );
  }

  const togglePublish = (checked: boolean) =>
    updateMutation.mutate({ isPublished: checked });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/forms" aria-label="Back to forms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() =>
              title !== form.title && updateMutation.mutate({ title })
            }
            className="text-lg font-semibold border-0 shadow-none focus-visible:ring-1 px-1 max-w-md"
            aria-label="Form title"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={form.isPublished}
              onCheckedChange={togglePublish}
            />
            {form.isPublished ? "Published" : "Draft"}
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(form.url);
              toast({ description: "Link copied" });
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy link
          </Button>
          <a href={form.url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" /> View
            </Button>
          </a>
          <Link href={`/dashboard/forms/${id}/responses`}>
            <Button variant="outline" size="sm">
              <BarChart2 className="mr-2 h-4 w-4" /> Responses (
              {form.responseCount})
            </Button>
          </Link>
          <Link href={`/dashboard/forms/${id}/dashboards`}>
            <Button variant="outline" size="sm">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboards
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

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
    </div>
  );
}
