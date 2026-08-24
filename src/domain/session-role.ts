import { Member, UserRole } from './types';

/**
 * 접속 역할 결정.
 *
 * 관리자로 등록된 인원은 사용자 모드로 들어와도 (관리자 PIN 검증을 통과한
 * 뒤) 전체 대시보드를 본다. 자기 상태는 현황판에서 본인 타일을 눌러 제어한다.
 */
export function resolveSessionRole(
  requestedRole: UserRole,
  member: Member | null | undefined
): UserRole {
  if (requestedRole === 'admin') return 'admin';
  return member?.isAdmin === true ? 'admin' : 'user';
}
