-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum ('client', 'barber', 'owner', 'admin');
create type appointment_status as enum ('pending','confirmed','in_progress','completed','cancelled','no_show');
create type subscription_status as enum ('active','past_due','cancelled','trialing');
create type payment_method as enum ('card','pix','cash');
create type payment_status as enum ('pending','paid','failed','refunded');
create type day_of_week as enum ('mon','tue','wed','thu','fri','sat','sun');
