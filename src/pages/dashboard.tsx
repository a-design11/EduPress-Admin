import { Layout, SectionHeader, StatCard } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-admin";
import { BookOpen, GraduationCap, FlaskConical, Video, FileText } from "lucide-react";

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats();

  const stats = [
    { label: "Series", value: data?.series ?? 0, icon: BookOpen, href: "/series", color: "#8B5CF6" },
    { label: "Class Levels", value: data?.classes ?? 0, icon: GraduationCap, href: "/series", color: "#10B981" },
    { label: "Subjects", value: data?.subjects ?? 0, icon: FlaskConical, href: "/series", color: "#F59E0B" },
    { label: "Video Lessons", value: data?.videos ?? 0, icon: Video, href: "/series", color: "#2563EB" },
    { label: "Worksheets", value: data?.worksheets ?? 0, icon: FileText, href: "/series", color: "#EF4444" },
  ];

  return (
    <Layout breadcrumbs={[{ label: "Dashboard" }]}>
      <SectionHeader
        title="Dashboard"
        description="Overview of all EduPress content"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) =>
          isLoading ? (
            <Skeleton key={stat.label} className="h-20 rounded-lg" />
          ) : (
            <StatCard key={stat.label} {...stat} />
          )
        )}
      </div>

      <div className="mt-8 bg-card border border-card-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-2">Getting Started</h2>
        <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
          <li>Go to <strong className="text-foreground">Series</strong> to create or manage learning series</li>
          <li>Open a series to manage its <strong className="text-foreground">Class Levels</strong></li>
          <li>Open a class to manage its <strong className="text-foreground">Subjects</strong></li>
          <li>Open a subject to manage <strong className="text-foreground">Video Lessons</strong> and <strong className="text-foreground">Worksheets</strong></li>
        </ol>
      </div>
    </Layout>
  );
}
