import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams } from "wouter";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Layout, SectionHeader, SearchBar, EmptyState } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useVideoLessons, useCreateVideoLesson, useUpdateVideoLesson, useDeleteVideoLesson,
  useSubjects, useClassLevels, useSeries, type VideoLesson,
} from "@/hooks/use-admin";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.string().min(1, "Duration is required"),
  video_url: z.string().url("Must be a valid URL"),
  video_type: z.enum(["youtube", "direct"]),
  chapter_number: z.coerce.number().int().min(1),
});

type FormValues = z.infer<typeof schema>;

function VideoForm({
  open, onClose, existing, subjectId,
}: {
  open: boolean;
  onClose: () => void;
  existing?: VideoLesson;
  subjectId: string;
}) {
  const { toast } = useToast();
  const create = useCreateVideoLesson();
  const update = useUpdateVideoLesson();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? { title: existing.title, description: existing.description, duration: existing.duration, video_url: existing.video_url, video_type: existing.video_type, chapter_number: existing.chapter_number }
      : { title: "", description: "", duration: "", video_url: "", video_type: "youtube", chapter_number: 1 },
  });

  const onSubmit = (values: FormValues) => {
    if (existing) {
      update.mutate({ id: existing.id, ...values }, {
        onSuccess: () => { toast({ title: "Video updated" }); onClose(); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      });
    } else {
      create.mutate({ ...values, subject_id: subjectId }, {
        onSuccess: () => { toast({ title: "Video created" }); onClose(); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Video" : "New Video Lesson"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input data-testid="input-title" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input data-testid="input-description" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="duration" render={({ field }) => (
                <FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="12:30" data-testid="input-duration" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="chapter_number" render={({ field }) => (
                <FormItem><FormLabel>Chapter #</FormLabel><FormControl><Input type="number" data-testid="input-chapter" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="video_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Video Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger data-testid="select-video-type">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="direct">Direct URL</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="video_url" render={({ field }) => (
              <FormItem><FormLabel>Video URL</FormLabel><FormControl><Input placeholder="https://..." data-testid="input-video-url" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" data-testid="button-submit" disabled={create.isPending || update.isPending}>
                {existing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function VideosPage() {
  const params = useParams<{ subjectId: string }>();
  const subjectId = params.subjectId;
  const { data: videos, isLoading } = useVideoLessons(subjectId);
  const { data: allSubjects } = useSubjects();
  const { data: allClasses } = useClassLevels();
  const { data: allSeries } = useSeries();
  const subject = allSubjects?.find((s) => s.id === subjectId);
  const classLevel = allClasses?.find((c) => c.id === subject?.class_id);
  const series = allSeries?.find((s) => s.id === classLevel?.series_id);
  const deleteVideo = useDeleteVideoLesson();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VideoLesson | undefined>();
  const [deleting, setDeleting] = useState<VideoLesson | undefined>();

  const filtered = (videos ?? []).filter(
    (v) => v.title.toLowerCase().includes(search.toLowerCase()) || v.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!deleting) return;
    deleteVideo.mutate({ id: deleting.id, subject_id: subjectId }, {
      onSuccess: () => { toast({ title: "Video deleted" }); setDeleting(undefined); },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <Layout breadcrumbs={[
      { label: "Series", href: "/series" },
      { label: series?.title ?? "Series", href: `/series/${classLevel?.series_id}/classes` },
      { label: classLevel?.title ?? "Class", href: `/classes/${classLevel?.id}/subjects` },
      { label: subject?.title ?? subjectId, href: `/classes/${subject?.class_id}/subjects` },
      { label: "Videos" },
    ]}>
      <SectionHeader
        title={`Videos — ${subject?.title ?? "..."}`}
        description="Manage video lessons in this subject"
        action={
          <Button data-testid="button-add-video" onClick={() => { setEditing(undefined); setDialogOpen(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Video
          </Button>
        }
      />

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search videos..." />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No videos found. Add the first video lesson." />
      ) : (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Chapter</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Duration</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors" data-testid={`row-video-${v.id}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{v.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{v.description}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{v.chapter_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.duration}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs capitalize">{v.video_type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <a href={v.video_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-open-video-${v.id}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                      <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-edit-video-${v.id}`} onClick={() => { setEditing(v); setDialogOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" data-testid={`button-delete-video-${v.id}`} onClick={() => setDeleting(v)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VideoForm open={dialogOpen} onClose={() => setDialogOpen(false)} existing={editing} subjectId={subjectId} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleting?.title}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
