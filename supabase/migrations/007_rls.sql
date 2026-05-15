-- ─── profiles ───────────────────────────────────────────────
alter table profiles enable row level security;

create policy "user: own profile full access"
  on profiles for all
  using (auth.uid() = id);

create policy "owner/admin: read all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- ─── services ───────────────────────────────────────────────
alter table services enable row level security;

create policy "public: read active services"
  on services for select
  using (is_active = true);

create policy "owner/admin: manage services"
  on services for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- ─── barbers ────────────────────────────────────────────────
alter table barbers enable row level security;

create policy "public: read active barbers"
  on barbers for select
  using (is_active = true);

create policy "barber: own record full access"
  on barbers for all
  using (profile_id = auth.uid());

create policy "owner/admin: manage barbers"
  on barbers for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- ─── barber_services ────────────────────────────────────────
alter table barber_services enable row level security;

create policy "public: read barber_services"
  on barber_services for select
  using (true);

create policy "owner/admin: manage barber_services"
  on barber_services for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- ─── working_hours ──────────────────────────────────────────
alter table working_hours enable row level security;

create policy "public: read working_hours"
  on working_hours for select
  using (true);

create policy "barber: manage own working_hours"
  on working_hours for all
  using (
    exists (
      select 1 from barbers b
      where b.id = barber_id and b.profile_id = auth.uid()
    )
  );

create policy "owner/admin: manage all working_hours"
  on working_hours for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- ─── time_blocks ────────────────────────────────────────────
alter table time_blocks enable row level security;

create policy "barber: manage own time_blocks"
  on time_blocks for all
  using (
    exists (
      select 1 from barbers b
      where b.id = barber_id and b.profile_id = auth.uid()
    )
  );

create policy "owner/admin: manage all time_blocks"
  on time_blocks for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "public: read time_blocks"
  on time_blocks for select
  using (true);

-- ─── appointments ───────────────────────────────────────────
alter table appointments enable row level security;

create policy "client: own appointments full access"
  on appointments for all
  using (auth.uid() = client_id);

create policy "barber: read own appointments"
  on appointments for select
  using (
    exists (
      select 1 from barbers b
      where b.id = barber_id and b.profile_id = auth.uid()
    )
  );

create policy "barber: update own appointments"
  on appointments for update
  using (
    exists (
      select 1 from barbers b
      where b.id = barber_id and b.profile_id = auth.uid()
    )
  );

create policy "owner/admin: all appointments"
  on appointments for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- ─── subscriptions ──────────────────────────────────────────
alter table subscriptions enable row level security;

create policy "client: own subscription"
  on subscriptions for select
  using (auth.uid() = client_id);

create policy "owner/admin: all subscriptions"
  on subscriptions for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- ─── reviews ────────────────────────────────────────────────
alter table reviews enable row level security;

create policy "public: read reviews"
  on reviews for select
  using (true);

create policy "client: insert own review"
  on reviews for insert
  with check (auth.uid() = client_id);

create policy "owner/admin: manage reviews"
  on reviews for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- ─── notifications ──────────────────────────────────────────
alter table notifications enable row level security;

create policy "user: own notifications"
  on notifications for all
  using (auth.uid() = user_id);

create policy "owner/admin: all notifications"
  on notifications for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
