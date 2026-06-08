-- EduPress Learning — Supabase schema + seed data
-- Run this entire script in your Supabase project:
-- Dashboard → SQL Editor → New query → paste → Run

-- ────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────

create table if not exists series (
  id            text primary key,
  title         text not null,
  description   text,
  class_count   int  default 0,
  video_count   int  default 0,
  total_duration text,
  color         text,
  badge         text
);

create table if not exists class_levels (
  id            text primary key,
  series_id     text references series(id) on delete cascade,
  title         text not null,
  subtitle      text,
  subject_count int  default 0,
  color         text
);

create table if not exists subjects (
  id              text primary key,
  class_id        text references class_levels(id) on delete cascade,
  series_id       text references series(id) on delete cascade,
  title           text not null,
  description     text,
  icon            text,
  color           text,
  video_count     int default 0,
  worksheet_count int default 0
);

create table if not exists video_lessons (
  id             text primary key,
  subject_id     text references subjects(id) on delete cascade,
  title          text not null,
  description    text,
  duration       text,
  video_url      text,
  video_type     text check (video_type in ('youtube','direct')),
  chapter_number int  default 1
);

create table if not exists worksheets (
  id          text primary key,
  subject_id  text references subjects(id) on delete cascade,
  title       text not null,
  description text,
  file_url    text,
  pages       int  default 1,
  topic       text
);

-- ────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY (public read)
-- ────────────────────────────────────────────

alter table series        enable row level security;
alter table class_levels  enable row level security;
alter table subjects      enable row level security;
alter table video_lessons enable row level security;
alter table worksheets    enable row level security;

create policy "public read series"        on series        for select using (true);
create policy "public read class_levels"  on class_levels  for select using (true);
create policy "public read subjects"      on subjects      for select using (true);
create policy "public read video_lessons" on video_lessons for select using (true);
create policy "public read worksheets"    on worksheets    for select using (true);

-- Admin write policies (allows INSERT / UPDATE / DELETE via the anon key)
-- These are needed for the EduPress Admin web panel.
create policy "admin write series"        on series        for all using (true) with check (true);
create policy "admin write class_levels"  on class_levels  for all using (true) with check (true);
create policy "admin write subjects"      on subjects      for all using (true) with check (true);
create policy "admin write video_lessons" on video_lessons for all using (true) with check (true);
create policy "admin write worksheets"    on worksheets    for all using (true) with check (true);

-- ────────────────────────────────────────────
-- 3. SEED DATA
-- ────────────────────────────────────────────

-- Series
insert into series (id, title, description, class_count, video_count, total_duration, color, badge) values
  ('s1', 'Foundation Series',       'Build strong basics from Class 1 to 5 with fun interactive lessons', 5, 120, '80 hrs',  '#8B5CF6', 'Popular'),
  ('s2', 'Middle School Series',    'Comprehensive coverage for Class 6 to 8, aligned with NCERT',        3, 210, '140 hrs', '#10B981', 'New'),
  ('s3', 'Secondary Series',        'Focused preparation for Class 9 & 10 board exams',                   2, 180, '120 hrs', '#F59E0B', null),
  ('s4', 'Senior Secondary Series', 'In-depth content for Class 11 & 12 with competitive exam focus',     2, 260, '180 hrs', '#2563EB', 'Premium'),
  ('s5', 'Olympiad Series',         'Advanced problem-solving for Math & Science Olympiads',              5,  90, '60 hrs',  '#EF4444', null)
on conflict (id) do nothing;

-- Classes
insert into class_levels (id, series_id, title, subtitle, subject_count, color) values
  ('c1',  's1', 'Class 1',  'Beginner Level',   4, '#8B5CF6'),
  ('c2',  's1', 'Class 2',  'Elementary',        4, '#8B5CF6'),
  ('c3',  's1', 'Class 3',  'Elementary',        5, '#8B5CF6'),
  ('c4',  's1', 'Class 4',  'Elementary',        5, '#8B5CF6'),
  ('c5',  's1', 'Class 5',  'Elementary',        5, '#8B5CF6'),
  ('c6',  's2', 'Class 6',  'Middle School',     6, '#10B981'),
  ('c7',  's2', 'Class 7',  'Middle School',     6, '#10B981'),
  ('c8',  's2', 'Class 8',  'Middle School',     6, '#10B981'),
  ('c9',  's3', 'Class 9',  'Secondary',         6, '#F59E0B'),
  ('c10', 's3', 'Class 10', 'Board Exam Year',   6, '#F59E0B'),
  ('c11', 's4', 'Class 11', 'Senior Secondary',  5, '#2563EB'),
  ('c12', 's4', 'Class 12', 'Board Exam Year',   5, '#2563EB')
