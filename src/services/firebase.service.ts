import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  Database,
  Unsubscribe,
} from 'firebase/database';
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

export class FirebaseService implements IRoomService {
  private app: FirebaseApp | null = null;
  private db: Database | null = null;

  constructor(config?: Record<string, string>) {
    const apiKey = config?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY;
    const databaseURL = config?.databaseURL || import.meta.env.VITE_FIREBASE_DATABASE_URL;
    const projectId = config?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (apiKey && databaseURL) {
      try {
        if (!getApps().length) {
          this.app = initializeApp({
            apiKey,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            databaseURL,
            projectId,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
          });
        } else {
          this.app = getApps()[0];
        }
        this.db = getDatabase(this.app);
      } catch (e) {
        console.error('[FirebaseService] Init failed:', e);
      }
    }
  }

  isAvailable(): boolean {
    return this.db !== null;
  }

  private getRoomRef(roomId: string) {
    const cleanId = roomId.trim().toUpperCase();
    if (!this.db) throw new Error('Firebase DB가 초기화되지 않았습니다.');
    return ref(this.db, `rooms/${cleanId}`);
  }

  async createRoom(roomId: string, pin: string, adminName?: string, adminPhone?: string): Promise<Room> {
    const cleanId = roomId.trim().toUpperCase();
    const existing = await this.getRoom(cleanId);
    if (existing) return existing;

    const newRoom: Room = {
      roomId: cleanId,
      pin: pin.trim(),
      adminName: adminName?.trim() || undefined,
      adminPhone: adminPhone?.trim() || undefined,
      createdAt: Date.now(),
      members: {},
    };

    await set(this.getRoomRef(cleanId), newRoom);
    return newRoom;
  }

  async setAdminProfile(roomId: string, adminName: string, adminPhone?: string): Promise<void> {
    if (!this.db) return;
    const cleanId = roomId.trim().toUpperCase();
    await set(ref(this.db, `rooms/${cleanId}/adminName`), adminName.trim() || null);
    await set(ref(this.db, `rooms/${cleanId}/adminPhone`), adminPhone?.trim() || null);
  }

  async getRoom(roomId: string): Promise<Room | null> {
    if (!this.db) return null;
    const snapshot = await get(this.getRoomRef(roomId));
    if (!snapshot.exists()) return null;
    const val = snapshot.val();
    return {
      ...val,
      members: val.members || {},
    } as Room;
  }

  async listRooms(): Promise<{ roomId: string; memberCount: number; createdAt: number }[]> {
    if (!this.db) return [];
    try {
      const roomsRef = ref(this.db, 'rooms');
      const snapshot = await get(roomsRef);
      if (!snapshot.exists()) return [];
      const val = snapshot.val();
      const list = Object.values(val).map((r: any) => ({
        roomId: r.roomId,
        memberCount: Object.keys(r.members || {}).length,
        createdAt: r.createdAt || Date.now(),
      }));
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }

  async deleteRoom(roomId: string): Promise<void> {
    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    await set(this.getRoomRef(roomId), null);
  }

  async verifyPin(roomId: string, pin: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room) return false;
    return room.pin === pin.trim();
  }

  subscribeRoom(roomId: string, callback: RoomChangeCallback): () => void {
    if (!this.db) {
      callback(null);
      return () => {};
    }

    const roomRef = this.getRoomRef(roomId);
    const unsubscribe: Unsubscribe = onValue(
      roomRef,
      (snapshot: any) => {
        if (!snapshot.exists()) {
          callback(null);
          return;
        }
        const val = snapshot.val();
        callback({
          ...val,
          members: val.members || {},
        } as Room);
      },
      (err: any) => {
        console.error('[FirebaseService] subscription error:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }

  async addMember(roomId: string, payload: MemberPayload | string): Promise<Member> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다.');

    const name = typeof payload === 'string' ? payload : payload.name;
    const phone = typeof payload === 'object' ? payload.phone : undefined;
    const group = typeof payload === 'object' ? payload.group : undefined;
    const shiftTime = typeof payload === 'object' ? payload.shiftTime : undefined;
    const roleNote = typeof payload === 'object' ? payload.roleNote : undefined;

    const memberId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMember = createDefaultMember(memberId, name, phone, group, shiftTime, roleNote);

    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    const memberRef = ref(this.db, `rooms/${room.roomId}/members/${memberId}`);
    await set(memberRef, newMember);

    return newMember;
  }

  async importScheduleMembers(roomId: string, members: Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[]): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다.');

    const updatedMembers: Record<string, Member> = { ...room.members };
    let count = 1;
    for (const item of members) {
      const memberId = `m_${Date.now()}_${count++}_${Math.random().toString(36).substring(2, 5)}`;
      updatedMembers[memberId] = createDefaultMember(
        memberId,
        item.name,
        item.phone,
        item.group,
        item.shiftTime,
        item.roleNote
      );
    }

    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    const membersRef = ref(this.db, `rooms/${room.roomId}/members`);
    await set(membersRef, updatedMembers);
  }

  async updateMember(roomId: string, memberId: string, payload: MemberPayload): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const current = room.members[memberId];
    const updated = {
      ...current,
      name: payload.name.trim(),
      phone: payload.phone?.trim() || undefined,
      group: payload.group?.trim() || undefined,
      shiftTime: payload.shiftTime?.trim() || undefined,
      roleNote: payload.roleNote?.trim() || undefined,
    };

    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    const memberRef = ref(this.db, `rooms/${room.roomId}/members/${memberId}`);
    await set(memberRef, updated);
  }

  async updateMemberName(roomId: string, memberId: string, name: string): Promise<void> {
    await this.updateMember(roomId, memberId, { name });
  }

  async deleteMember(roomId: string, memberId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) return;

    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    const memberRef = ref(this.db, `rooms/${room.roomId}/members/${memberId}`);
    await set(memberRef, null);
  }

  async toggleAttendance(roomId: string, memberId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const updated = toggleAttendance(room.members[memberId]);
    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    const memberRef = ref(this.db, `rooms/${room.roomId}/members/${memberId}`);
    await set(memberRef, updated);
  }

  async checkIn(roomId: string, memberId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const updated = markPresent(room.members[memberId]);
    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    const memberRef = ref(this.db, `rooms/${room.roomId}/members/${memberId}`);
    await set(memberRef, updated);
  }

  async setDeparture(
    roomId: string,
    memberId: string,
    type: DepartureType,
    reason?: string
  ): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const current = room.members[memberId];
    if (current.activeStatus === type) {
      const updated = endDeparture(current);
      if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
      const memberRef = ref(this.db, `rooms/${room.roomId}/members/${memberId}`);
      await set(memberRef, updated);
    } else {
      const res = startDeparture(current, type, reason);
      if (res.error) {
        throw new Error(res.error);
      }
      if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
      const memberRef = ref(this.db, `rooms/${room.roomId}/members/${memberId}`);
      await set(memberRef, res.member);
    }
  }

  async resetDaily(roomId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다.');

    const updatedMembers: Record<string, Member> = {};
    for (const [id, m] of Object.entries(room.members)) {
      updatedMembers[id] = resetMemberDaily(m);
    }

    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    const membersRef = ref(this.db, `rooms/${room.roomId}/members`);
    await set(membersRef, updatedMembers);
  }
}
