-- seed.sql
-- Reference data: the 10 CFA Level I topics with official weight ranges, plus an
-- active 2026 curriculum version. Idempotent so it is safe to re-run.

-- On conflict we intentionally leave is_active untouched so a re-seed never
-- overrides an admin-chosen active curriculum version.
insert into public.curriculum_versions (year, level, is_active, notes)
values (2026, 'I', true, 'Initial active Level I curriculum version.')
on conflict (year, level) do update set notes = excluded.notes;

-- Topic weight ranges below are our own published estimates of the Level I bands,
-- not an official CFA Institute data feed.
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

-- Dummy, founder-authored source material only (no official/copyrighted content).
insert into public.source_documents (id, title, source_type, source_license)
values (
  '00000000-0000-0000-0000-000000000001',
  'Founder Notes — Core Concepts (dummy, original)',
  'founder_notes',
  'internal-original'
)
on conflict (id) do nothing;

insert into public.source_chunks (id, source_document_id, topic_code, chunk_text, chunk_hash)
values
  (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'QM',
    'The time value of money links present and future cash flows through a discount rate.',
    'dummy-hash-qm-1'
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    'FI',
    'Duration approximates the sensitivity of a bond price to a small change in yield.',
    'dummy-hash-fi-1'
  )
on conflict (id) do nothing;
