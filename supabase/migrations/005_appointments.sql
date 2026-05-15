create table appointments (
  id           uuid primary key default uuid_generate_v4(),
  client_id    uuid not null references profiles on delete cascade,
  barber_id    uuid not null references barbers on delete cascade,
  service_id   uuid not null references services on delete cascade,
  scheduled_at timestamptz not null,
  ends_at      timestamptz not null,
  status       appointment_status default 'pending',
  price_paid   numeric(10,2),
  notes        text,
  created_at   timestamptz default now()
);

-- Business rule: at most 1 active appointment per client at a time
create unique index one_active_appointment_per_client
  on appointments (client_id)
  where status in ('pending', 'confirmed', 'in_progress');
