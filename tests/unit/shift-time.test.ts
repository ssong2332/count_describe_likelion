import { describe, it, expect } from 'vitest';
import {
  PRESET_SHIFTS,
  parseShiftTimes,
  toggleShiftTime,
  formatShiftTimes,
} from '../../src/domain/shift-time';
import { buildScheduleBlocks } from '../../src/domain/member-logic';
import { Member } from '../../src/domain/types';

describe('shift-time — 1시간 단위 시간대 다중 선택', () => {
  // 정상 케이스
  it('프리셋은 1시간 단위이고 끝나는 시각이 다음 시작과 맞물린다', () => {
    expect(PRESET_SHIFTS[0]).toBe('12:00 ~ 13:00');
    expect(PRESET_SHIFTS[1]).toBe('13:00 ~ 14:00');
    expect(PRESET_SHIFTS[PRESET_SHIFTS.length - 1]).toBe('17:00 ~ 18:00');
    for (const s of PRESET_SHIFTS) {
      const [start, end] = s.split('~').map((v) => v.trim());
      expect(Number(end.slice(0, 2)) - Number(start.slice(0, 2))).toBe(1);
    }
  });

  it('선택하지 않은 시간대를 누르면 추가한다', () => {
    expect(toggleShiftTime('', '12:00 ~ 13:00')).toBe('12:00 ~ 13:00');
    expect(toggleShiftTime('12:00 ~ 13:00', '14:00 ~ 15:00')).toBe(
      '12:00 ~ 13:00, 14:00 ~ 15:00'
    );
  });

  it('이미 선택된 시간대를 누르면 해제한다', () => {
    expect(toggleShiftTime('12:00 ~ 13:00, 14:00 ~ 15:00', '12:00 ~ 13:00')).toBe(
      '14:00 ~ 15:00'
    );
  });

  it('선택 순서와 무관하게 시간 순으로 정렬해 저장한다', () => {
    const after = toggleShiftTime('16:00 ~ 17:00', '13:00 ~ 14:00');
    expect(after).toBe('13:00 ~ 14:00, 16:00 ~ 17:00');
  });

  // 경계 케이스
  it('마지막 하나를 해제하면 빈 문자열이 된다', () => {
    expect(toggleShiftTime('12:00 ~ 13:00', '12:00 ~ 13:00')).toBe('');
  });

  it('기존 단일 값(구 5분 초과 형식)도 그대로 읽어낸다', () => {
    expect(parseShiftTimes('12:00 ~ 13:05')).toEqual(['12:00 ~ 13:05']);
  });

  it('직접 입력한 값과 프리셋이 섞여도 유지한다', () => {
    const merged = toggleShiftTime('점심 교대', '12:00 ~ 13:00');
    expect(parseShiftTimes(merged)).toContain('점심 교대');
    expect(parseShiftTimes(merged)).toContain('12:00 ~ 13:00');
  });

  // 예외 케이스
  it('빈 값과 공백만 있는 값은 빈 목록으로 읽는다', () => {
    expect(parseShiftTimes('')).toEqual([]);
    expect(parseShiftTimes('   ')).toEqual([]);
    expect(parseShiftTimes(undefined)).toEqual([]);
  });

  it('중복 입력과 빈 조각은 걸러낸다', () => {
    expect(formatShiftTimes(['12:00 ~ 13:00', '', '12:00 ~ 13:00', '  '])).toBe('12:00 ~ 13:00');
  });

  // 기존 스케줄 그룹핑과의 호환
  it('다중 선택한 인원은 선택한 시간대마다 스케줄 블록에 나타난다', () => {
    const member = {
      id: 'm1',
      name: '홍길동',
      isPresent: true,
      activeStatus: 'none',
      logs: [],
      group: '전우조1',
      shiftTime: '12:00 ~ 13:00, 14:00 ~ 15:00',
    } as Member;

    const blocks = buildScheduleBlocks([member]);
    const times = blocks.map((b) => b.shiftTime);

    expect(times).toContain('12:00 ~ 13:00');
    expect(times).toContain('14:00 ~ 15:00');
  });
});
