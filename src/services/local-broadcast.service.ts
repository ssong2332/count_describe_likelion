import { DepartureType, Member, Room } from '../domain/types';
import {
  createDefaultMember,
  endDeparture,
  markPresent,
  resetMemberDaily,
  startDeparture,
  toggleAttendance,
} from '../domain/member-logic';
import { IRoomService, MemberPayload, RoomChangeCallback } from './room-service.interface';

const STORAGE_PREFIX = 'status_sync_room_';

export class LocalBroadcastService implements IRoomService {
  private channels: Map<string, BroadcastChannel> = new Map();
  private subscribers: Map<string, Set<RoomChangeCallback>> = new Map();

  private getStorageKey(roomId: string): string {
    return `${STORAGE_PREFIX}${roomId.trim().toLowerCase()}`;
  }

  private readRoom(roomId: string): Room | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = localStorage.getItem(this.getStorageKey(roomId));
      if (!raw) return null;
      return JSON.parse(raw) as Room;
    } catch {
      return null;
    }
  }

  private saveRoom(room: Room): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(this.getStorageKey(room.roomId), JSON.stringify(room));
    this.broadcast(room.roomId, room);
  }

  private getChannel(roomId: string): BroadcastChannel | null {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return null;
    }
    const cleanId = roomId.trim().toLowerCase();
    if (!this.channels.has(cleanId)) {
      const ch = new BroadcastChannel(`sync_${cleanId}`);
      ch.onmessage = (event) => {
        if (event.data?.type === 'ROOM_UPDATED') {
          const updatedRoom = event.data.room as Room;
          this.notifySubscribers(cleanId, updatedRoom);
        }
      };
      this.channels.set(cleanId, ch);
    }
    return this.channels.get(cleanId) || null;
  }

  private broadcast(roomId: string, room: Room): void {
    const cleanId = roomId.trim().toLowerCase();
    const ch = this.getChannel(cleanId);
    if (ch) {
      ch.postMessage({ type: 'ROOM_UPDATED', room });
    }
    this.notifySubscribers(cleanId, room);
  }

  private notifySubscribers(roomId: string, room: Room | null): void {
    const subs = this.subscribers.get(roomId.trim().toLowerCase());
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(room ? { ...room, members: { ...room.members } } : null);
        } catch (e) {
          console.error('[LocalBroadcastService] subscriber callback error', e);
        }
      });
    }
  }

  async createRoom(roomId: string, pin: string): Promise<Room> {
    const cleanId = roomId.trim().toUpperCase();
    const existing = this.readRoom(cleanId);
    if (existing) {
      return existing;
    }

    const newRoom: Room = {
      roomId: cleanId,
      pin: pin.trim(),
      adminMemberIds: [],
      createdAt: Date.now(),
      members: {},
    };

    this.saveRoom(newRoom);
    return newRoom;
  }

  async setAdminMembers(roomId: string, memberIds: string[]): Promise<void> {
    const room = this.readRoom(roomId);
    if (!room) return;
    room.adminMemberIds = memberIds;
    // 멤버별 isAdmin 플래그 동기화
    for (const [id, m] of Object.entries(room.members)) {
      m.isAdmin = memberIds.includes(id);
    }
    this.saveRoom(room);
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.readRoom(roomId);
  }

  async listRooms(): Promise<{ roomId: string; memberCount: number; createdAt: number }[]> {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const results: { roomId: string; memberCount: number; createdAt: number }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const room = JSON.parse(raw) as Room;
            results.push({
              roomId: room.roomId,
              memberCount: Object.keys(room.members || {}).length,
              createdAt: room.createdAt || Date.now(),
            });
          }
        }
      }
    } catch (e) {
      console.error('[LocalBroadcastService] listRooms failed', e);
    }
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteRoom(roomId: string): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const cleanId = roomId.trim().toUpperCase();
    localStorage.removeItem(this.getStorageKey(cleanId));
    this.notifySubscribers(cleanId, null);
  }

  async verifyPin(roomId: string, pin: string): Promise<boolean> {
    const room = this.readRoom(roomId);
    if (!room) return false;
    return room.pin === pin.trim();
  }

  subscribeRoom(roomId: string, callback: RoomChangeCallback): () => void {
    const cleanId = roomId.trim().toLowerCase();
    if (!this.subscribers.has(cleanId)) {
      this.subscribers.set(cleanId, new Set());
    }
    const subs = this.subscribers.get(cleanId)!;
    subs.add(callback);

    this.getChannel(cleanId);

    const current = this.readRoom(cleanId);
    callback(current ? { ...current, members: { ...current.members } } : null);

    return () => {
      subs.delete(callback);
    };
  }

  async addMember(roomId: string, payload: MemberPayload | string): Promise<Member> {
    const room = this.readRoom(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다.');

    const name = typeof payload === 'string' ? payload : payload.name;
    const phone = typeof payload === 'object' ? payload.phone : undefined;
    const group = typeof payload === 'object' ? payload.group : undefined;
    const shiftTime = typeof payload === 'object' ? payload.shiftTime : undefined;
    const roleNote = typeof payload === 'object' ? payload.roleNote : undefined;
    const isAdmin = typeof payload === 'object' ? payload.isAdmin : false;

    const memberId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMember = createDefaultMember(memberId, name, phone, group, shiftTime, roleNote, isAdmin);

    room.members[memberId] = newMember;
    if (isAdmin) {
      room.adminMemberIds = Array.from(new Set([...(room.adminMemberIds || []), memberId]));
    }
    this.saveRoom(room);
    return newMember;
  }

  async importScheduleMembers(roomId: string, members: Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[]): Promise<void> {
    const room = this.readRoom(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다.');

    let count = 1;
    const newAdminIds: string[] = [...(room.adminMemberIds || [])];

    for (const item of members) {
      const memberId = `m_${Date.now()}_${count++}_${Math.random().toString(36).substring(2, 5)}`;
      room.members[memberId] = createDefaultMember(
        memberId,
        item.name,
        item.phone,
        item.group,
        item.shiftTime,
        item.roleNote,
        item.isAdmin
      );
      if (item.isAdmin) {
        newAdminIds.push(memberId);
      }
    }

    room.adminMemberIds = Array.from(new Set(newAdminIds));
    this.saveRoom(room);
  }

  async updateMember(roomId: string, memberId: string, payload: MemberPayload): Promise<void> {
    const room = this.readRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const current = room.members[memberId];
    const isAdmin = payload.isAdmin !== undefined ? payload.isAdmin : current.isAdmin;

    room.members[memberId] = {
      ...current,
      name: payload.name.trim(),
      phone: payload.phone?.trim() || undefined,
      group: payload.group?.trim() || undefined,
      shiftTime: payload.shiftTime?.trim() || undefined,
      roleNote: payload.roleNote?.trim() || undefined,
      isAdmin,
    };

    if (isAdmin) {
      room.adminMemberIds = Array.from(new Set([...(room.adminMemberIds || []), memberId]));
    } else {
      room.adminMemberIds = (room.adminMemberIds || []).filter((id) => id !== memberId);
    }

    this.saveRoom(room);
  }

  async updateMemberName(roomId: string, memberId: string, name: string): Promise<void> {
    await this.updateMember(roomId, memberId, { name });
  }

  async deleteMember(roomId: string, memberId: string): Promise<void> {
    const room = this.readRoom(roomId);
    if (!room || !room.members[memberId]) return;

    delete room.members[memberId];
    room.adminMemberIds = (room.adminMemberIds || []).filter((id) => id !== memberId);
    this.saveRoom(room);
  }

  async deleteMembers(roomId: string, memberIds: string[]): Promise<void> {
    const room = this.readRoom(roomId);
    if (!room) return;

    for (const id of memberIds) {
      delete room.members[id];
    }
    room.adminMemberIds = (room.adminMemberIds || []).filter((id) => !memberIds.includes(id));
    this.saveRoom(room);
  }

  async deleteAllMembers(roomId: string): Promise<void> {
    const room = this.readRoom(roomId);
    if (!room) return;

    room.members = {};
    room.adminMemberIds = [];
    this.saveRoom(room);
  }

  async toggleAttendance(roomId: string, memberId: string): Promise<void> {
    const room = this.readRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    room.members[memberId] = toggleAttendance(room.members[memberId]);
    this.saveRoom(room);
  }

  async checkIn(roomId: string, memberId: string): Promise<void> {
    const room = this.readRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    room.members[memberId] = markPresent(room.members[memberId]);
    this.saveRoom(room);
  }

  async setDeparture(
    roomId: string,
    memberId: string,
    type: DepartureType,
    reason?: string
  ): Promise<void> {
    const room = this.readRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const current = room.members[memberId];
    if (current.activeStatus === type) {
      room.members[memberId] = endDeparture(current);
    } else {
      const res = startDeparture(current, type, reason);
      if (res.error) {
        throw new Error(res.error);
      }
      room.members[memberId] = res.member;
    }
    this.saveRoom(room);
  }

  async resetDaily(roomId: string): Promise<void> {
    const room = this.readRoom(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다.');

    const updatedMembers: Record<string, Member> = {};
    for (const [id, m] of Object.entries(room.members)) {
      updatedMembers[id] = resetMemberDaily(m);
    }
    room.members = updatedMembers;
    this.saveRoom(room);
  }
}
