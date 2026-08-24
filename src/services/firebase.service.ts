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
import {
  IRoomService,
  MemberPayload,
  RoomChangeCallback,
  SyncErrorCallback,
} from './room-service.interface';
import { sanitizeConfigValue } from './firebase-config';
import { normalizeRoom } from '../domain/room-normalizer';
import { firebaseRest } from './rest-client';

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
    // 배포 플랫폼 환경변수는 따옴표·공백이 값에 섞여 들어올 수 있으므로 반드시 정제한다.
    const pick = (...candidates: (string | undefined)[]): string =>
      candidates.map(sanitizeConfigValue).find((v): v is string => v !== undefined) || '';

    const apiKey = pick(config?.apiKey, import.meta.env.VITE_FIREBASE_API_KEY, FIREBASE_CONFIG.apiKey);
    const databaseURL = pick(config?.databaseURL, import.meta.env.VITE_FIREBASE_DATABASE_URL, FIREBASE_CONFIG.databaseURL);
    const projectId = pick(config?.projectId, import.meta.env.VITE_FIREBASE_PROJECT_ID, FIREBASE_CONFIG.projectId);
    const authDomain = pick(config?.authDomain, import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, FIREBASE_CONFIG.authDomain);
    const storageBucket = pick(config?.storageBucket, import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, FIREBASE_CONFIG.storageBucket);
    const messagingSenderId = pick(config?.messagingSenderId, import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, FIREBASE_CONFIG.messagingSenderId);
    const appId = pick(config?.appId, import.meta.env.VITE_FIREBASE_APP_ID, FIREBASE_CONFIG.appId);

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
      const existingData = await firebaseRest(`${this.dbUrl}/rooms/${cleanId}.json`);
      if (existingData) {
        return normalizeRoom(existingData) as Room;
      }
    } catch (e) {
      // 조회 실패는 아래 신규 생성 경로로 진행한다 (원인은 남긴다).
      console.error('[FirebaseService] 기존 룸 조회 실패:', e);
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
      await firebaseRest(`${this.dbUrl}/rooms/${cleanId}.json`, {
        method: 'PUT',
        body: JSON.stringify(cleaned),
      });
    } catch (e) {
      throw e;
    }

    if (this.db) {
      set(this.getRoomRef(cleanId), cleaned).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
    }

    return newRoom;
  }

  async setAdminMembers(roomId: string, memberIds: string[]): Promise<void> {
    const cleanId = roomId.trim().toUpperCase();
    const cleanedIds = cleanForFirebase(memberIds);
    
    // REST PATCH
    try {
      await firebaseRest(`${this.dbUrl}/rooms/${cleanId}/adminMemberIds.json`, {
        method: 'PUT',
        body: JSON.stringify(cleanedIds),
      });
    } catch (e) {
      throw e;
    }

    if (this.db) {
      set(ref(this.db, `rooms/${cleanId}/adminMemberIds`), cleanedIds).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
    }

    const room = await this.getRoom(cleanId);
    if (room) {
      for (const id of Object.keys(room.members)) {
        const isAdmin = memberIds.includes(id);
        await firebaseRest(`${this.dbUrl}/rooms/${cleanId}/members/${id}/isAdmin.json`, {
          method: 'PUT',
          body: JSON.stringify(isAdmin),
        });
        if (this.db) {
          set(ref(this.db, `rooms/${cleanId}/members/${id}/isAdmin`), isAdmin).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
        }
      }
    }
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const cleanId = roomId.trim().toUpperCase();
    try {
      const val = await firebaseRest(`${this.dbUrl}/rooms/${cleanId}.json`);
      if (val) {
        return normalizeRoom(val);
      }
    } catch (e) {
      // SDK 경로로 재시도한다 (원인은 남긴다).
      console.error('[FirebaseService] REST 룸 조회 실패, SDK로 재시도:', e);
    }

    if (!this.db) return null;
    try {
      const snapshot = await get(this.getRoomRef(roomId));
      if (!snapshot.exists()) return null;
      const val = snapshot.val();
      return normalizeRoom(val);
    } catch {
      return null;
    }
  }

  async listRooms(): Promise<{ roomId: string; memberCount: number; createdAt: number }[]> {
    try {
      const val = await firebaseRest(`${this.dbUrl}/rooms.json`);
      if (val) {
        const list = Object.values(val).map((r: any) => ({
          roomId: r.roomId,
          memberCount: Object.keys(r.members || {}).length,
          createdAt: r.createdAt || Date.now(),
        }));
        return list.sort((a, b) => b.createdAt - a.createdAt);
      }
    } catch (e) {
      console.error('[FirebaseService] 룸 목록 조회 실패:', e);
      throw e;
    }
    return [];
  }

  async deleteRoom(roomId: string): Promise<void> {
    const cleanId = roomId.trim().toUpperCase();
    try {
      await firebaseRest(`${this.dbUrl}/rooms/${cleanId}.json`, { method: 'DELETE' });
    } catch (e) {
      throw e;
    }
    if (this.db) {
      set(this.getRoomRef(roomId), null).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
    }
  }

  async verifyPin(roomId: string, pin: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room) return false;
    return room.pin === pin.trim();
  }

  subscribeRoom(
    roomId: string,
    callback: RoomChangeCallback,
    onError?: SyncErrorCallback
  ): () => void {
    const cleanId = roomId.trim().toUpperCase();

    // 1회 초기 REST 조회로 초고속 렌더링 보장
    this.getRoom(cleanId)
      .then((r) => {
        if (r) callback(r);
      })
      .catch((e) => {
        console.error('[FirebaseService] 초기 룸 조회 실패:', e);
        onError?.(e?.message || '클라우드에서 현황을 불러오지 못했습니다.');
      });

    if (!this.db) {
      onError?.('클라우드 연결이 초기화되지 않아 실시간 동기화가 꺼져 있습니다.');
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
        callback(normalizeRoom(val));
      },
      (err: any) => {
        console.error('[FirebaseService] subscription error:', err);
        onError?.(
          `실시간 연결이 끊겼습니다: ${err?.message || err}. 화면이 최신이 아닐 수 있습니다.`
        );
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
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, {
        method: 'PUT',
        body: JSON.stringify(cleanedMember),
      });
      if (isAdmin) {
        const updatedAdmins = Array.from(new Set([...(room.adminMemberIds || []), memberId]));
        await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
          method: 'PUT',
          body: JSON.stringify(cleanForFirebase(updatedAdmins)),
        });
      }
    } catch (e) {
      throw e;
    }

    if (this.db) {
      const memberRef = ref(this.db, `rooms/${room.roomId}/members/${memberId}`);
      set(memberRef, cleanedMember).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
      if (isAdmin) {
        const updatedAdmins = Array.from(new Set([...(room.adminMemberIds || []), memberId]));
        set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), cleanForFirebase(updatedAdmins)).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
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
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/members.json`, {
        method: 'PUT',
        body: JSON.stringify(cleanedMembers),
      });
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
        method: 'PUT',
        body: JSON.stringify(cleanedAdmins),
      });
    } catch (e) {
      throw e;
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members`), cleanedMembers).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
      set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), cleanedAdmins).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
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
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, {
        method: 'PUT',
        body: JSON.stringify(cleanedUpdated),
      });
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
        method: 'PUT',
        body: JSON.stringify(cleanedAdmins),
      });
    } catch (e) {
      throw e;
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), cleanedUpdated).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
      set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), cleanedAdmins).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
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
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, { method: 'DELETE' });
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
        method: 'PUT',
        body: JSON.stringify(cleanedAdmins),
      });
    } catch (e) {
      throw e;
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), null).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
      set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), cleanedAdmins).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
    }
  }

  async deleteMembers(roomId: string, memberIds: string[]): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;

    const updatedAdmins = (room.adminMemberIds || []).filter((id) => !memberIds.includes(id));
    const cleanedAdmins = cleanForFirebase(updatedAdmins);

    try {
      for (const id of memberIds) {
        await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/members/${id}.json`, { method: 'DELETE' });
      }
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
        method: 'PUT',
        body: JSON.stringify(cleanedAdmins),
      });
    } catch (e) {
      throw e;
    }

    if (this.db) {
      for (const id of memberIds) {
        set(ref(this.db, `rooms/${room.roomId}/members/${id}`), null).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
      }
      set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), cleanedAdmins).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
    }
  }

  async deleteAllMembers(roomId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;

    try {
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/members.json`, {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/adminMemberIds.json`, {
        method: 'PUT',
        body: JSON.stringify([]),
      });
    } catch (e) {
      throw e;
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members`), {}).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
      set(ref(this.db, `rooms/${room.roomId}/adminMemberIds`), []).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
    }
  }

  async toggleAttendance(roomId: string, memberId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const updated = toggleAttendance(room.members[memberId]);
    const cleaned = cleanForFirebase(updated);

    try {
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, {
        method: 'PUT',
        body: JSON.stringify(cleaned),
      });
    } catch (e) {
      throw e;
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), cleaned).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
    }
  }

  async checkIn(roomId: string, memberId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.members[memberId]) throw new Error('인원을 찾을 수 없습니다.');

    const updated = markPresent(room.members[memberId]);
    const cleaned = cleanForFirebase(updated);

    try {
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, {
        method: 'PUT',
        body: JSON.stringify(cleaned),
      });
    } catch (e) {
      throw e;
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), cleaned).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
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
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/members/${memberId}.json`, {
        method: 'PUT',
        body: JSON.stringify(cleaned),
      });
    } catch (e) {
      throw e;
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members/${memberId}`), cleaned).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
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
      await firebaseRest(`${this.dbUrl}/rooms/${room.roomId}/members.json`, {
        method: 'PUT',
        body: JSON.stringify(cleaned),
      });
    } catch (e) {
      throw e;
    }

    if (this.db) {
      set(ref(this.db, `rooms/${room.roomId}/members`), cleaned).catch((e) => console.error('[FirebaseService] SDK 미러 쓰기 실패:', e));
    }
  }
}
