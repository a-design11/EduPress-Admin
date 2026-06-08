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
import { useToast } from "@/hooks/use-toast";
import {
  useWorksheets, useCreateWorksheet, useUpdateWorksheet, useDeleteWorksheet,
  useSubjects, useClassLevels, useSeries, type Worksheet,
} from "@/hooks/use-admin";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  file_url: z.string().url("Must be a valid URL"),
  pages: z.coerce.number().int().min(1),
  topic: z.string().min(1, "Topic is required"),
});

type FormValues = z.infer<typeof schema>;

function WorksheetForm({
  open, onClose, existing, subjectId,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Worksheet;
  subjectId: string;
}) {
  const { toast } = useToast();
  const create = useCreateWorksheet();
  const update = useUpdateWorksheet();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? { title: existing.title, description: existing.description, file_url: existing.file_url, pages: existing.pages, topic: existing.topic }
      : { title: "", description: "", file_url: "", pages: 1, topic: "" },
  });

  const onSubmit = (values: FormValues) => {
    if (existing) {
      update.mutate({ id: existing.id, ...values }, {
        onSuccess: () => { toast({ title: "Worksheet updated" }); onClose(); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      });
    } else {
      create.mutate({ ...values, subject_id: subjectId }, {
        onSuccess: () => { toast({ title: "Worksheet created" }); onClose(); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Worksheet" : "New Worksheet"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input data-testid="input-title" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input data-testid="input-description" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="topic" render={({ field }) => (
              <FormItem><FormLabel>Topic</FormLabel><FormControl><Input placeholder="e.g. Algebra" data-testid="input-topic" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="pages" render={({ field }) => (
                <FormItem><FormLabel>Pages</FormLabel><FormControl><Input type="number" data-testid="input-pages" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="file_url" render={({ field }) => (
              <FormItem><FormLabel>File URL (PDF)</FormLabel><FormControl><Input placeholder="https://..." data-testid="input-file-url" {...field} /></FormControl><FormMessage /></FormItem>
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

export default function WorksheetsPage() {
  const params = useParams<{ subjectId: string }>();
  const subjectId = params.subjectId;
  const { data: worksheets, isLoading } = useWorksheets(subjectId);
  const { data: allSubjects } = useSubjects();
  const { data: allClasses } = useClassLevels();
  const { data: allSeries } = useSeries();
  const subject = allSubjects?.find((s) => s.id === subjectId);
  const classLevel = allClasses?.find((c) => c.id === subject?.class_id);
  const series = allSeries?.find((s) => s.id === classLevel?.series_id);
  const deleteWorksheet = useDeleteWorksheet();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Worksheet | undefined>();
  const [deleting, setDeleting] = useState<Worksheet | undefined>();

  const filtered = (worksheets ?? []).filter(
    (w) => w.title.toLowerCase().includes(search.toLowerCase()) || w.topic.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!deleting) return;
    deleteWorksheet.mutate({ id: deleting.id, subject_id: subjectId }, {
      onSuccess: () => { toast({ title: "Worksheet deleted" }); setDeleting(undefined); },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <Layout breadcrumbs={[
      { label: "Series", href: "/series" },
      { label: series?.title ?? "Series", href: `/series/${classLevel?.series_id}/classes` },
      { label: classLevel?.title ?? "Class", href: `/classes/${classLevel?.id}/subjects` },
      { label: subject?.title ?? subjectId, href: `/classes/${subject?.class_id}/subjects` },
      { label: "Worksheets" },
    ]}>
      <SectionHeader
        title={`Worksheets — ${subject?.title ?? "..."}`}
        description="Manage worksheets in this subject"
        action={
          <Button data-testid="button-add-worksheet" onClick={() => { setEditing(undefined); setDialogOpen(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Worksheet
          </Button>
        }
      />

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search worksheets..." />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No worksheets found. Add the first worksheet." />
      ) : (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Topic</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Pages</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors" data-testid={`row-worksheet-${w.id}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{w.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{w.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{w.topic}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{w.pages} pages</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <a href={w.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-open-worksheet-${w.id}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                      <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-edit-worksheet-${w.id}`} onClick={() => { setEditing(w); setDialogOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" data-testid={`button-delete-worksheet-${w.id}`} onClick={() => setDeleting(w)}>
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

      <WorksheetForm open={dialogOpen} onClose={() => setDialogOpen(false)} existing={editing} subjectId={subjectId} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worksheet</AlertDialogTitle>
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
