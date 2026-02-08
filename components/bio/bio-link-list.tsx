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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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

            // Optimistic update?
            // For now just wait for API
            // Actually we need to call reorder API

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
                    {links.map((link) => (
                        <SortableLinkItem key={link.id} link={link} />
                    ))}
                    {!links.length && (
                        <div className="text-center py-8 text-muted-foreground border-dashed border-2 rounded-lg">
                            No links yet. Click "Add Link" to get started.
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

    const handleDelete = async () => {
        try {
            await api.delete(`/bio/links/${link.id}`)
            queryClient.invalidateQueries({ queryKey: ["bio"] })
            toast({ title: "Link removed" })
        } catch (e) {
            toast({ title: "Failed to delete", variant: "destructive" })
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
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-card border p-3 rounded-lg shadow-sm">
            <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{link.title}</div>
                <div className="text-xs text-muted-foreground truncate">{link.url}</div>
            </div>
            <div className="flex items-center gap-2">
                <Switch checked={link.isVisible} onCheckedChange={toggleVisibility} />
                <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        </div>
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
                    <Plus className="mr-2 h-4 w-4" /> Add Link
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Link</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="My Portfolio"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Add Link"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
