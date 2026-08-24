import { describe, it, expect } from 'vitest';
import { DepartureType, Member } from '../src/domain/types';

describe('Smoke Test - System Harness', () => {
  it('should initialize basic domain types correctly', () => {
    const member: Member = {
      id: 'test-1',
      name: '홍길동',
      isPresent: true,
      activeStatus: 'none',
      logs: [],
    };

    expect(member.name).toBe('홍길동');
    expect(member.isPresent).toBe(true);
    expect(member.activeStatus).toBe<DepartureType>('none');
  });
});
