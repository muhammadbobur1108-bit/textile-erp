-- ============================================================
-- CHUST TEXTILE ERP - PostgreSQL / Supabase Schema
-- Version: 2.0 | Author: Chust Textile Dev Team
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 1. ROLES & USERS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'superadmin',
  'admin',
  'master_cutter',
  'master_sewer',
  'master_packer',
  'storekeeper',
  'apprentice',
  'office_staff',
  'accountant',
  'designer'
);

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'blocked');

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       VARCHAR(150) NOT NULL,
  phone           VARCHAR(20) UNIQUE,
  login           VARCHAR(60) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'apprentice',
  department      VARCHAR(80),
  avatar_url      TEXT,
  status          user_status NOT NULL DEFAULT 'active',
  work_start_time TIME DEFAULT '09:00:00',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role    ON users(role);
CREATE INDEX idx_users_status  ON users(status);
CREATE INDEX idx_users_login   ON users(login);

-- ============================================================
-- 2. ANNOUNCEMENTS (Banner)
-- ============================================================

CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message     TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_by  UUID NOT NULL REFERENCES users(id),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_active ON announcements(is_active, expires_at);

-- ============================================================
-- 3. ORDERS
-- ============================================================

CREATE TYPE order_status AS ENUM ('active', 'completed', 'archived', 'paused');

CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        VARCHAR(30) UNIQUE NOT NULL,
  brand               VARCHAR(80) NOT NULL DEFAULT 'TODOMODA',
  model               VARCHAR(80) NOT NULL,
  image_url           TEXT,
  project_owner_id    UUID REFERENCES users(id),
  status              order_status NOT NULL DEFAULT 'active',
  -- Stage deadlines
  deadline_cutting    TIMESTAMPTZ,
  deadline_sewing     TIMESTAMPTZ,
  deadline_packaging  TIMESTAMPTZ,
  deadline_shipping   TIMESTAMPTZ,
  -- Meta
  notes               TEXT,
  created_by          UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_number      ON orders(order_number);
CREATE INDEX idx_orders_deadlines   ON orders(deadline_cutting, deadline_sewing, deadline_packaging);
CREATE INDEX idx_orders_created_at  ON orders(created_at DESC);

-- ============================================================
-- 4. ORDER COLOR VARIANTS
-- ============================================================

CREATE TABLE order_colors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  color_name  VARCHAR(80) NOT NULL,
  color_hex   VARCHAR(7) DEFAULT '#888888',
  sort_order  SMALLINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, color_name)
);

CREATE INDEX idx_order_colors_order ON order_colors(order_id);

-- ============================================================
-- 5. SIZE MATRIX (2XS to 16XL per color per stage)
-- ============================================================

CREATE TYPE size_code AS ENUM (
  '2XS','XS','S','M','L','XL',
  '2XL','3XL','4XL','5XL','6XL',
  '8XL','10XL','12XL','14XL','16XL'
);

CREATE TYPE production_stage AS ENUM (
  'target',       -- Buyurtma miqqdori
  'cutting',      -- Kroj
  'distribution', -- Razdacha
  'sewing',       -- Poshiv
  'packaging',    -- Qadoq
  'shipped'       -- Otgruzka
);

CREATE TABLE size_quantities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  color_id        UUID NOT NULL REFERENCES order_colors(id) ON DELETE CASCADE,
  stage           production_stage NOT NULL,
  size            size_code NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_by      UUID REFERENCES users(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(color_id, stage, size)
);

CREATE INDEX idx_size_qty_color   ON size_quantities(color_id);
CREATE INDEX idx_size_qty_stage   ON size_quantities(color_id, stage);

-- Defect quantities per color (separate for OTK)
CREATE TABLE defect_quantities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  color_id    UUID NOT NULL REFERENCES order_colors(id) ON DELETE CASCADE,
  size        size_code NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_by  UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(color_id, size)
);

CREATE INDEX idx_defect_qty_color ON defect_quantities(color_id);

-- ============================================================
-- 6. QUALITY CONTROL (OTK)
-- ============================================================

CREATE TYPE defect_category AS ENUM (
  'fabric_issue',
  'sewing_error',
  'cutting_issue',
  'machinery_fault',
  'other'
);

CREATE TYPE otk_status AS ENUM (
  'pending',
  'blocked',     -- Exceeded threshold, awaiting explanation
  'explained',
  'rework',      -- Pridelka
  'resolved'
);

CREATE TABLE otk_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  defect_threshold_pct  NUMERIC(4,2) NOT NULL DEFAULT 2.00,
  rework_deadline_hours INTEGER NOT NULL DEFAULT 24,
  updated_by            UUID REFERENCES users(id),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default
