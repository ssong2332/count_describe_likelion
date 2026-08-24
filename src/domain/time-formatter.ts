export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeKorean(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatTimeRange(startAt: number, endAt?: number): string {
  const start = formatTimeKorean(startAt);
  if (!endAt) return `${start} ~ 진행 중`;
  const end = formatTimeKorean(endAt);
  return `${start} ~ ${end}`;
}

export function calculateTotalDuration(logs: { durationSeconds?: number }[]): number {
  return logs.reduce((acc, log) => acc + (log.durationSeconds || 0), 0);
}
