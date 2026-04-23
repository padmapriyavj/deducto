-- Betcha fields used by backend/intelligence/betcha/service.py (place + resolve).
-- Safe to re-run: uses IF NOT EXISTS.

ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS betcha_placed_at timestamptz,
  ADD COLUMN IF NOT EXISTS betcha_stake_coins integer,
  ADD COLUMN IF NOT EXISTS betcha_locked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.quiz_attempts.betcha_placed_at IS 'When the learner locked in a Betcha wager (PRD §7.7).';
COMMENT ON COLUMN public.quiz_attempts.betcha_stake_coins IS 'Coins staked for Betcha (50, 100, or 200).';
COMMENT ON COLUMN public.quiz_attempts.betcha_locked IS 'Server-side lock flag for Betcha UI state.';
