/**
 * 이 기기가 접속했던 룸 기록.
 *
 * 보안 규칙이 전체 룸 열거(/rooms 조회)를 막기 때문에, 룸 목록은 서버에서
 * 받아오지 않고 기기에 남은 접속 이력으로 구성한다. 각 룸의 현재 정보는
 * 룸 코드를 알고 있으므로 개별 조회로 채운다.
 */
const STORAGE_KEY = 'count_status_room_history';

export const ROOM_HISTORY_LIMIT = 10;

export interface RoomHistoryEntry {
  roomId: string;
  role: 'admin' | 'user';
  visitedAt: number;
}

function readRaw(): RoomHistoryEntry[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RoomHistoryEntry => !!e && typeof e.roomId === 'string' && e.roomId.length > 0
    );
  } catch {
    return [];
  }
}

function write(entries: RoomHistoryEntry[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('[room-history] 기록 저장 실패:', e);
  }
}

export function getRoomHistory(): RoomHistoryEntry[] {
  return readRaw().sort((a, b) => (b.visitedAt || 0) - (a.visitedAt || 0));
}

export function recordRoomVisit(roomId: string, role: 'admin' | 'user'): void {
  const cleanId = roomId.trim().toUpperCase();
  if (!cleanId) return;

  const rest = readRaw().filter((e) => e.roomId.trim().toUpperCase() !== cleanId);
  const next: RoomHistoryEntry[] = [
    { roomId: cleanId, role, visitedAt: Date.now() },
    ...rest,
  ].slice(0, ROOM_HISTORY_LIMIT);

  write(next);
}

export function forgetRoom(roomId: string): void {
  const cleanId = roomId.trim().toUpperCase();
  write(readRaw().filter((e) => e.roomId.trim().toUpperCase() !== cleanId));
}

export function clearRoomHistory(): void {
  write([]);
}
