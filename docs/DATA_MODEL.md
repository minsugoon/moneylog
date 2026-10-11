# Moneylog 데이터 구조 (Supabase)

- 버전: v0.5 / 최종 수정: 2026-10-09
- 원칙: 모든 표는 `user_id = auth.uid()`인 행만 읽고 쓴다 (RLS). 전체 카드·계좌번호는 저장하지 않는다.
- DB를 바꾸면 이 문서도 같이 고친다.

## 1. 표 한눈에 보기
| 표 | 역할 | 쉬운 비유 |
|----|------|-----------|
| accounts | 카드·통장·현금 등록 | 지갑 속 결제수단 목록 |
| transactions | 지출 내역 | 가계부 본문 |
| fixed_rules | 고정지출 자동 인식 규칙 | "이 이름이면 통신비" 메모장 |
| card_programs | 카드 실적 프로그램 | 카드별 "월 N원 이상 쓰기" 미션 |
| card_benefits | 실적 달성 혜택 | 미션 달성 보상 |
| exclusion_rules | 실적 제외 키워드 사전 | "이 단어가 있으면 실적 제외될 수 있음" 목록 |
| daily_notes | 날짜별 하루 정리(일기) | 가계부 속 일기장 한 쪽 |

## 2. 실행 순서 (SCHEDULE.md와 연결)
| 번호 | 내용 | 실행 시점 |
|------|------|-----------|
| 1~4 | 결제수단, 내역, 고정지출 표 + 보안 | 단계 2 |
| 5 | 하루 정리(일기) 표 + 보안 | 단계 4 |
| 6~7 | 카드 실적, 혜택 표 + 보안 | 단계 9 |
| 8 | 제외 키워드 표 + 보안 | 단계 10 |

한 번에 모두 실행해도 문제는 없다. 새 프로젝트에서 **SQL Editor**에 붙여넣고 **Run**.

## 3. SQL 전체본

### 1) 결제수단 (카드/통장/현금)
```sql
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'card' check (kind in ('card','cash','account')),
  issuer text,
  last4 text check (last4 is null or last4 ~ '^[0-9]{4}$'),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
```

### 2) 지출 내역
```sql
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  used_at date not null,
  merchant text not null,
  amount integer not null check (amount >= 0),
  discount integer not null default 0 check (discount >= 0),
  installment_months int not null default 1 check (installment_months >= 1),
  is_fixed boolean not null default false,
  fixed_type text check (fixed_type in ('통신','구독','렌탈','적금','기부','보험','기타고정')),
  source text not null default 'manual' check (source in ('manual','csv','paste','sms')),
  import_hash text,
  memo text check (memo is null or char_length(memo) <= 200),
  is_cancel boolean not null default false,
  interest_free boolean not null default false,
  performance_override text
    check (performance_override is null or performance_override in ('include','exclude')),
  created_at timestamptz not null default now(),
  unique (user_id, import_hash)
);

create index transactions_user_date_idx on public.transactions (user_id, used_at desc);
create index transactions_account_idx on public.transactions (account_id);
```

### 3) 고정지출 자동 인식 규칙
```sql
create table public.fixed_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  merchant_keyword text not null,
  fixed_type text not null check (fixed_type in ('통신','구독','렌탈','적금','기부','보험','기타고정')),
  created_at timestamptz not null default now(),
  unique (user_id, merchant_keyword)
);
```

### 4) 보안 (1~3번 표)
```sql
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.fixed_rules enable row level security;

create policy "own accounts" on public.accounts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own transactions" on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own fixed_rules" on public.fixed_rules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

### 5) 하루 정리 (일기) + 보안
```sql
create table public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  note_date date not null,
  body text not null check (char_length(body) between 1 and 2000),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, note_date)
);

create index daily_notes_user_date_idx on public.daily_notes (user_id, note_date desc);

alter table public.daily_notes enable row level security;
create policy "own daily_notes" on public.daily_notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```
- 하루에 한 편만 저장한다 (`unique (user_id, note_date)`). 저장은 "있으면 고치고 없으면 만드는" 방식(upsert)으로 한다.
- 내용을 지우면 그 행을 삭제한다 (빈 글은 저장하지 않음).
- 지출이 없는 날에도 저장할 수 있다.
- 지출 내역(transactions)을 지워도 하루 정리는 남는다.

### 6) 카드 실적 프로그램
```sql
create table public.card_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  target_amount integer not null check (target_amount > 0),
  measure_basis text not null default 'previous_month'
    check (measure_basis in ('current_month','previous_month')),
  installment_mode text not null default 'full'
    check (installment_mode in ('full','monthly')),
  period_start_day int not null default 1
    check (period_start_day between 1 and 28),
  exclude_keywords text[] not null default '{}',
  exclusion_modes jsonb not null default '{
    "loan": "exclude", "fee": "exclude", "cancel": "exclude",
    "tax": "exclude", "fine": "exclude",
    "giftcard": "flag", "utility": "flag", "school": "flag",
    "insurance4": "flag", "interest_free": "flag"
  }'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index card_programs_user_idx on public.card_programs (user_id, is_active);
