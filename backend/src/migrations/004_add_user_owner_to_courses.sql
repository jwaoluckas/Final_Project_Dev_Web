-- Alteracao PPC: vincula cada PPC ao usuario que o criou.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_courses_user_id
  ON courses(user_id);
