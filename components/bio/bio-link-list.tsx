"use client"

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Trash, Plus } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

interface BioLinkListProps {
    links: any[]
}

export function BioLinkList({ links }: BioLinkListProps) {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = links.findIndex((item) => item.id === active.id);
            const newIndex = links.findIndex((item) => item.id === over?.id);

            const newItems = arrayMove(links, oldIndex, newIndex);

            try {
                await api.patch('/bio/links/reorder', {
                    linkIds: newItems.map(i => i.id)
                })
                queryClient.invalidateQueries({ queryKey: ["bio"] })
            } catch (error) {
                toast({ title: "Failed to reorder", variant: "destructive" })
            }
        }
    };

    return (
        <div className="space-y-4">
            <AddLinkDialog />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={links.map(l => l.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <ul className="space-y-3 list-none p-0 m-0">
                        {links.map((link) => (
                            <SortableLinkItem key={link.id} link={link} />
                        ))}
                    </ul>
                    {!links.length && (
                        <div className="text-center py-8 text-muted-foreground border-dashed border-2 rounded-lg">
                            No links yet. Click &ldquo;Add Link&rdquo; to get started.
                        </div>
                    )}
                </SortableContext>
            </DndContext>
        </div>
    );
}

function SortableLinkItem({ link }: { link: any }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: link.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleDelete = async () => {
        try {
            await api.delete(`/bio/links/${link.id}`)
            queryClient.invalidateQueries({ queryKey: ["bio"] })
            toast({
                title: "Link removed",
                description: `“${link.title}” was deleted.`,
                action: (
                    <ToastAction
                        altText="Undo deletion"
                        onClick={async () => {
                            try {
                                await api.post('/bio/links', { title: link.title, url: link.url })
                                queryClient.invalidateQueries({ queryKey: ["bio"] })
                            } catch {
                                toast({ title: "Failed to restore link", variant: "destructive" })
                            }
                        }}
                    >
                        Undo
                    </ToastAction>
                ),
            })
        } catch (e) {
            toast({ title: "Failed to delete", variant: "destructive" })
        } finally {
            setConfirmOpen(false)
        }
    }

    const toggleVisibility = async (checked: boolean) => {
        try {
            await api.patch(`/bio/links/${link.id}`, { isVisible: checked })
            queryClient.invalidateQueries({ queryKey: ["bio"] })
        } catch (e) {
            toast({ title: "Failed to update", variant: "destructive" })
        }
    }

    return (
        <li ref={setNodeRef} style={style} className="flex items-center gap-3 bg-card border p-3 rounded-lg shadow-sm">
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="cursor-grab text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                aria-label={`Reorder ${link.title}`}
            >
                <GripVertical className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{link.title}</div>
                <div className="text-xs text-muted-foreground truncate">{link.url}</div>
            </div>
            <div className="flex items-center gap-2">
                <Switch
                    checked={link.isVisible}
                    onCheckedChange={toggleVisibility}
                    aria-label={`Toggle visibility for ${link.title}`}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmOpen(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label={`Delete ${link.title}`}
                >
                    <Trash className="h-4 w-4" aria-hidden="true" />
                </Button>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this link?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &ldquo;{link.title}&rdquo; will be removed from your bio page. You can undo right after.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </li>
    );
}

function AddLinkDialog() {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [url, setUrl] = useState("")
    const [loading, setLoading] = useState(false)
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post('/bio/links', { title, url })
            queryClient.invalidateQueries({ queryKey: ["bio"] })
            toast({ title: "Link added" })
            setOpen(false)
            setTitle("")
            setUrl("")
        } catch (error) {
            toast({ title: "Failed to add link", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add Link
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Link</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="bio-link-title">Title</Label>
                        <Input
                            id="bio-link-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="My Portfolio"
                            required
                            autoComplete="off"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio-link-url">URL</Label>
                        <Input
                            id="bio-link-url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            required
                            autoComplete="off"
                            inputMode="url"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Adding…" : "Add Link"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
