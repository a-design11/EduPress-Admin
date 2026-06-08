import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type Series = {
  id: string;
  title: string;
  description: string;
  class_count: number;
  video_count: number;
  total_duration: string;
  color: string;
  badge: string | null;
};

export type ClassLevel = {
  id: string;
  series_id: string;
  title: string;
  subtitle: string;
  subject_count: number;
  color: string;
};

export type Subject = {
  id: string;
  class_id: string;
  series_id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  video_count: number;
  worksheet_count: number;
};

export type VideoLesson = {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  duration: string;
  video_url: string;
  video_type: "youtube" | "direct";
  chapter_number: number;
};

export type Worksheet = {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  file_url: string;
  pages: number;
  topic: string;
};

export const generateId = () => Math.random().toString(36).slice(2, 10);

// ──────────────────────────────────────────────────────────────────────────────
// SERIES
// ──────────────────────────────────────────────────────────────────────────────
export const useSeries = () =>
  useQuery({
    queryKey: ["series"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("*").order("title");
      if (error) throw error;
      return data as Series[];
    },
  });

export const useCreateSeries = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Series, "id">) => {
      const { data, error } = await supabase
        .from("series")
        .insert({ ...payload, id: generateId() })
        .select()
        .single();
      if (error) throw error;
      return data as Series;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["series"] }),
  });
};

export const useUpdateSeries = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Series> & { id: string }) => {
      const { data, error } = await supabase
        .from("series")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Series;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["series"] }),
  });
};

export const useDeleteSeries = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("series").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["series"] }),
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// CLASS LEVELS
// ──────────────────────────────────────────────────────────────────────────────
export const useClassLevels = (seriesId?: string) =>
  useQuery({
    queryKey: ["class_levels", seriesId],
    queryFn: async () => {
      let q = supabase.from("class_levels").select("*").order("title");
      if (seriesId) q = q.eq("series_id", seriesId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ClassLevel[];
    },
  });

export const useCreateClassLevel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<ClassLevel, "id">) => {
      const { data, error } = await supabase
        .from("class_levels")
        .insert({ ...payload, id: generateId() })
        .select()
        .single();
      if (error) throw error;
      return data as ClassLevel;
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["class_levels", vars.series_id] }),
  });
};

export const useUpdateClassLevel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ClassLevel> & { id: string }) => {
      const { data, error } = await supabase
        .from("class_levels")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ClassLevel;
    },
    onSuccess: (data) =>
      qc.invalidateQueries({ queryKey: ["class_levels", data.series_id] }),
  });
};

export const useDeleteClassLevel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, series_id }: { id: string; series_id: string }) => {
      const { error } = await supabase.from("class_levels").delete().eq("id", id);
      if (error) throw error;
      return series_id;
    },
    onSuccess: (series_id) =>
      qc.invalidateQueries({ queryKey: ["class_levels", series_id] }),
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// SUBJECTS
// ──────────────────────────────────────────────────────────────────────────────
export const useSubjects = (classId?: string) =>
  useQuery({
    queryKey: ["subjects", classId],
    queryFn: async () => {
      let q = supabase.from("subjects").select("*").order("title");
      if (classId) q = q.eq("class_id", classId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Subject[];
    },
  });

export const useCreateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Subject, "id">) => {
      const { data, error } = await supabase
        .from("subjects")
        .insert({ ...payload, id: generateId() })
        .select()
        .single();
      if (error) throw error;
      return data as Subject;
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["subjects", vars.class_id] }),
  });
};

export const useUpdateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Subject> & { id: string }) => {
      const { data, error } = await supabase
        .from("subjects")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Subject;
    },
    onSuccess: (data) =>
      qc.invalidateQueries({ queryKey: ["subjects", data.class_id] }),
  });
};

export const useDeleteSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, class_id }: { id: string; class_id: string }) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
      return class_id;
    },
    onSuccess: (class_id) =>
      qc.invalidateQueries({ queryKey: ["subjects", class_id] }),
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// VIDEO LESSONS
// ──────────────────────────────────────────────────────────────────────────────
export const useVideoLessons = (subjectId?: string) =>
  useQuery({
    queryKey: ["video_lessons", subjectId],
    queryFn: async () => {
      let q = supabase.from("video_lessons").select("*").order("chapter_number");
      if (subjectId) q = q.eq("subject_id", subjectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as VideoLesson[];
    },
  });

export const useCreateVideoLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<VideoLesson, "id">) => {
      const { data, error } = await supabase
        .from("video_lessons")
        .insert({ ...payload, id: generateId() })
        .select()
        .single();
      if (error) throw error;
      return data as VideoLesson;
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["video_lessons", vars.subject_id] }),
  });
};

export const useUpdateVideoLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<VideoLesson> & { id: string }) => {
      const { data, error } = await supabase
        .from("video_lessons")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as VideoLesson;
    },
    onSuccess: (data) =>
      qc.invalidateQueries({ queryKey: ["video_lessons", data.subject_id] }),
  });
};

export const useDeleteVideoLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, subject_id }: { id: string; subject_id: string }) => {
      const { error } = await supabase.from("video_lessons").delete().eq("id", id);
      if (error) throw error;
      return subject_id;
    },
    onSuccess: (subject_id) =>
      qc.invalidateQueries({ queryKey: ["video_lessons", subject_id] }),
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// WORKSHEETS
// ──────────────────────────────────────────────────────────────────────────────
export const useWorksheets = (subjectId?: string) =>
  useQuery({
    queryKey: ["worksheets", subjectId],
    queryFn: async () => {
      let q = supabase.from("worksheets").select("*").order("title");
      if (subjectId) q = q.eq("subject_id", subjectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Worksheet[];
    },
  });

export const useCreateWorksheet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Worksheet, "id">) => {
      const { data, error } = await supabase
        .from("worksheets")
        .insert({ ...payload, id: generateId() })
        .select()
        .single();
      if (error) throw error;
      return data as Worksheet;
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["worksheets", vars.subject_id] }),
  });
};

export const useUpdateWorksheet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Worksheet> & { id: string }) => {
      const { data, error } = await supabase
        .from("worksheets")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Worksheet;
    },
    onSuccess: (data) =>
      qc.invalidateQueries({ queryKey: ["worksheets", data.subject_id] }),
  });
};

export const useDeleteWorksheet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, subject_id }: { id: string; subject_id: string }) => {
      const { error } = await supabase.from("worksheets").delete().eq("id", id);
      if (error) throw error;
      return subject_id;
    },
    onSuccess: (subject_id) =>
      qc.invalidateQueries({ queryKey: ["worksheets", subject_id] }),
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// DASHBOARD COUNTS
// ──────────────────────────────────────────────────────────────────────────────
export const useDashboardStats = () =>
  useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const [s, c, sub, v, w] = await Promise.all([
        supabase.from("series").select("id", { count: "exact", head: true }),
        supabase.from("class_levels").select("id", { count: "exact", head: true }),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
        supabase.from("video_lessons").select("id", { count: "exact", head: true }),
        supabase.from("worksheets").select("id", { count: "exact", head: true }),
      ]);
      return {
        series: s.count ?? 0,
        classes: c.count ?? 0,
        subjects: sub.count ?? 0,
        videos: v.count ?? 0,
        worksheets: w.count ?? 0,
      };
    },
  });
