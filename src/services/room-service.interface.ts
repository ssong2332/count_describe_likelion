import { DepartureType, Member, Room } from '../domain/types';

export type RoomChangeCallback = (room: Room | null) => void;

export interface MemberPayload {
  name: string;
  phone?: string;
  group?: string;
  shiftTime?: string;
  roleNote?: string;
  isAdmin?: boolean;
}

export interface IRoomService {
  /**
   * 새 룸 생성
   */
  createRoom(roomId: string, pin: string): Promise<Room>;

  /**
   * 1번 요구사항: 룸 내 관리자 멤버 ID 목록 일괄 설정
   */
  setAdminMembers(roomId: string, memberIds: string[]): Promise<void>;

  /**
   * 룸 정보 조회
   */
  getRoom(roomId: string): Promise<Room | null>;

  /**
   * 생성된 모든 룸 목록 조회
   */
  listRooms(): Promise<{ roomId: string; memberCount: number; createdAt: number }[]>;

  /**
   * 룸 자체 삭제
   */
  deleteRoom(roomId: string): Promise<void>;

  /**
   * PIN 검증
   */
  verifyPin(roomId: string, pin: string): Promise<boolean>;

  /**
   * 룸 실시간 변경 구독
   */
  subscribeRoom(roomId: string, callback: RoomChangeCallback): () => void;

  /**
   * 인원 추가
   */
  addMember(roomId: string, payload: MemberPayload | string): Promise<Member>;

  /**
   * 표/텍스트 파싱 결과로 멤버 일괄 등록
   */
  importScheduleMembers(roomId: string, members: Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[]): Promise<void>;

  /**
   * 인원 정보 수정
   */
  updateMember(roomId: string, memberId: string, payload: MemberPayload): Promise<void>;

  /**
   * 인원 이름 수정
   */
  updateMemberName(roomId: string, memberId: string, name: string): Promise<void>;

  /**
   * 인원 삭제
   */
  deleteMember(roomId: string, memberId: string): Promise<void>;

  /**
   * 출결 상태 토글
   */
  toggleAttendance(roomId: string, memberId: string): Promise<void>;

  /**
   * 직접 출석 체크
   */
  checkIn(roomId: string, memberId: string): Promise<void>;

  /**
   * 자리비움 상태 변경 (화장실, 흡연, 기타 등 ON/OFF)
   */
  setDeparture(
    roomId: string,
    memberId: string,
    type: DepartureType,
    reason?: string
  ): Promise<void>;

  /**
   * 당일 데이터 수동 초기화 (출결 및 로그 리셋)
   */
  resetDaily(roomId: string): Promise<void>;
}
