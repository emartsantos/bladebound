import { describe, expect, it } from 'vitest';
import {
  DAILY_REWARD_TIERS,
  claimDailyLogin,
  dailyRewardFor,
  dayDifference,
  isConsecutiveDay,
  newDay,
  shouldShowAchievementReminder,
} from '../src/retention';

const fresh = { currentStreak: 0, bestStreak: 0, lastLoginDate: '', lastClaimedDate: null, claimedToday: false };

describe('day math', () => {
  it('computes day differences via UTC', () => {
    expect(dayDifference('2026-09-06', '2026-09-07')).toBe(1);
    expect(dayDifference('2026-09-07', '2026-09-07')).toBe(0);
    expect(dayDifference('2026-08-31', '2026-09-01')).toBe(1);
  });

  it('isConsecutiveDay honours grace days', () => {
    expect(isConsecutiveDay('2026-09-06', '2026-09-07')).toBe(true);
    expect(isConsecutiveDay('2026-09-06', '2026-09-08')).toBe(false);
    expect(isConsecutiveDay('2026-09-06', '2026-09-08', 1)).toBe(true);
    expect(isConsecutiveDay('2026-09-06', '2026-09-06', 3)).toBe(false);
  });
});

describe('daily rewards', () => {
  it('cycles the weekly tier table', () => {
    expect(dailyRewardFor(1)).toBe(DAILY_REWARD_TIERS[0]);
    expect(dailyRewardFor(7)).toBe(DAILY_REWARD_TIERS[6]);
    expect(dailyRewardFor(8)).toBe(DAILY_REWARD_TIERS[0]);
  });
});

describe('claimDailyLogin', () => {
  it('starts a fresh streak on first claim', () => {
    const { state, dayInStreak, reset, reward } = claimDailyLogin(fresh, '2026-09-07');
    expect(dayInStreak).toBe(1);
    expect(reset).toBe(true);
    expect(state.currentStreak).toBe(1);
    expect(state.bestStreak).toBe(1);
    expect(state.claimedToday).toBe(true);
    expect(reward.gold).toBe(25);
  });

  it('extends streak on consecutive day', () => {
    const first = claimDailyLogin(fresh, '2026-09-07').state;
    const second = claimDailyLogin(first, '2026-09-08');
    expect(second.dayInStreak).toBe(2);
    expect(second.reset).toBe(false);
    expect(second.reward.gold).toBe(50);
    expect(second.state.bestStreak).toBe(2);
  });

  it('resets streak after a missed day', () => {
    const first = claimDailyLogin(fresh, '2026-09-07').state;
    const skipped = claimDailyLogin(first, '2026-09-09');
    expect(skipped.dayInStreak).toBe(1);
    expect(skipped.reset).toBe(true);
    // best streak is preserved
    expect(skipped.state.bestStreak).toBe(1);
  });

  it('does not double-claim the same day', () => {
    const first = claimDailyLogin(fresh, '2026-09-07').state;
    const second = claimDailyLogin(first, '2026-09-07');
    expect(second.dayInStreak).toBe(1);
    expect(second.reset).toBe(false);
    expect(second.state.currentStreak).toBe(1);
  });

  it('grace days allow a near-miss to keep the streak', () => {
    const first = claimDailyLogin(fresh, '2026-09-07').state;
    const withGrace = claimDailyLogin(first, '2026-09-09', 1);
    expect(withGrace.dayInStreak).toBe(2);
    expect(withGrace.reset).toBe(false);
  });
});

describe('newDay', () => {
  it('clears claimedToday when the calendar day changes', () => {
    let state = claimDailyLogin(fresh, '2026-09-07').state;
    expect(state.claimedToday).toBe(true);
    state = newDay(state, '2026-09-08');
    expect(state.claimedToday).toBe(false);
    expect(state.lastLoginDate).toBe('2026-09-08');
    expect(state.currentStreak).toBe(1);
  });

  it('is a no-op on the same day', () => {
    const state = claimDailyLogin(fresh, '2026-09-07').state;
    expect(newDay(state, '2026-09-07')).toBe(state);
  });
});

describe('achievement reminders', () => {
  it('shows when none yet sent', () => {
    expect(shouldShowAchievementReminder({ availableAchievements: 3, lastReminderAt: null, now: 1000, intervalMs: 86_400_000 })).toBe(true);
  });

  it('shows only after interval elapsed', () => {
    const base = { availableAchievements: 2, intervalMs: 1000 };
    expect(shouldShowAchievementReminder({ ...base, lastReminderAt: 0, now: 999 })).toBe(false);
    expect(shouldShowAchievementReminder({ ...base, lastReminderAt: 0, now: 1000 })).toBe(true);
  });

  it('skips when nothing is available', () => {
    expect(shouldShowAchievementReminder({ availableAchievements: 0, lastReminderAt: null, now: 0, intervalMs: 1 })).toBe(false);
  });
});