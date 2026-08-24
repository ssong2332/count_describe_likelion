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
  group?: string;          // 전우조 / 조 명칭
  shiftTime?: string;      // 부스 운영 시간대 (예: 12:00 ~ 13:05)
  roleNote?: string;       // 역할 메모 (메인 운영진, 아기사자 등)
  isPresent: boolean;      // 출석 여부 (1단계)
  activeStatus: DepartureType;
  activeReason?: string;
  departureTime?: number;
  logs: StatusLog[];
}

export interface Room {
  roomId: string;
  pin: string;
  adminName?: string;      // 관리자 본인 이름
  adminPhone?: string;     // 관리자 전화번호 (사용자에게 공개)
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
