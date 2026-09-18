# medicare

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-mg6y6bqa)

## Supabase login setup

This app expects a Supabase project for authentication and database access.

### 1) Create a `.env.local` file

Copy the example file and update the values:

```bash
cp .env.example .env.local
```

Then set your real Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 2) Run the Supabase migrations

Open the Supabase SQL editor and run the SQL files in this order:

1. `supabase/migrations/20260801170058_create_nursing_home_schema.sql`
2. `supabase/migrations/20260801173130_add_extended_modules_schema.sql`
3. `supabase/migrations/20260801173838_add_user_profiles_rbac.sql`

These migrations enable the app tables and create the `user_profiles` table used for login.

### 3) Create Supabase Auth user

In Supabase Dashboard:

- Go to Authentication → Users
- Add a new user with email/password
- Copy the generated user UUID

### 4) Create the matching profile row

Run this SQL in the Supabase SQL editor:

```sql
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  role,
  status
)
VALUES (
  'PASTE_AUTH_USER_UUID_HERE',
  'admin@example.com',
  'Administrator',
  'admin',
  'Active'
);
```

The `id` must match the `auth.users.id` for the same login user.

### 5) Start the app

```bash
npm install
npm run dev
```

Then sign in with the email and password created in Supabase.

If login fails with `Your account profile has not been provisioned yet`, the user exists in Auth but is missing from `user_profiles`.

If you see an API key error, confirm `.env.local` contains the correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values.
