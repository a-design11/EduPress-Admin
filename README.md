# EduPress Admin

  A React + Vite web admin panel for managing EduPress learning content.

  ## Features

  - **Dashboard** — live counts for all content types
  - **Series** — create, edit, delete learning series
  - **Classes** — manage class levels within each series
  - **Subjects** — manage subjects within each class
  - **Videos** — manage video lessons within each subject
  - **Worksheets** — manage PDF worksheets within each subject

  ## Stack

  - React + Vite
  - TypeScript
  - Tailwind CSS + shadcn/ui
  - TanStack Query (data fetching / cache)
  - Wouter (routing)
  - Supabase (database)
  - Zod + react-hook-form (form validation)

  ## Setup

  1. Create a `.env.local` file with your Supabase credentials:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```

  2. Run the Supabase migration:
     - Open `supabase-migration.sql` in your Supabase SQL Editor and run it.
     - This creates all tables, RLS policies (including write access for the admin), and seeds sample data.

  3. Install dependencies and start:
  ```bash
  npm install
  npm run dev
  ```

  ## Navigation

  Content is organised hierarchically:
  **Series → Classes → Subjects → Videos / Worksheets**

  Navigate by clicking the **Classes**, **Subjects**, **Videos**, or **Worksheets** buttons on each list page.
  