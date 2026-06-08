import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import SeriesPage from "@/pages/series";
import ClassesPage from "@/pages/classes";
import SubjectsPage from "@/pages/subjects";
import VideosPage from "@/pages/videos";
import WorksheetsPage from "@/pages/worksheets";
import LoginPage from "@/pages/login";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (!session) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/series" component={() => <ProtectedRoute component={SeriesPage} />} />
      <Route path="/series/:seriesId/classes" component={() => <ProtectedRoute component={ClassesPage} />} />
      <Route path="/classes/:classId/subjects" component={() => <ProtectedRoute component={SubjectsPage} />} />
      <Route path="/subjects/:subjectId/videos" component={() => <ProtectedRoute component={VideosPage} />} />
      <Route path="/subjects/:subjectId/worksheets" component={() => <ProtectedRoute component={WorksheetsPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
