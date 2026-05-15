-- Regular weekly working hours per barber
create table working_hours (
  id         uuid primary key default uuid_generate_v4(),
  barber_id  uuid not null references barbers on delete cascade,
  day        day_of_week not null,
  start_time time not null,
  end_time   time not null,
  is_active  boolean default true,
  unique (barber_id, day)
);

-- One-off blocks: vacation, personal time, lunch overrides
create table time_blocks (
  id         uuid primary key default uuid_generate_v4(),
  barber_id  uuid not null references barbers on delete cascade,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  reason     text,
  created_at timestamptz default now()
);
