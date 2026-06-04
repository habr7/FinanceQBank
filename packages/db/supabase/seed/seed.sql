-- seed.sql
-- Reference data: the 10 CFA Level I topics with official weight ranges, plus an
-- active 2026 curriculum version. Idempotent so it is safe to re-run.

insert into public.curriculum_versions (year, level, is_active, notes)
values (2026, 'I', true, 'Initial active Level I curriculum version.')
on conflict (year, level) do update set is_active = excluded.is_active;

insert into public.topics (code, name, exam_weight_min, exam_weight_max, display_order)
values
  ('ETH', 'Ethical and Professional Standards', 15, 20, 1),
  ('QM', 'Quantitative Methods', 6, 9, 2),
  ('ECON', 'Economics', 6, 9, 3),
  ('FSA', 'Financial Statement Analysis', 11, 14, 4),
  ('CI', 'Corporate Issuers', 6, 9, 5),
  ('EQ', 'Equity Investments', 11, 14, 6),
  ('FI', 'Fixed Income', 11, 14, 7),
  ('DER', 'Derivatives', 5, 8, 8),
  ('AI', 'Alternative Investments', 7, 10, 9),
  ('PM', 'Portfolio Management', 8, 12, 10)
on conflict (code) do update set
  name = excluded.name,
  exam_weight_min = excluded.exam_weight_min,
  exam_weight_max = excluded.exam_weight_max,
  display_order = excluded.display_order;
