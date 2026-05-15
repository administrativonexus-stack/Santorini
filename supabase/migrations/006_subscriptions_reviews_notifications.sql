create table subscriptions (
  id                      uuid primary key default uuid_generate_v4(),
  client_id               uuid not null references profiles on delete cascade,
  stripe_subscription_id  text unique,
  stripe_customer_id      text,
  status                  subscription_status default 'active',
  plan_name               text default 'VIP BARBERFLIX',
  price                   numeric(10,2) default 89.90,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  created_at              timestamptz default now()
);

create table reviews (
  id             uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references appointments on delete cascade,
  client_id      uuid not null references profiles,
  barber_id      uuid not null references barbers,
  rating         int check (rating between 1 and 5),
  comment        text,
  created_at     timestamptz default now(),
  unique (appointment_id)
);

create table notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles on delete cascade,
  title      text not null,
  body       text,
  type       text,
  read       boolean default false,
  created_at timestamptz default now()
);
