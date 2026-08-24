import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordRoomVisit,
  getRoomHistory,
  forgetRoom,
  clearRoomHistory,
  ROOM_HISTORY_LIMIT,
} from '../../src/services/room-history';

beforeEach(() => {
  clearRoomHistory();
});

describe('room-history — 이 기기가 접속했던 룸 기록', () => {
  // 정상 케이스
  it('접속한 룸을 기록하고 다시 읽어온다', () => {
    recordRoomVisit('LIKELION', 'admin');
    const history = getRoomHistory();

    expect(history).toHaveLength(1);
    expect(history[0].roomId).toBe('LIKELION');
    expect(history[0].role).toBe('admin');
    expect(typeof history[0].visitedAt).toBe('number');
  });

  it('최근 접속이 앞에 오도록 정렬한다', () => {
    recordRoomVisit('OLD', 'admin');
    recordRoomVisit('NEW', 'user');

    expect(getRoomHistory().map((r) => r.roomId)).toEqual(['NEW', 'OLD']);
  });

  // 경계 케이스
  it('같은 룸을 다시 방문하면 중복 없이 맨 앞으로 올린다', () => {
    recordRoomVisit('A', 'admin');
    recordRoomVisit('B', 'admin');
    recordRoomVisit('A', 'user');

    const history = getRoomHistory();
    expect(history.map((r) => r.roomId)).toEqual(['A', 'B']);
    expect(history[0].role).toBe('user');
  });

  it('룸 코드는 대문자로 정규화해 같은 룸으로 취급한다', () => {
    recordRoomVisit('likelion', 'admin');
    recordRoomVisit('LIKELION', 'admin');

    expect(getRoomHistory()).toHaveLength(1);
    expect(getRoomHistory()[0].roomId).toBe('LIKELION');
  });

  it(`기록은 ${ROOM_HISTORY_LIMIT}개를 넘지 않고 오래된 것부터 밀려난다`, () => {
    for (let i = 1; i <= ROOM_HISTORY_LIMIT + 3; i++) {
      recordRoomVisit(`ROOM${i}`, 'admin');
    }

    const history = getRoomHistory();
    expect(history).toHaveLength(ROOM_HISTORY_LIMIT);
    expect(history[0].roomId).toBe(`ROOM${ROOM_HISTORY_LIMIT + 3}`);
    expect(history.some((r) => r.roomId === 'ROOM1')).toBe(false);
  });

  it('목록에서 빼면 그 룸만 사라진다 (다른 기록은 유지)', () => {
    recordRoomVisit('A', 'admin');
    recordRoomVisit('B', 'admin');

    forgetRoom('A');

    expect(getRoomHistory().map((r) => r.roomId)).toEqual(['B']);
  });

  // 예외 케이스
  it('빈 룸 코드는 기록하지 않는다', () => {
    recordRoomVisit('   ', 'admin');
    expect(getRoomHistory()).toEqual([]);
  });

  it('저장된 값이 깨져 있어도 빈 목록을 반환하고 터지지 않는다', () => {
    localStorage.setItem('count_status_room_history', '{나쁜 JSON');
    expect(getRoomHistory()).toEqual([]);
  });

  it('저장된 값이 배열이 아니면 빈 목록으로 취급한다', () => {
    localStorage.setItem('count_status_room_history', '{"roomId":"X"}');
    expect(getRoomHistory()).toEqual([]);
  });
});
