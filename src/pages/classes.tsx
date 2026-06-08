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
  useClassLevels, useCreateClassLevel, useUpdateClassLevel, useDeleteClassLevel,
  useSeries, type ClassLevel,
} from "@/hooks/use-admin";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  subject_count: z.coerce.number().int().min(0),
  color: z.string().min(1, "Color is required"),
});

type FormValues = z.infer<typeof schema>;

function ClassForm({
  open, onClose, existing, seriesId,
}: {
  open: boolean;
  onClose: () => void;
  existing?: ClassLevel;
  seriesId: string;
}) {
  const { toast } = useToast();
  const create = useCreateClassLevel();
  const update = useUpdateClassLevel();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? { title: existing.title, subtitle: existing.subtitle, subject_count: existing.subject_count, color: existing.color }
      : { title: "", subtitle: "", subject_count: 0, color: "#10B981" },
  });

  const onSubmit = (values: FormValues) => {
    if (existing) {
      update.mutate({ id: existing.id, ...values }, {
        onSuccess: () => { toast({ title: "Class updated" }); onClose(); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      });
    } else {
      create.mutate({ ...values, series_id: seriesId }, {
        onSuccess: () => { toast({ title: "Class created" }); onClose(); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Class" : "New Class"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input data-testid="input-title" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="subtitle" render={({ field }) => (
              <FormItem><FormLabel>Subtitle</FormLabel><FormControl><Input data-testid="input-subtitle" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="subject_count" render={({ field }) => (
                <FormItem><FormLabel>Subject Count</FormLabel><FormControl><Input type="number" data-testid="input-subject-count" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem><FormLabel>Color</FormLabel><FormControl><Input type="color" data-testid="input-color" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
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

export default function ClassesPage() {
  const params = useParams<{ seriesId: string }>();
  const seriesId = params.seriesId;
  const { data: classes, isLoading } = useClassLevels(seriesId);
  const { data: allSeries } = useSeries();
  const series = allSeries?.find((s) => s.id === seriesId);
  const deleteClass = useDeleteClassLevel();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassLevel | undefined>();
  const [deleting, setDeleting] = useState<ClassLevel | undefined>();

  const filtered = (classes ?? []).filter(
    (c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!deleting) return;
    deleteClass.mutate({ id: deleting.id, series_id: seriesId }, {
      onSuccess: () => { toast({ title: "Class deleted" }); setDeleting(undefined); },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <Layout breadcrumbs={[
      { label: "Series", href: "/series" },
      { label: series?.title ?? seriesId, href: `/series` },
      { label: "Classes" },
    ]}>
      <SectionHeader
        title={`Classes — ${series?.title ?? "..."}`}
        description="Manage class levels in this series"
        action={
          <Button data-testid="button-add-class" onClick={() => { setEditing(undefined); setDialogOpen(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Class
          </Button>
        }
      />

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search classes..." />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No classes found. Add the first class level." />
      ) : (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Subtitle</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Subjects</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors" data-testid={`row-class-${c.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="font-medium text-foreground">{c.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.subtitle}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.subject_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/classes/${c.id}/subjects`}>
                        <Button variant="ghost" size="sm" data-testid={`button-view-subjects-${c.id}`} className="h-7 px-2 text-xs">
                          Subjects <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-edit-class-${c.id}`} onClick={() => { setEditing(c); setDialogOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" data-testid={`button-delete-class-${c.id}`} onClick={() => setDeleting(c)}>
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

      <ClassForm open={dialogOpen} onClose={() => setDialogOpen(false)} existing={editing} seriesId={seriesId} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleting?.title}</strong>? This will remove all subjects, videos, and worksheets within it.
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
