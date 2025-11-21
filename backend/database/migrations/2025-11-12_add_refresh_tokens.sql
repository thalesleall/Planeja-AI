-- Migration: add refresh tokens table to support rotating refresh tokens
create table if not exists auth_refresh_tokens (
   id         uuid default gen_random_uuid() primary key,
   user_id    bigint not null
      references users ( id )
         on delete cascade,
   token      text not null,
   expires_at timestamp with time zone not null,
   created_at timestamp with time zone default now()
);

-- Optional index for token lookup
create index if not exists idx_auth_refresh_tokens_token on
   auth_refresh_tokens (
      token
   );