INSERT INTO otk_settings (defect_threshold_pct, rework_deadline_hours)
VALUES (2.00, 24);

CREATE TABLE otk_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  color_id        UUID NOT NULL REFERENCES order_colors(id),
  defect_count    INTEGER NOT NULL DEFAULT 0,
  total_count     INTEGER NOT NULL,
  defect_pct      NUMERIC(5,2) NOT NULL DEFAULT 0,
  status          otk_status NOT NULL DEFAULT 'pending',
  -- Forced explanation fields
  defect_category defect_category,
  explanation     TEXT,
  explained_by    UUID REFERENCES users(id),
  explained_at    TIMESTAMPTZ,
  -- Rework (Pridelka)
  rework_deadline TIMESTAMPTZ,
  rework_assigned UUID REFERENCES users(id),
  rework_done_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otk_color  ON otk_records(color_id);
CREATE INDEX idx_otk_status ON otk_records(status);
CREATE INDEX idx_otk_rework ON otk_records(rework_deadline) WHERE status = 'rework';

-- ============================================================
-- 7. APPRENTICE TASKS
-- ============================================================

CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'done', 'cancelled');

CREATE TABLE apprentice_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID REFERENCES orders(id),
  assigned_to     UUID NOT NULL REFERENCES users(id),
  assigned_by     UUID NOT NULL REFERENCES users(id),
  task_text       TEXT NOT NULL,
  task_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  status          task_status NOT NULL DEFAULT 'pending',
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned   ON apprentice_tasks(assigned_to, task_date);
CREATE INDEX idx_tasks_date       ON apprentice_tasks(task_date);
CREATE INDEX idx_tasks_status     ON apprentice_tasks(status);

-- ============================================================
-- 8. WAREHOUSE TRANSFERS
-- ============================================================

CREATE TYPE transfer_status AS ENUM (
  'pending',
  'in_transit',
  'received',
  'disputed',    -- Претензия
  'resolved'
);

CREATE TABLE warehouse_transfers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_code       VARCHAR(20) UNIQUE NOT NULL,
  color_id            UUID NOT NULL REFERENCES order_colors(id),
  sent_by             UUID NOT NULL REFERENCES users(id),
  sent_at             TIMESTAMPTZ DEFAULT NOW(),
  received_by         UUID REFERENCES users(id),
  received_at         TIMESTAMPTZ,
  -- Quantities
  sent_qty            INTEGER NOT NULL CHECK (sent_qty > 0),
  received_qty        INTEGER,
  -- Dispute
  status              transfer_status NOT NULL DEFAULT 'pending',
  dispute_reason      TEXT,
  dispute_raised_at   TIMESTAMPTZ,
  resolved_at         TIMESTAMPTZ,
  resolved_by         UUID REFERENCES users(id),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transfers_code     ON warehouse_transfers(transfer_code);
CREATE INDEX idx_transfers_status   ON warehouse_transfers(status);
CREATE INDEX idx_transfers_color    ON warehouse_transfers(color_id);
CREATE INDEX idx_transfers_sent_by  ON warehouse_transfers(sent_by);

-- Sequence for transfer codes
CREATE SEQUENCE transfer_code_seq START 1;

-- Auto-generate transfer code
CREATE OR REPLACE FUNCTION generate_transfer_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.transfer_code := 'TRF-' || LPAD(nextval('transfer_code_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transfer_code
BEFORE INSERT ON warehouse_transfers
FOR EACH ROW WHEN (NEW.transfer_code IS NULL OR NEW.transfer_code = '')
EXECUTE FUNCTION generate_transfer_code();

-- ============================================================
-- 9. PRIVATE CHAT THREADS (for disputes)
-- ============================================================

CREATE TABLE chat_threads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id     UUID NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transfer_id)
);

CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id   UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id, created_at);
CREATE INDEX idx_chat_unread ON chat_messages(thread_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- 10. OFFICE ATTENDANCE
-- ============================================================

CREATE TYPE attendance_code AS ENUM ('X', 'K', 'S', 'B', 'O');

CREATE TABLE office_schedule (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_start    TIME NOT NULL DEFAULT '09:00:00',
  work_end      TIME NOT NULL DEFAULT '18:00:00',
  late_grace_min INTEGER NOT NULL DEFAULT 15,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO office_schedule (work_start, work_end, late_grace_min)
VALUES ('09:00:00', '18:00:00', 15);

CREATE TABLE attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  attend_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  code            attendance_code,
  check_in_time   TIMESTAMPTZ,
  check_out_time  TIMESTAMPTZ,
  late_minutes    INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, attend_date)
);

