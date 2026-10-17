-- Project board schema.
-- Run this once in Supabase -> SQL Editor, then add your login email to
-- board_users (see the bottom of this file).

-- Who is allowed to use the board. Only editable from the Supabase dashboard.
create table if not exists public.board_users (
  email text primary key check (email = lower(email))
);

alter table public.board_users enable row level security;

create or replace function public.is_board_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.board_users
    where email = lower(auth.jwt() ->> 'email')
  );
$$;


-- People that tickets can be assigned to. They don't need a login.
create table if not exists public.ticket_members (
  id bigint generated always as identity primary key,
  name text not null unique check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);


-- Tasks and subtasks. A subtask is a ticket with a parent_id.
create table if not exists public.tickets (
  id bigint generated always as identity primary key,
  project text not null,
  parent_id bigint references public.tickets(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'blocked', 'done')),
  blocked_reason text not null default '',
  assignee_id bigint references public.ticket_members(id) on delete set null,
  story_points numeric(6, 1) not null default 0 check (story_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_parent_id_idx on public.tickets (parent_id);
create index if not exists tickets_project_idx on public.tickets (project);


-- Keep subtasks one level deep and in the same project as their parent.
create or replace function public.tickets_before_write()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  if new.parent_id is not null then
    if new.parent_id = new.id then
      raise exception 'A ticket cannot be its own subtask';
    end if;

    if exists (select 1 from public.tickets where id = new.parent_id and parent_id is not null) then
      raise exception 'Subtasks cannot have subtasks of their own';
    end if;

    if tg_op = 'UPDATE' and exists (select 1 from public.tickets where parent_id = new.id) then
      raise exception 'A ticket with subtasks cannot become a subtask';
    end if;

    select project into new.project from public.tickets where id = new.parent_id;
  end if;

  return new;
end;
$$;

drop trigger if exists tickets_before_write on public.tickets;
create trigger tickets_before_write
  before insert or update on public.tickets
  for each row execute function public.tickets_before_write();

create or replace function public.tickets_sync_children()
returns trigger
language plpgsql
as $$
begin
  if new.project is distinct from old.project then
    update public.tickets set project = new.project where parent_id = new.id;
  end if;
  return null;
end;
$$;

drop trigger if exists tickets_sync_children on public.tickets;
create trigger tickets_sync_children
  after update of project on public.tickets
  for each row execute function public.tickets_sync_children();


-- Row level security: only allow-listed, signed-in users can see or change anything.
alter table public.ticket_members enable row level security;
alter table public.tickets enable row level security;

drop policy if exists "board users manage members" on public.ticket_members;
create policy "board users manage members" on public.ticket_members
  for all to authenticated
  using (public.is_board_user())
  with check (public.is_board_user());

drop policy if exists "board users manage tickets" on public.tickets;
create policy "board users manage tickets" on public.tickets
  for all to authenticated
  using (public.is_board_user())
  with check (public.is_board_user());


-- Allow your login (use lowercase):
-- insert into public.board_users (email) values ('you@example.com');
