import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatTimeRange,
  calculateTotalDuration,
} from '../../src/domain/time-formatter';

describe('Time Formatter Utility', () => {
  it('should format seconds into MM:SS correctly', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(5)).toBe('00:05');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(599)).toBe('09:59');
  });

  it('should format seconds over 1 hour into HH:MM:SS', () => {
    expect(formatDuration(3600)).toBe('01:00:00');
    expect(formatDuration(3665)).toBe('01:01:05');
  });

  it('should handle negative seconds gracefully by returning 00:00', () => {
    expect(formatDuration(-10)).toBe('00:00');
  });

  it('should format ongoing time range when endAt is undefined', () => {
    const startAt = new Date('2026-08-24T14:30:00').getTime();
    const result = formatTimeRange(startAt);
    expect(result).toContain('14:30:00 ~ 진행 중');
  });

  it('should format completed time range', () => {
    const startAt = new Date('2026-08-24T14:30:00').getTime();
    const endAt = new Date('2026-08-24T14:35:10').getTime();
    const result = formatTimeRange(startAt, endAt);
    expect(result).toContain('14:30:00 ~ 14:35:10');
  });

  it('should calculate total duration from logs', () => {
    const logs = [
      { durationSeconds: 60 },
      { durationSeconds: 120 },
      { durationSeconds: 15 },
    ];
    expect(calculateTotalDuration(logs)).toBe(195);
  });
});
