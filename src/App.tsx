import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/series" component={SeriesPage} />
      <Route path="/series/:seriesId/classes" component={ClassesPage} />
      <Route path="/classes/:classId/subjects" component={SubjectsPage} />
      <Route path="/subjects/:subjectId/videos" component={VideosPage} />
      <Route path="/subjects/:subjectId/worksheets" component={WorksheetsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
