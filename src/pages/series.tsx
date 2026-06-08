import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Layout, SectionHeader, SearchBar, EmptyState } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSeries, useCreateSeries, useUpdateSeries, useDeleteSeries, type Series } from "@/hooks/use-admin";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  class_count: z.coerce.number().int().min(0),
  video_count: z.coerce.number().int().min(0),
  total_duration: z.string().min(1, "Duration is required"),
  color: z.string().min(1, "Color is required"),
  badge: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function SeriesForm({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Series;
}) {
  const { toast } = useToast();
  const create = useCreateSeries();
  const update = useUpdateSeries();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? { ...existing, badge: existing.badge ?? "" }
      : { title: "", description: "", class_count: 0, video_count: 0, total_duration: "", color: "#8B5CF6", badge: "" },
  });

  const onSubmit = (values: FormValues) => {
    const payload = { ...values, badge: values.badge || null };
    if (existing) {
      update.mutate(
        { id: existing.id, ...payload },
        {
          onSuccess: () => { toast({ title: "Series updated" }); onClose(); },
          onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
        }
      );
    } else {
      create.mutate(payload as Omit<Series, "id">, {
        onSuccess: () => { toast({ title: "Series created" }); onClose(); },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Series" : "New Series"}</DialogTitle>
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
              <FormField control={form.control} name="class_count" render={({ field }) => (
                <FormItem><FormLabel>Class Count</FormLabel><FormControl><Input type="number" data-testid="input-class-count" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="video_count" render={({ field }) => (
                <FormItem><FormLabel>Video Count</FormLabel><FormControl><Input type="number" data-testid="input-video-count" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="total_duration" render={({ field }) => (
                <FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g. 80 hrs" data-testid="input-duration" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem><FormLabel>Color</FormLabel><FormControl><Input type="color" data-testid="input-color" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="badge" render={({ field }) => (
              <FormItem><FormLabel>Badge (optional)</FormLabel><FormControl><Input placeholder="e.g. Popular, New, Premium" data-testid="input-badge" {...field} /></FormControl><FormMessage /></FormItem>
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

export default function SeriesPage() {
  const { data, isLoading } = useSeries();
  const deleteSeries = useDeleteSeries();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Series | undefined>();
  const [deleting, setDeleting] = useState<Series | undefined>();

  const filtered = (data ?? []).filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!deleting) return;
    deleteSeries.mutate(deleting.id, {
      onSuccess: () => { toast({ title: "Series deleted" }); setDeleting(undefined); },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <Layout breadcrumbs={[{ label: "Series" }]}>
      <SectionHeader
        title="Series"
        description="Manage learning series"
        action={
          <Button data-testid="button-add-series" onClick={() => { setEditing(undefined); setDialogOpen(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Series
          </Button>
        }
      />

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search series..." />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No series found. Add your first series." />
      ) : (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Duration</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Classes</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Videos</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Badge</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors" data-testid={`row-series-${s.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <div>
                        <p className="font-medium text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.total_duration}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.class_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.video_count}</td>
                  <td className="px-4 py-3">
                    {s.badge && <Badge variant="secondary" className="text-xs">{s.badge}</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/series/${s.id}/classes`}>
                        <Button variant="ghost" size="sm" data-testid={`button-view-classes-${s.id}`} className="h-7 px-2 text-xs">
                          Classes <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        data-testid={`button-edit-series-${s.id}`}
                        onClick={() => { setEditing(s); setDialogOpen(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        data-testid={`button-delete-series-${s.id}`}
                        onClick={() => setDeleting(s)}
                      >
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

      <SeriesForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        existing={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Series</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleting?.title}</strong>? This will also delete all classes, subjects, videos, and worksheets within it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