```
- `exclusion_modes` 값: `exclude`(제외) / `flag`(표시만) / `ignore`(무시)

### 7) 카드 혜택 + 보안
```sql
create table public.card_benefits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  program_id uuid not null references public.card_programs(id) on delete cascade,
  name text not null,
  required_amount integer check (required_amount is null or required_amount > 0),
  benefit_amount integer not null default 0 check (benefit_amount >= 0),
  benefit_kind text not null default '기타'
    check (benefit_kind in ('렌탈','통신','구독','보험','기타')),
  linked_keyword text,
  memo text,
  created_at timestamptz not null default now()
);

create index card_benefits_program_idx on public.card_benefits (program_id);

alter table public.card_programs enable row level security;
alter table public.card_benefits enable row level security;

create policy "own card_programs" on public.card_programs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own card_benefits" on public.card_benefits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```
- `required_amount`가 비어 있으면 프로그램의 `target_amount`를 쓴다.

### 8) 실적 제외 키워드 사전 + 보안
```sql
create table public.exclusion_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null
    check (category in ('loan','fee','cancel','tax','fine',
                        'giftcard','utility','school','insurance4')),
  keyword text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, category, keyword)
);

create index exclusion_rules_user_idx on public.exclusion_rules (user_id, is_active);

alter table public.exclusion_rules enable row level security;
create policy "own exclusion_rules" on public.exclusion_rules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```
- `interest_free`(무이자 할부)는 키워드가 아니라 내역의 체크 칸으로 판단하므로 `category`에 없다.
- 기본 키워드는 SQL이 아니라 **앱이 첫 로그인 때 자동 등록**한다. (목록 수정이 쉽도록)

## 4. 칸 설명 (헷갈리기 쉬운 것)
| 칸 | 의미 |
|----|------|
| transactions.amount | 항상 0 이상. 취소 건은 `is_cancel = true`로 표시하고 계산 때 마이너스로 처리 |
| transactions.discount | 이용금액에서 빠지는 할인액 |
| transactions.memo | 그 지출에 남기는 한 줄 메모 (최대 200자). 비워도 됨 |
| daily_notes.body | 그날의 하루 정리 글 (1~2,000자) |
| transactions.import_hash | 날짜+결제명+금액+결제수단으로 만든 지문. 같은 내역 중복 저장 방지 |
| transactions.performance_override | 사용자가 정한 실적 처리. `include`=실적 포함 확정, `exclude`=실적 제외 확정, 비어 있으면 자동 판정 |
| transactions.interest_free | 무이자 할부 결제 여부 (직접 체크) |
| card_programs.measure_basis | `previous_month`=지난달 사용액이 이번 달 혜택 결정, `current_month`=이번 달 사용액이 이번 달 혜택 결정 |
| card_programs.installment_mode | `full`=사용한 달에 할부 전액 인정, `monthly`=월 납부액만 인정 |
| card_programs.period_start_day | 실적 집계 시작일. 1이면 달력 기준 |

## 5. 삭제 시 동작
| 지우는 것 | 결과 |
|-----------|------|
| 결제수단(accounts) | 그 내역은 남고 결제수단이 "미지정"이 됨. 그 카드의 실적 프로그램·혜택은 함께 삭제 |
| 실적 프로그램 | 그 혜택도 함께 삭제. 내역은 그대로 |
| 하루 정리(daily_notes) | 그날의 지출 내역은 그대로 |
| 내 계정 | 내 모든 데이터 삭제 |

## 6. 선택 사항 (결정 후 적용)
수입(입금) 기록을 넣기로 하면 아래 한 줄을 실행하고, 이 문서와 CLAUDE.md의 데이터 구조도 갱신한다.
```sql
alter table public.transactions
  add column if not exists type text not null default 'expense'
  check (type in ('expense','income'));
```

## 7. 확인 방법
- **Table Editor**에서 표 7개가 보이는지 확인
- 각 표 옆에 RLS 표시(자물쇠)가 켜져 있는지 확인
- 다른 계정으로 로그인했을 때 내 데이터가 보이지 않는지 확인 (단계 12 보안 점검)
