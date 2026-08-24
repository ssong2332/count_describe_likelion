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
    const apiKey =
      config?.apiKey ||
      import.meta.env.VITE_FIREBASE_API_KEY ||
      'AIzaSyC70Q-6G5fu9Fv4-tPSYZ6QfwnUyw36rgE';
    const authDomain =
      config?.authDomain ||
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
      'countlikelion.firebaseapp.com';
    const databaseURL =
      config?.databaseURL ||
      import.meta.env.VITE_FIREBASE_DATABASE_URL ||
      'https://countlikelion-default-rtdb.asia-southeast1.firebasedatabase.app';
    const projectId =
      config?.projectId ||
      import.meta.env.VITE_FIREBASE_PROJECT_ID ||
      'countlikelion';
    const storageBucket =
      config?.storageBucket ||
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
      'countlikelion.firebasestorage.app';
    const messagingSenderId =
      config?.messagingSenderId ||
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
      '159250604563';
    const appId =
      config?.appId ||
      import.meta.env.VITE_FIREBASE_APP_ID ||
      '1:159250604563:web:61fbd232f2a4e9eb7d15e6';

    if (apiKey && databaseURL) {
      try {
        if (!getApps().length) {
          this.app = initializeApp({
            apiKey,
            authDomain,
            databaseURL,
            projectId,
            storageBucket,
            messagingSenderId,
            appId,
          });
        } else {
          this.app = getApps()[0];
        }
        this.db = getDatabase(this.app, databaseURL);
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

  async createRoom(roomId: string, pin: string): Promise<Room> {
    const cleanId = roomId.trim().toUpperCase();
    const existing = await this.getRoom(cleanId);
    if (existing) return existing;

    const newRoom: Room = {
      roomId: cleanId,
      pin: pin.trim(),
      adminMemberIds: [],
      createdAt: Date.now(),
      members: {},
    };

    await set(this.getRoomRef(cleanId), newRoom);
    return newRoom;
  }

  async setAdminMembers(roomId: string, memberIds: string[]): Promise<void> {
    if (!this.db) return;
    const cleanId = roomId.trim().toUpperCase();
    await set(ref(this.db, `rooms/${cleanId}/adminMemberIds`), memberIds);
    const room = await this.getRoom(cleanId);
    if (room) {
      for (const id of Object.keys(room.members)) {
        await set(ref(this.db, `rooms/${cleanId}/members/${id}/isAdmin`), memberIds.includes(id));
      }
    }
  }

  async getRoom(roomId: string): Promise<Room | null> {
    if (!this.db) return null;
    const snapshot = await get(this.getRoomRef(roomId));
    if (!snapshot.exists()) return null;
    const val = snapshot.val();
    return {
      ...val,
      members: val.members || {},
      adminMemberIds: val.adminMemberIds || [],
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
          adminMemberIds: val.adminMemberIds || [],
        } as Room);
      },
      (err: any) => {
        console.error('[FirebaseService] subscription error:', err);
        callback(null);
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
    const isAdmin = typeof payload === 'object' ? payload.isAdmin : false;

    const memberId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMember = createDefaultMember(memberId, name, phone, group, shiftTime, roleNote, isAdmin);

    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    const memberRef = ref(this.db, `rooms/${room.roomId}/members/${memberId}`);
    await set(memberRef, newMember);

    if (isAdmin) {
      const updatedAdmins = Array.from(new Set([...(room.adminMemberIds || []), memberId]));
      await set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), updatedAdmins);
    }

    return newMember;
  }

  async importScheduleMembers(roomId: string, members: Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[]): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다.');

    const updatedMembers: Record<string, Member> = { ...room.members };
    const newAdminIds: string[] = [...(room.adminMemberIds || [])];
    let count = 1;

    for (const item of members) {
      const memberId = `m_${Date.now()}_${count++}_${Math.random().toString(36).substring(2, 5)}`;
      updatedMembers[memberId] = createDefaultMember(
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

    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    await set(ref(this.db, `rooms/${room.roomId}/members`), updatedMembers);
    await set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), Array.from(new Set(newAdminIds)));
  }

  async updateMember(roomId: string, memberId: string, payload: MemberPayload): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const current = room.members[memberId];
    const isAdmin = payload.isAdmin !== undefined ? payload.isAdmin : current.isAdmin;

    const updated = {
      ...current,
      name: payload.name.trim(),
      phone: payload.phone?.trim() || undefined,
      group: payload.group?.trim() || undefined,
      shiftTime: payload.shiftTime?.trim() || undefined,
      roleNote: payload.roleNote?.trim() || undefined,
      isAdmin,
    };

    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    await set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), updated);

    let updatedAdmins = room.adminMemberIds || [];
    if (isAdmin) {
      updatedAdmins = Array.from(new Set([...updatedAdmins, memberId]));
    } else {
      updatedAdmins = updatedAdmins.filter((id) => id !== memberId);
    }
    await set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), updatedAdmins);
  }

  async updateMemberName(roomId: string, memberId: string, name: string): Promise<void> {
    await this.updateMember(roomId, memberId, { name });
  }

  async deleteMember(roomId: string, memberId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) return;

    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    await set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), null);
    const updatedAdmins = (room.adminMemberIds || []).filter((id) => id !== memberId);
    await set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), updatedAdmins);
  }

  async deleteMembers(roomId: string, memberIds: string[]): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;
    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');

    for (const id of memberIds) {
      await set(ref(this.db, `rooms/${room.roomId}/members/${id}`), null);
    }
    const updatedAdmins = (room.adminMemberIds || []).filter((id) => !memberIds.includes(id));
    await set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), updatedAdmins);
  }

  async deleteAllMembers(roomId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;
    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');

    await set(ref(this.db, `rooms/${room.roomId}/members`), {});
    await set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), []);
  }

  async toggleAttendance(roomId: string, memberId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const updated = toggleAttendance(room.members[memberId]);
    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    await set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), updated);
  }

  async checkIn(roomId: string, memberId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const updated = markPresent(room.members[memberId]);
    if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
    await set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), updated);
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
      await set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), updated);
    } else {
      const res = startDeparture(current, type, reason);
      if (res.error) {
        throw new Error(res.error);
      }
      if (!this.db) throw new Error('Firebase가 연결되지 않았습니다.');
      await set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), res.member);
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
    await set(ref(this.db, `rooms/${room.roomId}/members`), updatedMembers);
  }
}
