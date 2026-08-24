import { describe, it, expect } from 'vitest';
import {
  createDefaultMember,
  markPresent,
  startDeparture,
  calculateSummary,
  parseScheduleTextToMembers,
  buildScheduleBlocks,
  DEFAULT_SCHEDULE_TABLE_TEMPLATE,
} from '../../src/domain/member-logic';

describe('Member Domain Logic', () => {
  it('should create default member with proper initial values', () => {
    const member = createDefaultMember('m-1', '  홍길동  ', '010-1234-5678', '전우조1', '12:00 ~ 13:05');
    expect(member.id).toBe('m-1');
    expect(member.name).toBe('홍길동');
    expect(member.phone).toBe('010-1234-5678');
    expect(member.group).toBe('전우조1');
    expect(member.shiftTime).toBe('12:00 ~ 13:05');
    expect(member.isPresent).toBe(false);
    expect(member.activeStatus).toBe('none');
    expect(member.logs).toEqual([]);
  });

  it('should prevent departure when member is absent', () => {
    const member = createDefaultMember('m-1', '홍길동');
    expect(member.isPresent).toBe(false);

    const res = startDeparture(member, 'toilet');
    expect(res.error).toBe('출석 체크를 먼저 진행해주세요.');
    expect(res.member.activeStatus).toBe('none');
  });

  it('should prevent switching departure without ending current departure', () => {
    let member = markPresent(createDefaultMember('m-1', '홍길동'));
    const res1 = startDeparture(member, 'toilet');
    member = res1.member;
    expect(member.activeStatus).toBe('toilet');

    const res2 = startDeparture(member, 'smoking');
    expect(res2.error).toContain('현재 [화장실] 이용 중입니다');
    expect(res2.member.activeStatus).toBe('toilet');
  });

  // 6번 요구사항: 표 파서가 고유 멤버로 통합 파싱하는지 검증
  it('should parse schedule table into unique members without duplicate names', () => {
    const members = parseScheduleTextToMembers(DEFAULT_SCHEDULE_TABLE_TEMPLATE);
    expect(members.length).toBe(25); // 메인 5명(A,B,C,D,E) + 아기사자 20명 = 25명 고유
    const names = members.map((m) => m.name);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  // 5번 요구사항: 스케줄 블록 빌더 검증
  it('should build schedule blocks properly', () => {
    const m1 = createDefaultMember('1', 'A', undefined, '메인 운영진', '12:00 ~ 13:05');
    const m2 = createDefaultMember('2', 'a', undefined, '전우조1', '12:00 ~ 13:05');
    const blocks = buildScheduleBlocks([m1, m2]);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    expect(blocks.find((b) => b.shiftTime === '12:00 ~ 13:05')?.squads.length).toBe(2);
  });

  it('should calculate summary correctly', () => {
    const m1 = markPresent(createDefaultMember('1', 'A'));
    const m2 = createDefaultMember('2', 'B');
    const m3 = startDeparture(markPresent(createDefaultMember('3', 'C')), 'toilet').member;

    const summary = calculateSummary([m1, m2, m3]);
    expect(summary.total).toBe(3);
    expect(summary.present).toBe(2);
    expect(summary.absent).toBe(1);
    expect(summary.toilet).toBe(1);
  });
});
