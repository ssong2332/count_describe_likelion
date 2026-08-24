import { describe, it, expect } from 'vitest';
import { resolveSessionRole } from '../../src/domain/session-role';
import { Member } from '../../src/domain/types';

function member(overrides: Partial<Member> = {}): Member {
  return {
    id: 'm1',
    name: '홍길동',
    isPresent: true,
    activeStatus: 'none',
    logs: [],
    ...overrides,
  };
}

describe('resolveSessionRole — 관리자가 사용자 모드로 들어와도 관리자 화면을 준다', () => {
  // 정상 케이스
  it('관리자로 등록된 인원이 사용자 모드로 들어오면 admin으로 승격한다', () => {
    expect(resolveSessionRole('user', member({ isAdmin: true }))).toBe('admin');
  });

  it('일반 인원이 사용자 모드로 들어오면 user 그대로다', () => {
    expect(resolveSessionRole('user', member({ isAdmin: false }))).toBe('user');
  });

  // 경계 케이스
  it('관리자 모드로 들어오면 인원과 무관하게 admin이다', () => {
    expect(resolveSessionRole('admin', member({ isAdmin: false }))).toBe('admin');
    expect(resolveSessionRole('admin', null)).toBe('admin');
  });

  it('isAdmin 키가 아예 없는 기존 데이터는 user로 취급한다', () => {
    expect(resolveSessionRole('user', member())).toBe('user');
  });

  // 예외 케이스
  it('인원 정보가 없으면 요청한 역할을 그대로 쓴다', () => {
    expect(resolveSessionRole('user', null)).toBe('user');
    expect(resolveSessionRole('user', undefined)).toBe('user');
  });

  it('isAdmin이 문자열 등 예상 밖 값이면 승격하지 않는다', () => {
    expect(resolveSessionRole('user', member({ isAdmin: 'yes' as unknown as boolean }))).toBe('user');
  });
});
