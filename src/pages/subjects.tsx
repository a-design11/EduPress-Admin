import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useParams } from "wouter";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Layout, SectionHeader, SearchBar, EmptyState } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject,
  useClassLevels, useSeries, type Subject,
} from "@/hooks/use-admin";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
  video_count: z.coerce.number().int().min(0),
  worksheet_count: z.coerce.number().int().min(0),
  series_id: z.string().min(1, "Series is required"),
});

type FormValues = z.infer<typeof schema>;

function SubjectForm({
  open, onClose, existing, classId,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Subject;
  classId: string;
}) {
  const { toast } = useToast();
  const create = useCreateSubject();
  const update = useUpdateSubject();
  const { data: classes } = useClassLevels();
  const classLevel = classes?.find((c) => c.id === classId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? { title: existing.title, description: existing.description, icon: existing.icon, color: existing.color, video_count: existing.video_count, worksheet_count: existing.worksheet_count, series_id: existing.series_id }
      : { title: "", description: "", icon: "book", color: "#8B5CF6", video_count: 0, worksheet_count: 0, series_id: classLevel?.series_id ?? "" },
  });

  const onSubmit = (values: FormValues) => {
    if (existing) {
      update.mutate({ id: existing.id, ...values }, {
        onSuccess: () => { toast({ title: "Subject updated" }); onClose(); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      });
    } else {
      create.mutate({ ...values, class_id: classId }, {
        onSuccess: () => { toast({ title: "Subject created" }); onClose(); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Subject" : "New Subject"}</DialogTitle>
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
              <FormField control={form.control} name="icon" render={({ field }) => (
                <FormItem><FormLabel>Icon</FormLabel><FormControl><Input placeholder="e.g. book" data-testid="input-icon" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem><FormLabel>Color</FormLabel><FormControl><Input type="color" data-testid="input-color" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="video_count" render={({ field }) => (
                <FormItem><FormLabel>Video Count</FormLabel><FormControl><Input type="number" data-testid="input-video-count" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="worksheet_count" render={({ field }) => (
                <FormItem><FormLabel>Worksheet Count</FormLabel><FormControl><Input type="number" data-testid="input-worksheet-count" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="series_id" render={({ field }) => (
              <FormItem><FormLabel>Series ID</FormLabel><FormControl><Input placeholder="e.g. s1" data-testid="input-series-id" {...field} /></FormControl><FormMessage /></FormItem>
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

export default function SubjectsPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;
  const { data: subjects, isLoading } = useSubjects(classId);
  const { data: allClasses } = useClassLevels();
  const { data: allSeries } = useSeries();
  const classLevel = allClasses?.find((c) => c.id === classId);
  const series = allSeries?.find((s) => s.id === classLevel?.series_id);
  const deleteSubject = useDeleteSubject();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | undefined>();
  const [deleting, setDeleting] = useState<Subject | undefined>();

  const filtered = (subjects ?? []).filter(
    (s) => s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!deleting) return;
    deleteSubject.mutate({ id: deleting.id, class_id: classId }, {
      onSuccess: () => { toast({ title: "Subject deleted" }); setDeleting(undefined); },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <Layout breadcrumbs={[
      { label: "Series", href: "/series" },
      { label: series?.title ?? "Series", href: `/series/${classLevel?.series_id}/classes` },
      { label: classLevel?.title ?? classId, href: `/series/${classLevel?.series_id}/classes` },
      { label: "Subjects" },
    ]}>
      <SectionHeader
        title={`Subjects — ${classLevel?.title ?? "..."}`}
        description="Manage subjects in this class"
        action={
          <Button data-testid="button-add-subject" onClick={() => { setEditing(undefined); setDialogOpen(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Subject
          </Button>
        }
      />

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search subjects..." />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No subjects found. Add the first subject." />
      ) : (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Subject</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Videos</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Worksheets</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors" data-testid={`row-subject-${s.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="font-medium text-foreground">{s.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{s.description}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.video_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.worksheet_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/subjects/${s.id}/videos`}>
                        <Button variant="ghost" size="sm" data-testid={`button-view-videos-${s.id}`} className="h-7 px-2 text-xs">
                          Videos <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </Link>
                      <Link href={`/subjects/${s.id}/worksheets`}>
                        <Button variant="ghost" size="sm" data-testid={`button-view-worksheets-${s.id}`} className="h-7 px-2 text-xs">
                          Worksheets <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-edit-subject-${s.id}`} onClick={() => { setEditing(s); setDialogOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" data-testid={`button-delete-subject-${s.id}`} onClick={() => setDeleting(s)}>
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

      <SubjectForm open={dialogOpen} onClose={() => setDialogOpen(false)} existing={editing} classId={classId} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleting?.title}</strong>? All videos and worksheets within it will also be deleted.
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
