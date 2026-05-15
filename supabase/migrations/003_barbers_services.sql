create table barbers (
  id               uuid primary key default uuid_generate_v4(),
  profile_id       uuid not null references profiles on delete cascade,
  bio              text,
  commission_rate  numeric(5,2) default 50.00,
  is_active        boolean default true,
  created_at       timestamptz default now(),
  unique (profile_id)
);

create table services (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  description      text,
  price            numeric(10,2) not null,
  duration_minutes int not null,
  category         text,
  image_url        text,
  is_active        boolean default true,
  created_at       timestamptz default now()
);

-- Many-to-many: which services a barber performs
create table barber_services (
  barber_id  uuid not null references barbers on delete cascade,
  service_id uuid not null references services on delete cascade,
  primary key (barber_id, service_id)
);
