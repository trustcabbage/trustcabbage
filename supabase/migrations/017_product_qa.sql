-- 017: Product Q&A — questions and answers scoped to products_services.
-- Reading is public (anyone, including anonymous visitors and the widget).
-- Asking/answering requires auth; is_company_answer / is_verified_buyer are
-- computed server-side (never trusted from the client) in the server action.

create table if not exists product_questions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products_services(id) on delete cascade,
  asker_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists product_questions_product_idx
  on product_questions (product_id, created_at desc);

create table if not exists product_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references product_questions(id) on delete cascade,
  answerer_id uuid not null references users(id) on delete cascade,
  body text not null,
  is_company_answer boolean not null default false,
  is_verified_buyer boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_answers_question_idx
  on product_answers (question_id, created_at asc);

alter table product_questions enable row level security;
alter table product_answers enable row level security;

drop policy if exists "Public read product questions" on product_questions;
create policy "Public read product questions" on product_questions
  for select using (true);

drop policy if exists "Authenticated users ask questions" on product_questions;
create policy "Authenticated users ask questions" on product_questions
  for insert to authenticated with check (asker_id = auth.uid());

drop policy if exists "Public read product answers" on product_answers;
create policy "Public read product answers" on product_answers
  for select using (true);

drop policy if exists "Authenticated users answer questions" on product_answers;
create policy "Authenticated users answer questions" on product_answers
  for insert to authenticated with check (answerer_id = auth.uid());
