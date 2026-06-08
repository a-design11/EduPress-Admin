import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Video,
  FileText,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/series", label: "Series", icon: BookOpen },
];

interface LayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Layout({ children, breadcrumbs }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="px-5 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground leading-none">EduPress</p>
              <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 py-3">
          <nav className="px-3 space-y-0.5">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? location === "/" : location.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  data-testid={`nav-link-${label.toLowerCase()}`}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 px-5">
            <p className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground mb-1.5">
              Content
            </p>
            <div className="px-3 py-2 rounded-md bg-muted/50 text-xs text-muted-foreground leading-relaxed">
              Navigate via Series → Classes → Subjects → Videos / Worksheets
            </div>
          </div>
        </ScrollArea>

        <div className="px-5 py-3 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">
            EduPress Admin v1.0
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <header className="h-12 border-b border-border bg-background flex items-center px-6 gap-1.5 flex-shrink-0">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </header>
        )}

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href?: string;
  color?: string;
}) {
  const inner = (
    <div
      className="bg-card border border-card-border rounded-lg p-4 flex items-center gap-4 hover:bg-accent/30 transition-colors cursor-pointer"
      data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color ? `${color}20` : undefined }}
      >
        <Icon className="w-5 h-5" style={{ color: color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <FileText className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Search..."}
      data-testid="search-input"
      className="w-full max-w-xs h-8 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}