on conflict (id) do nothing;

-- Subjects
insert into subjects (id, class_id, series_id, title, description, icon, color, video_count, worksheet_count) values
  ('sub1',  'c6',  's2', 'Mathematics',   'Algebra, Geometry, Numbers',               'calculate',  '#8B5CF6', 24, 12),
  ('sub2',  'c6',  's2', 'Science',       'Physics, Chemistry, Biology',              'science',    '#10B981', 20, 10),
  ('sub3',  'c6',  's2', 'English',       'Grammar, Literature, Writing',             'menu-book',  '#F59E0B', 18, 15),
  ('sub4',  'c6',  's2', 'Hindi',         'Vyakaran, Sahitya, Lekhan',               'translate',  '#EF4444', 16, 12),
  ('sub5',  'c6',  's2', 'Social Science','History, Geography, Civics',               'public',     '#06B6D4', 20, 10),
  ('sub6',  'c6',  's2', 'Computer',      'Basics, MS Office, Internet',              'computer',   '#EC4899', 12,  8),
  ('sub7',  'c9',  's3', 'Mathematics',   'Algebra, Coordinate Geometry, Trigonometry','calculate', '#8B5CF6', 32, 16),
  ('sub8',  'c9',  's3', 'Science',       'Physics, Chemistry, Biology',              'science',    '#10B981', 28, 14),
  ('sub9',  'c9',  's3', 'English',       'Beehive, Moments, Grammar',                'menu-book',  '#F59E0B', 24, 18),
  ('sub10', 'c9',  's3', 'Social Science','History, Political Science, Economics',    'public',     '#06B6D4', 26, 13),
  ('sub11', 'c10', 's3', 'Mathematics',   'Real Numbers, Polynomials, Triangles',     'calculate',  '#8B5CF6', 36, 18),
  ('sub12', 'c10', 's3', 'Science',       'Chemical Reactions, Life Processes, Electricity','science','#10B981',30,15)
on conflict (id) do nothing;

-- Video Lessons
insert into video_lessons (id, subject_id, title, description, duration, video_url, video_type, chapter_number) values
  ('v1', 'sub1', 'Introduction to Algebra',      'Learn the basics of algebraic expressions and variables',        '12:30', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 1),
  ('v2', 'sub1', 'Linear Equations',             'Solving simple and compound linear equations step by step',      '18:45', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 2),
  ('v3', 'sub1', 'Ratio and Proportion',          'Understanding ratios, rates and direct/inverse proportion',      '15:20', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 3),
  ('v4', 'sub1', 'Geometry Basics',              'Lines, angles and triangles fundamentals',                       '20:10', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 4),
  ('v5', 'sub1', 'Data Handling',                'Bar graphs, pie charts and basic statistics',                    '14:55', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 5),
  ('v6', 'sub2', 'Motion and Measurement',        'Types of motion and basic units of measurement',                '16:00', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 1),
  ('v7', 'sub2', 'Food: Where Does it Come From?','Plant and animal sources of food, photosynthesis basics',       '13:40', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 2)
on conflict (id) do nothing;

-- Worksheets
insert into worksheets (id, subject_id, title, description, file_url, pages, topic) values
  ('w1', 'sub1', 'Algebra Practice Sheet 1',    'Basic algebraic expressions and simplification',    'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf', 4, 'Algebra'),
  ('w2', 'sub1', 'Linear Equations Worksheet',  '20 practice problems with solutions',               'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf', 6, 'Linear Equations'),
  ('w3', 'sub1', 'Geometry Exercise Set',       'Angles, triangles and quadrilaterals problems',     'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf', 5, 'Geometry'),
  ('w4', 'sub2', 'Science Activity Sheet 1',    'Observation-based activities for motion study',     'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf', 3, 'Motion')
on conflict (id) do nothing;
