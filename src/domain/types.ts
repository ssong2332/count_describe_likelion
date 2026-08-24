export type DepartureType = 'none' | 'toilet' | 'smoking' | 'etc';

export interface StatusLog {
  id: string;
  type: DepartureType;
  reason?: string;
  startAt: number;
  endAt?: number;
  durationSeconds?: number;
}

export interface Member {
  id: string;
  name: string;
  phone?: string;          // 전화번호
  group?: string;          // 전우조 (예: 전우조1, 전우조2 등)
  shiftTime?: string;      // 부스 운영 시간대 (예: 12:00 ~ 13:05)
  isAdmin?: boolean;       // 관리자 여부 (관리자 PIN 인증 및 연락처 제공)
  roleNote?: string;       // 역할 메모
  isPresent: boolean;      // 출석 여부 (1단계)
  activeStatus: DepartureType;
  activeReason?: string;
  departureTime?: number;
  logs: StatusLog[];
}

export interface Room {
  roomId: string;
  pin: string;
  adminMemberIds?: string[]; // 관리자 인원 ID 목록
  createdAt: number;
  members: Record<string, Member>;
}

export type UserRole = 'admin' | 'user';

export interface UserSession {
  role: UserRole;
  roomId: string;
  memberId?: string;
  memberName?: string;
}

export type ViewSortMode = 'grid' | 'schedule' | 'default';
