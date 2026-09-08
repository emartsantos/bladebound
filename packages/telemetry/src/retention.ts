export interface DailyLoginState {
  currentStreak: number;
  bestStreak: number;
  lastLoginDate: string;
  lastClaimedDate: string | null;
  claimedToday: boolean;
}

export interface DailyReward {
  gold: number;
  xp: number;
  label: string;
}

export interface DailyClaimResult {
  state: DailyLoginState;
  dayInStreak: number;
  reward: DailyReward;
  reset: boolean;
}

export const DAILY_REWARD_TIERS: DailyReward[] = [
  { gold: 25, xp: 50, label: 'Day 1' },
  { gold: 50, xp: 100, label: 'Day 2' },
  { gold: 100, xp: 200, label: 'Day 3' },
  { gold: 150, xp: 300, label: 'Day 4' },
  { gold: 200, xp: 400, label: 'Day 5' },
  { gold: 300, xp: 600, label: 'Day 6' },
  { gold: 500, xp: 1000, label: 'Day 7' },
];

export function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function dayKeyToMs(key: string): number {
  const [year, month, day] = key.split('-').map((part) => parseInt(part, 10));
  return Date.UTC(year, month - 1, day);
}

export function dayDifference(a: string, b: string): number {
  return Math.round((dayKeyToMs(b) - dayKeyToMs(a)) / 86_400_000);
}

export function isConsecutiveDay(previousDay: string, today: string, graceDays = 0): boolean {
  const diff = dayDifference(previousDay, today);
  return diff >= 1 && diff <= 1 + graceDays;
}

export function dailyRewardFor(dayInStreak: number): DailyReward {
  const index = ((dayInStreak - 1) % DAILY_REWARD_TIERS.length + DAILY_REWARD_TIERS.length) % DAILY_REWARD_TIERS.length;
  return DAILY_REWARD_TIERS[index];
}

export function claimDailyLogin(state: DailyLoginState, today: string, graceDays = 0): DailyClaimResult {
  const isSameDay = state.lastClaimedDate === today;
  if (isSameDay) {
    return { state, dayInStreak: state.currentStreak, reward: dailyRewardFor(state.currentStreak), reset: false };
  }
  const isConsecutive =
    state.lastClaimedDate != null && isConsecutiveDay(state.lastClaimedDate, today, graceDays);
  const dayInStreak = isConsecutive ? state.currentStreak + 1 : 1;
  const next: DailyLoginState = {
    currentStreak: dayInStreak,
    bestStreak: state.bestStreak,
    lastLoginDate: today,
    lastClaimedDate: today,
    claimedToday: true,
  };
  if (dayInStreak > next.bestStreak) next.bestStreak = dayInStreak;
  return {
    state: next,
    dayInStreak,
    reward: dailyRewardFor(dayInStreak),
    reset: !isConsecutive,
  };
}

export function newDay(state: DailyLoginState, today: string): DailyLoginState {
  if (state.lastLoginDate === today) return state;
  return { ...state, lastLoginDate: today, claimedToday: false };
}

export function shouldShowAchievementReminder(options: {
  availableAchievements: number;
  lastReminderAt: number | null;
  now: number;
  intervalMs: number;
  minimumAvailable?: number;
}): boolean {
  const { availableAchievements, lastReminderAt, now, intervalMs, minimumAvailable = 1 } = options;
  if (availableAchievements < minimumAvailable) return false;
  if (lastReminderAt == null) return true;
  return now - lastReminderAt >= intervalMs;
}