CREATE INDEX idx_attendance_user   ON attendance(user_id, attend_date);
CREATE INDEX idx_attendance_date   ON attendance(attend_date);
CREATE INDEX idx_attendance_month  ON attendance(user_id, attend_date);

-- ============================================================
-- 11. AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  table_name  VARCHAR(60),
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user   ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_table  ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_action ON audit_log(action, created_at DESC);

-- ============================================================
-- 12. USEFUL VIEWS
-- ============================================================

-- Order progress summary
CREATE OR REPLACE VIEW v_order_progress AS
SELECT
  o.id AS order_id,
  o.order_number,
  o.brand,
  o.model,
  o.status,
  o.deadline_cutting,
  o.deadline_sewing,
  o.deadline_packaging,
  o.deadline_shipping,
  oc.id AS color_id,
  oc.color_name,
  oc.color_hex,
  COALESCE(SUM(sq_target.quantity), 0)    AS total_target,
  COALESCE(SUM(sq_cutting.quantity), 0)   AS total_cutting,
  COALESCE(SUM(sq_sewing.quantity), 0)    AS total_sewing,
  COALESCE(SUM(sq_packaging.quantity), 0) AS total_packaging,
  COALESCE(SUM(sq_shipped.quantity), 0)   AS total_shipped,
  COALESCE(SUM(dq.quantity), 0)           AS total_defect,
  -- Closing percentage
  CASE WHEN COALESCE(SUM(sq_target.quantity), 0) > 0
    THEN ROUND(
      (COALESCE(SUM(sq_packaging.quantity), 0)::NUMERIC
       / SUM(sq_target.quantity)) * 100, 1)
    ELSE 0
  END AS closing_pct,
  -- Defect percentage
  CASE WHEN COALESCE(SUM(sq_sewing.quantity), 0) > 0
    THEN ROUND(
      (COALESCE(SUM(dq.quantity), 0)::NUMERIC
       / SUM(sq_sewing.quantity)) * 100, 2)
    ELSE 0
  END AS defect_pct
FROM orders o
JOIN order_colors oc ON oc.order_id = o.id
LEFT JOIN size_quantities sq_target   ON sq_target.color_id   = oc.id AND sq_target.stage   = 'target'
LEFT JOIN size_quantities sq_cutting  ON sq_cutting.color_id  = oc.id AND sq_cutting.stage  = 'cutting'
LEFT JOIN size_quantities sq_sewing   ON sq_sewing.color_id   = oc.id AND sq_sewing.stage   = 'sewing'
LEFT JOIN size_quantities sq_packaging ON sq_packaging.color_id = oc.id AND sq_packaging.stage = 'packaging'
LEFT JOIN size_quantities sq_shipped  ON sq_shipped.color_id  = oc.id AND sq_shipped.stage  = 'shipped'
LEFT JOIN defect_quantities dq        ON dq.color_id = oc.id
GROUP BY o.id, o.order_number, o.brand, o.model, o.status,
         o.deadline_cutting, o.deadline_sewing, o.deadline_packaging, o.deadline_shipping,
         oc.id, oc.color_name, oc.color_hex;

-- Monthly attendance summary
CREATE OR REPLACE VIEW v_monthly_attendance AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.role,
  DATE_TRUNC('month', a.attend_date) AS month,
  COUNT(*) FILTER (WHERE a.code = 'X') AS present_days,
  COUNT(*) FILTER (WHERE a.code = 'K') AS late_days,
  COUNT(*) FILTER (WHERE a.code = 'S') AS excused_days,
  COUNT(*) FILTER (WHERE a.code = 'B') AS sick_days,
  COUNT(*) FILTER (WHERE a.code = 'O') AS vacation_days,
  SUM(a.late_minutes) AS total_late_minutes
FROM users u
LEFT JOIN attendance a ON a.user_id = u.id
WHERE u.role IN ('office_staff', 'accountant', 'designer', 'admin')
GROUP BY u.id, u.full_name, u.role, DATE_TRUNC('month', a.attend_date);

-- Active disputes
CREATE OR REPLACE VIEW v_active_disputes AS
SELECT
  wt.id AS transfer_id,
  wt.transfer_code,
  o.order_number,
  oc.color_name,
  wt.sent_qty,
  wt.received_qty,
  (wt.sent_qty - COALESCE(wt.received_qty, 0)) AS shortage,
  wt.dispute_reason,
  wt.dispute_raised_at,
  u_sent.full_name AS sent_by_name,
  u_recv.full_name AS received_by_name
