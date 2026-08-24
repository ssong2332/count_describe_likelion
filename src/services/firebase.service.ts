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

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC70Q-6G5fu9Fv4-tPSYZ6QfwnUyw36rgE',
  authDomain: 'countlikelion.firebaseapp.com',
  databaseURL: 'https://countlikelion-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'countlikelion',
  storageBucket: 'countlikelion.firebasestorage.app',
  messagingSenderId: '159250604563',
  appId: '1:159250604563:web:61fbd232f2a4e9eb7d15e6',
};

// Firebase의 'undefined in property' 에러를 방지하기 위한 정제 함수
function cleanForFirebase<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
}

export class FirebaseService implements IRoomService {
  private app: FirebaseApp | null = null;
  private db: Database | null = null;
  private dbUrl: string = FIREBASE_CONFIG.databaseURL;

  constructor(config?: Record<string, string>) {
    const apiKey = config?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || FIREBASE_CONFIG.apiKey;
    const databaseURL = config?.databaseURL || import.meta.env.VITE_FIREBASE_DATABASE_URL || FIREBASE_CONFIG.databaseURL;
    const projectId = config?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId;
    const authDomain = config?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_CONFIG.authDomain;
    const storageBucket = config?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_CONFIG.storageBucket;
    const messagingSenderId = config?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_CONFIG.messagingSenderId;
    const appId = config?.appId || import.meta.env.VITE_FIREBASE_APP_ID || FIREBASE_CONFIG.appId;

    this.dbUrl = databaseURL;

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

  isAvailable(): boolean {
    return this.db !== null;
  }

  private getRoomRef(roomId: string) {
    const cleanId = roomId.trim().toUpperCase();
    if (!this.db) throw new Error('Firebase DB가 초기화되지 않았습니다.');
    return ref(this.db, `rooms/${cleanId}`);
  }

  // REST API를 통한 즉각적인 고속 룸 생성
  async createRoom(roomId: string, pin: string): Promise<Room> {
    const cleanId = roomId.trim().toUpperCase();
    
    // REST API 확인
    try {
      const checkRes = await fetch(`${this.dbUrl}/rooms/${cleanId}.json`);
      if (checkRes.ok) {
        const existingData = await checkRes.json();
        if (existingData) {
          return {
            ...existingData,
            members: existingData.members || {},
            adminMemberIds: existingData.adminMemberIds || [],
          } as Room;
        }
      }
    } catch (e) {
      console.warn('[FirebaseService] REST check fallback:', e);
    }

    const newRoom: Room = {
      roomId: cleanId,
      pin: pin.trim(),
      adminMemberIds: [],
      createdAt: Date.now(),
      members: {},
    };

    const cleaned = cleanForFirebase(newRoom);

    // REST PUT 으로 고속 저장
    try {
      await fetch(`${this.dbUrl}/rooms/${cleanId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      });
    } catch (e) {
      console.warn('[FirebaseService] REST put fallback:', e);
    }

    if (this.db) {
      set(this.getRoomRef(cleanId), cleaned).catch(() => {});
    }

    return newRoom;
  }

  async setAdminMembers(roomId: string, memberIds: string[]): Promise<void> {
    const cleanId = roomId.trim().toUpperCase();
    const cleanedIds = cleanForFirebase(memberIds);
    
    // REST PATCH
    try {
      await fetch(`${this.dbUrl}/rooms/${cleanId}/adminMemberIds.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedIds),
      });
    } catch (e) {
      console.warn(e);
    }

    if (this.db) {
      set(ref(this.db, `rooms/${cleanId}/adminMemberIds`), cleanedIds).catch(() => {});
    }

