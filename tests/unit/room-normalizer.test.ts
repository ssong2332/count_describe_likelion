import { describe, it, expect } from 'vitest';
import { normalizeRoom } from '../../src/domain/room-normalizer';
import { endDeparture } from '../../src/domain/member-logic';

/**
 * Firebase Realtime Database는 빈 배열·빈 객체를 저장하지 않는다.
 * 따라서 로그가 아직 없는 인원은 읽어올 때 `logs` 키 자체가 사라져 undefined가 되고,
 * `member.logs.length` / `[...member.logs]` 가 전부 터진다.
 * (로컬 BroadcastChannel 모드는 localStorage가 빈 배열을 보존하므로 재현되지 않는다.)
 */
describe('normalizeRoom — Firebase 스냅샷 정규화', () => {
  const rawRoomWithoutLogs = {
    roomId: 'ZZDIAG',
    pin: '1234',
    createdAt: 1,
    members: {
      m1: { id: 'm1', name: '홍길동', isPresent: true, activeStatus: 'toilet', departureTime: 1000 },
    },
  };

  // 정상 케이스
  it('이미 온전한 룸은 값을 그대로 유지한다', () => {
    const room = normalizeRoom({
      roomId: 'R1',
      pin: '1',
      createdAt: 1,
      adminMemberIds: ['m1'],
      members: { m1: { id: 'm1', name: 'A', isPresent: true, activeStatus: 'none', logs: [{ id: 'l1', type: 'toilet', startAt: 1 }] } },
    });
    expect(room!.members.m1.logs).toHaveLength(1);
    expect(room!.adminMemberIds).toEqual(['m1']);
  });

  // 재현 케이스
  it('logs 키가 없는 인원에게 빈 배열을 채워준다', () => {
    const room = normalizeRoom(rawRoomWithoutLogs);
    expect(room!.members.m1.logs).toEqual([]);
  });

  it('정규화한 인원은 복귀 처리(endDeparture)에서 터지지 않는다', () => {
    const room = normalizeRoom(rawRoomWithoutLogs);
    const returned = endDeparture(room!.members.m1);
    expect(returned.activeStatus).toBe('none');
    expect(returned.logs).toHaveLength(1);
  });

  // 경계 케이스
  it('members 키가 통째로 없으면 빈 객체로 채운다', () => {
    const room = normalizeRoom({ roomId: 'R', pin: '1', createdAt: 1 });
    expect(room!.members).toEqual({});
    expect(room!.adminMemberIds).toEqual([]);
  });

  it('adminMemberIds가 Firebase 배열 결손으로 null이어도 빈 배열이 된다', () => {
    const room = normalizeRoom({ roomId: 'R', pin: '1', createdAt: 1, adminMemberIds: null, members: {} });
    expect(room!.adminMemberIds).toEqual([]);
  });

  it('activeStatus 키가 없으면 none으로 채운다', () => {
    const room = normalizeRoom({
      roomId: 'R', pin: '1', createdAt: 1,
      members: { m1: { id: 'm1', name: 'A', isPresent: false } },
    });
    expect(room!.members.m1.activeStatus).toBe('none');
    expect(room!.members.m1.isPresent).toBe(false);
  });

  // 예외 케이스
  it('null/undefined 스냅샷은 null을 반환한다', () => {
    expect(normalizeRoom(null)).toBeNull();
    expect(normalizeRoom(undefined)).toBeNull();
  });
});