FROM warehouse_transfers wt
JOIN order_colors oc ON oc.id = wt.color_id
JOIN orders o ON o.id = oc.order_id
LEFT JOIN users u_sent ON u_sent.id = wt.sent_by
LEFT JOIN users u_recv ON u_recv.id = wt.received_by
WHERE wt.status = 'disputed';

-- ============================================================
-- 13. SEED DATA (demo users)
-- ============================================================

INSERT INTO users (full_name, phone, login, password_hash, role, department) VALUES
('Bobirjon Superadmin',  '+998901234567', 'bobirjon',  '$2a$12$DEMO_HASH_SUPERADMIN',  'superadmin',     'Boshqaruv'),
('Aziz Admin',           '+998901234568', 'aziz.admin','$2a$12$DEMO_HASH_ADMIN',        'admin',          'Ishlab chiqarish'),
('Aziz Rahimov',         '+998901234569', 'aziz.usta', '$2a$12$DEMO_HASH_CUTTER',       'master_cutter',  'Kroj bo''limi'),
('Malika Hasanova',      '+998901234570', 'malika',    '$2a$12$DEMO_HASH_SEWER',        'master_sewer',   'Tikuv bo''limi'),
('Sardor Umarov',        '+998901234571', 'sardor',    '$2a$12$DEMO_HASH_PACKER',       'master_packer',  'Qadoqlash'),
('Jasur Toshmatov',      '+998901234572', 'jasur',     '$2a$12$DEMO_HASH_STORE',        'storekeeper',    'Ombor'),
('Jamshid Shogird',      '+998901234573', 'jamshid',   '$2a$12$DEMO_HASH_APPRENT',      'apprentice',     'Yordamchi'),
('Nilufar Karimova',     '+998901234574', 'nilufar',   '$2a$12$DEMO_HASH_OFFICE',       'accountant',     'Ofis'),
('Dilnoza Yusupova',     '+998901234575', 'dilnoza',   '$2a$12$DEMO_HASH_DESIGNER',     'designer',       'Dizayn'),
('Nodira OTK',           '+998901234576', 'nodira.otk','$2a$12$DEMO_HASH_QUALITY',      'office_staff',   'OTK');

-- Sample order
INSERT INTO orders (order_number, brand, model, status, deadline_cutting, deadline_sewing, deadline_packaging, deadline_shipping, created_by)
SELECT '515.8', 'TODOMODA', 'MOS-518', 'active',
  NOW() + INTERVAL '36 hours',
  NOW() + INTERVAL '5 days',
  NOW() + INTERVAL '8 days',
  NOW() + INTERVAL '12 days',
  id
FROM users WHERE login = 'bobirjon' LIMIT 1;

-- ============================================================
-- 14. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_colors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_quantities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_quantities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE otk_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_tasks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance         ENABLE ROW LEVEL SECURITY;

-- Superadmin sees everything
CREATE POLICY superadmin_all ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'superadmin')
  );

-- Users can see their own tasks
CREATE POLICY own_tasks ON apprentice_tasks
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('superadmin','admin'))
  );

-- Chat: only participants
CREATE POLICY chat_participants ON chat_messages
  FOR ALL TO authenticated
  USING (
    thread_id IN (
      SELECT ct.id FROM chat_threads ct
      JOIN warehouse_transfers wt ON wt.id = ct.transfer_id
      WHERE wt.sent_by = auth.uid()
         OR wt.received_by = auth.uid()
         OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('superadmin','admin'))
    )
  );

-- ============================================================
-- END OF SCHEMA
-- ============================================================

-- ============================================================
-- TRIGGERS (GENERATED columns o'rniga ishlatiladi)
-- ============================================================

-- 1. attendance: late_minutes avtomatik hisoblash
CREATE OR REPLACE FUNCTION calc_late_minutes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_in_time IS NOT NULL THEN
    NEW.late_minutes := GREATEST(0,
      FLOOR(
        EXTRACT(EPOCH FROM (NEW.check_in_time::TIMETZ - '09:00:00'::TIMETZ)) / 60
      )::INTEGER
    );
  ELSE
    NEW.late_minutes := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_late_minutes
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION calc_late_minutes();

-- 2. otk_records: defect_pct avtomatik hisoblash
CREATE OR REPLACE FUNCTION calc_defect_pct()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_count > 0 THEN
    NEW.defect_pct := ROUND(
      (NEW.defect_count::NUMERIC / NEW.total_count) * 100, 2
    );
  ELSE
    NEW.defect_pct := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_defect_pct
BEFORE INSERT OR UPDATE ON otk_records
FOR EACH ROW
EXECUTE FUNCTION calc_defect_pct();

