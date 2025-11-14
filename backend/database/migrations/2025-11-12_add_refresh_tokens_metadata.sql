-- Migration: add metadata columns to refresh tokens table
ALTER TABLE IF EXISTS auth_refresh_tokens
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;
