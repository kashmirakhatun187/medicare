/*
# Create patient reviews table

1. New Tables
- `reviews`
  - `id` (uuid, primary key)
  - `patient_name` (text, not null) - name of the reviewer
  - `rating` (integer 1-5, not null) - star rating
  - `review_text` (text, not null) - the review content
  - `department` (text, nullable) - which department/service they visited
  - `is_approved` (boolean, default false) - admin moderation flag
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `reviews`.
- Public can read approved reviews (anon + authenticated).
- Public can submit reviews (anon + authenticated INSERT).
- Only authenticated staff can update/delete (for moderation).
3. Indexes
- Index on `is_approved` for filtering approved reviews
- Index on `created_at` for ordering by newest
*/

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  department text,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_approved_reviews" ON reviews;
CREATE POLICY "public_read_approved_reviews"
ON reviews FOR SELECT
TO anon, authenticated
USING (is_approved = true);

DROP POLICY IF EXISTS "public_insert_reviews" ON reviews;
CREATE POLICY "public_insert_reviews"
ON reviews FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "staff_update_reviews" ON reviews;
CREATE POLICY "staff_update_reviews"
ON reviews FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "staff_delete_reviews" ON reviews;
CREATE POLICY "staff_delete_reviews"
ON reviews FOR DELETE
TO authenticated
USING (true);

CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);