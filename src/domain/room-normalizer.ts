import { DepartureType, Member, Room, StatusLog } from './types';

/**
 * Firebase Realtime Database 스냅샷 정규화.
 *
 * RTDB는 빈 배열·빈 객체를 저장하지 않으므로, 읽어온 데이터에는
 * `members`, `adminMemberIds`, 인원별 `logs` 키가 통째로 사라져 있을 수 있다.
 * 정규화하지 않으면 `member.logs.length` / `[...member.logs]` 가 런타임에서 터진다.
 */
export function normalizeMember(raw: any): Member {
  const logs: StatusLog[] = Array.isArray(raw?.logs) ? raw.logs : [];

  return {
    ...raw,
    id: raw?.id,
    name: raw?.name ?? '',
    isPresent: raw?.isPresent === true,
    activeStatus: (raw?.activeStatus ?? 'none') as DepartureType,
    logs,
  };
}

export function normalizeRoom(raw: any): Room | null {
  if (!raw) return null;

  const rawMembers = raw.members && typeof raw.members === 'object' ? raw.members : {};
  const members: Record<string, Member> = {};
  for (const [id, m] of Object.entries(rawMembers)) {
    members[id] = normalizeMember(m);
  }

  return {
    ...raw,
    roomId: raw.roomId,
    pin: raw.pin,
    createdAt: raw.createdAt,
    adminMemberIds: Array.isArray(raw.adminMemberIds) ? raw.adminMemberIds : [],
    members,
  };
}