    const room = await this.getRoom(cleanId);
    if (room) {
      for (const id of Object.keys(room.members)) {
        const isAdmin = memberIds.includes(id);
        fetch(`${this.dbUrl}/rooms/${cleanId}/members/${id}/isAdmin.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(isAdmin),
        }).catch(() => {});
        if (this.db) {
          set(ref(this.db, `rooms/${cleanId}/members/${id}/isAdmin`), isAdmin).catch(() => {});
        }
      }
    }
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const cleanId = roomId.trim().toUpperCase();
    try {
      const res = await fetch(`${this.dbUrl}/rooms/${cleanId}.json`);
      if (res.ok) {
        const val = await res.json();
        if (val) {
          return {
            ...val,
            members: val.members || {},
            adminMemberIds: val.adminMemberIds || [],
          } as Room;
        }
      }
    } catch (e) {
      console.warn('[FirebaseService] REST getRoom fallback:', e);
    }

    if (!this.db) return null;
    try {
      const snapshot = await get(this.getRoomRef(roomId));
      if (!snapshot.exists()) return null;
      const val = snapshot.val();
      return {
        ...val,
        members: val.members || {},
        adminMemberIds: val.adminMemberIds || [],
      } as Room;
    } catch {
      return null;
    }
  }

  async listRooms(): Promise<{ roomId: string; memberCount: number; createdAt: number }[]> {
    try {
      const res = await fetch(`${this.dbUrl}/rooms.json`);
      if (res.ok) {
        const val = await res.json();
        if (val) {
          const list = Object.values(val).map((r: any) => ({
            roomId: r.roomId,
            memberCount: Object.keys(r.members || {}).length,
            createdAt: r.createdAt || Date.now(),
          }));
          return list.sort((a, b) => b.createdAt - a.createdAt);
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  }

  async deleteRoom(roomId: string): Promise<void> {
    const cleanId = roomId.trim().toUpperCase();
    try {
      await fetch(`${this.dbUrl}/rooms/${cleanId}.json`, { method: 'DELETE' });
    } catch (e) {
      console.warn(e);
    }
    if (this.db) {
      set(this.getRoomRef(roomId), null).catch(() => {});
    }
  }

  async verifyPin(roomId: string, pin: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room) return false;
    return room.pin === pin.trim();
  }

  subscribeRoom(roomId: string, callback: RoomChangeCallback): () => void {
    const cleanId = roomId.trim().toUpperCase();

    // 1회 초기 REST 조회로 초고속 렌더링 보장
    this.getRoom(cleanId).then((r) => {
      if (r) callback(r);
    });

    if (!this.db) {
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
    const cleanedMember = cleanForFirebase(newMember);

    try {
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedMember),
      });
      if (isAdmin) {
        const updatedAdmins = Array.from(new Set([...(room.adminMemberIds || []), memberId]));
        await fetch(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanForFirebase(updatedAdmins)),
        });
      }
    } catch (e) {
      console.warn(e);
    }

    if (this.db) {
      const memberRef = ref(this.db, `rooms/${room.roomId}/members/${memberId}`);
      set(memberRef, cleanedMember).catch(() => {});
      if (isAdmin) {
        const updatedAdmins = Array.from(new Set([...(room.adminMemberIds || []), memberId]));
        set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), cleanForFirebase(updatedAdmins)).catch(() => {});
      }
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

    const uniqueAdmins = Array.from(new Set(newAdminIds));
    const cleanedMembers = cleanForFirebase(updatedMembers);
    const cleanedAdmins = cleanForFirebase(uniqueAdmins);

    try {
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/members.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedMembers),
      });
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedAdmins),
      });
    } catch (e) {
      console.warn(e);
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members`), cleanedMembers).catch(() => {});
      set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), cleanedAdmins).catch(() => {});
    }
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

    let updatedAdmins = room.adminMemberIds || [];
    if (isAdmin) {
      updatedAdmins = Array.from(new Set([...updatedAdmins, memberId]));
    } else {
      updatedAdmins = updatedAdmins.filter((id) => id !== memberId);
    }

    const cleanedUpdated = cleanForFirebase(updated);
    const cleanedAdmins = cleanForFirebase(updatedAdmins);

    try {
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedUpdated),
      });
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedAdmins),
      });
    } catch (e) {
      console.warn(e);
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), cleanedUpdated).catch(() => {});
      set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), cleanedAdmins).catch(() => {});
    }
  }

  async updateMemberName(roomId: string, memberId: string, name: string): Promise<void> {
    await this.updateMember(roomId, memberId, { name });
  }

  async deleteMember(roomId: string, memberId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) return;

    const updatedAdmins = (room.adminMemberIds || []).filter((id) => id !== memberId);
    const cleanedAdmins = cleanForFirebase(updatedAdmins);

    try {
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, { method: 'DELETE' });
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedAdmins),
      });
    } catch (e) {
      console.warn(e);
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), null).catch(() => {});
      set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), cleanedAdmins).catch(() => {});
    }
  }

  async deleteMembers(roomId: string, memberIds: string[]): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;

    const updatedAdmins = (room.adminMemberIds || []).filter((id) => !memberIds.includes(id));
    const cleanedAdmins = cleanForFirebase(updatedAdmins);

    try {
      for (const id of memberIds) {
        await fetch(`${this.dbUrl}/rooms/${room.roomId}/members/${id}.json`, { method: 'DELETE' });
      }
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedAdmins),
      });
    } catch (e) {
      console.warn(e);
    }

    if (this.db) {
      for (const id of memberIds) {
        set(ref(this.db, `rooms/${room.roomId}/members/${id}`), null).catch(() => {});
      }
      set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), cleanedAdmins).catch(() => {});
    }
  }

  async deleteAllMembers(roomId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;

    try {
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/members.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([]),
      });
    } catch (e) {
      console.warn(e);
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members`), {}).catch(() => {});
      set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), []).catch(() => {});
    }
  }

  async toggleAttendance(roomId: string, memberId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const updated = toggleAttendance(room.members[memberId]);
    const cleaned = cleanForFirebase(updated);

    try {
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      });
    } catch (e) {
      console.warn(e);
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), cleaned).catch(() => {});
    }
  }

  async checkIn(roomId: string, memberId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const updated = markPresent(room.members[memberId]);
    const cleaned = cleanForFirebase(updated);

    try {
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      });
    } catch (e) {
      console.warn(e);
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), cleaned).catch(() => {});
    }
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
    let updated: Member;

    if (current.activeStatus === type) {
      updated = endDeparture(current);
    } else {
      const res = startDeparture(current, type, reason);
      if (res.error) {
        throw new Error(res.error);
      }
      updated = res.member;
    }

    const cleaned = cleanForFirebase(updated);

    try {
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      });
    } catch (e) {
      console.warn(e);
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), cleaned).catch(() => {});
    }
  }

  async resetDaily(roomId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다.');

    const updatedMembers: Record<string, Member> = {};
    for (const [id, m] of Object.entries(room.members)) {
      updatedMembers[id] = resetMemberDaily(m);
    }

    const cleaned = cleanForFirebase(updatedMembers);

    try {
      await fetch(`${this.dbUrl}/rooms/${room.roomId}/members.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      });
    } catch (e) {
      console.warn(e);
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members`), cleaned).catch(() => {});
    }
  }
}
