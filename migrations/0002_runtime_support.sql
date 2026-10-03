ALTER TABLE complaints ADD COLUMN impact TEXT;

CREATE TABLE IF NOT EXISTS complaint_sequences (
  year INTEGER PRIMARY KEY,
  last_value INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO authorities (id, name, category, description, contact_info, area, active)
VALUES
  ('authority-municipal', 'Municipal Services', 'Public Infrastructure', 'General public infrastructure and municipal services.', '', 'Citywide', 1),
  ('authority-waste', 'Waste Management', 'Garbage', 'Waste collection and disposal services.', '', 'Citywide', 1),
  ('authority-water', 'Water & Sanitation', 'Water', 'Water supply and sanitation services.', '', 'Citywide', 1),
  ('authority-roads', 'Roads / Public Works', 'Road Damage', 'Road and public works maintenance.', '', 'Citywide', 1),
  ('authority-drainage', 'Drainage / Sanitation', 'Drainage', 'Drainage and sanitation services.', '', 'Citywide', 1),
  ('authority-lighting', 'Streetlight Services', 'Streetlight', 'Streetlight repair and maintenance.', '', 'Citywide', 1),
  ('authority-sanitation', 'Sanitation Services', 'Sanitation', 'Local sanitation services.', '', 'Citywide', 1),
  ('authority-other', 'General Civic Services', 'Other', 'General service routing for other civic issues.', '', 'Citywide', 1);