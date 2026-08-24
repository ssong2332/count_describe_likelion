import { DepartureType, Member, StatusLog } from './types';

export function createDefaultMember(
  id: string,
  name: string,
  phone?: string,
  group?: string,
  shiftTime?: string,
  roleNote?: string
): Member {
  return {
    id,
    name: name.trim(),
    phone: phone?.trim() || undefined,
    group: group?.trim() || undefined,
    shiftTime: shiftTime?.trim() || undefined,
    roleNote: roleNote?.trim() || undefined,
    isPresent: false, // 기본값은 미출석 (1단계 출석 필요)
    activeStatus: 'none',
    logs: [],
  };
}

export function toggleAttendance(member: Member): Member {
  const newIsPresent = !member.isPresent;
  // 결석 처리 시 활성화된 자리비움이 있다면 자동 종료
  if (!newIsPresent && member.activeStatus !== 'none') {
    return {
      ...endDeparture(member),
      isPresent: false,
    };
  }
  return {
    ...member,
    isPresent: newIsPresent,
  };
}

export function markPresent(member: Member): Member {
  return {
    ...member,
    isPresent: true,
  };
}

export function startDeparture(
  member: Member,
  type: DepartureType,
  reason?: string,
  timestamp: number = Date.now()
): { member: Member; error?: string } {
  // 1단계 출석 검증: 미출석 상태에서는 자리비움 불가
  if (!member.isPresent) {
    return { member, error: '출석 체크를 먼저 진행해주세요.' };
  }

  // 자리비움 중복 전환 차단
  if (member.activeStatus !== 'none' && member.activeStatus !== type) {
    const currentName =
      member.activeStatus === 'toilet'
        ? '화장실'
        : member.activeStatus === 'smoking'
        ? '흡연'
        : '기타';
    return {
      member,
      error: `현재 [${currentName}] 이용 중입니다. 먼저 복귀(OFF) 처리를 해주세요.`,
    };
  }

  if (type === 'none') {
    return { member: endDeparture(member, timestamp) };
  }

  return {
    member: {
      ...member,
      activeStatus: type,
      activeReason: reason?.trim() || undefined,
      departureTime: timestamp,
    },
  };
}

export function endDeparture(
  member: Member,
  timestamp: number = Date.now()
): Member {
  if (member.activeStatus === 'none' || !member.departureTime) {
    return member;
  }

  const startAt = member.departureTime;
  const endAt = Math.max(startAt, timestamp);
  const durationSeconds = Math.max(0, Math.round((endAt - startAt) / 1000));

  const newLog: StatusLog = {
    id: `log-${startAt}-${Math.random().toString(36).substring(2, 7)}`,
    type: member.activeStatus,
    reason: member.activeReason,
    startAt,
    endAt,
    durationSeconds,
  };

  return {
    ...member,
    activeStatus: 'none',
    activeReason: undefined,
    departureTime: undefined,
    logs: [newLog, ...member.logs],
  };
}

export function resetMemberDaily(member: Member): Member {
  return {
    ...member,
    isPresent: false,
    activeStatus: 'none',
    activeReason: undefined,
    departureTime: undefined,
    logs: [],
  };
}

export interface SummaryStats {
  total: number;
  present: number;
  absent: number;
  toilet: number;
  smoking: number;
  etc: number;
}

export function calculateSummary(members: Member[]): SummaryStats {
  const stats: SummaryStats = {
    total: members.length,
    present: 0,
    absent: 0,
    toilet: 0,
    smoking: 0,
    etc: 0,
  };

  for (const m of members) {
    if (m.isPresent) {
      stats.present += 1;
    } else {
      stats.absent += 1;
    }

    if (m.activeStatus === 'toilet') stats.toilet += 1;
    else if (m.activeStatus === 'smoking') stats.smoking += 1;
    else if (m.activeStatus === 'etc') stats.etc += 1;
  }

  return stats;
}

// 시간대별 정렬 함수
export function sortMembersByShiftTime(members: Member[]): Member[] {
  return [...members].sort((a, b) => {
    const timeA = a.shiftTime || '99:99';
    const timeB = b.shiftTime || '99:99';
    return timeA.localeCompare(timeB);
  });
}

export interface ScheduleBlock {
  shiftTime: string;
  squads: {
    squadName: string;
    members: Member[];
  }[];
}

// 6번 요구사항: 동명이인이 없는 가정 -> 고유 인원(18명)으로 파싱하되 시간대별 스케줄 구조 생성
export function buildScheduleBlocks(members: Member[]): ScheduleBlock[] {
  // 정의된 표준 시간대 순서
  const standardShifts = [
    '12:00 ~ 13:05',
    '13:00 ~ 14:05',
    '14:00 ~ 15:05',
    '15:00 ~ 16:05',
    '16:00 ~ 17:05',
    '17:30 ~ 18:00',
  ];

  const shiftMap: Record<string, Record<string, Member[]>> = {};

  for (const m of members) {
    const shifts = m.shiftTime ? m.shiftTime.split(',').map((s) => s.trim()) : ['시간 미지정'];
    const squad = m.group || '조 미지정';

    for (const shift of shifts) {
      if (!shiftMap[shift]) {
        shiftMap[shift] = {};
      }
      if (!shiftMap[shift][squad]) {
        shiftMap[shift][squad] = [];
      }
      shiftMap[shift][squad].push(m);
    }
  }

  const allShifts = Array.from(new Set([...standardShifts, ...Object.keys(shiftMap)])).filter((s) => shiftMap[s]);

  return allShifts.map((shiftTime) => {
    const squadsObj = shiftMap[shiftTime] || {};
    const squads = Object.entries(squadsObj).map(([squadName, sMembers]) => ({
      squadName,
      members: sMembers,
    }));
    return {
      shiftTime,
      squads,
    };
  });
}

// 4번 & 6번 요구사항: 텍스트/표 파서 (동명이인은 1명의 고유 멤버로 통합)
export function parseScheduleTextToMembers(rawText: string): Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[] {
  const memberMap: Map<string, {
    name: string;
    phone?: string;
    groupList: Set<string>;
    shiftList: Set<string>;
    roleNote?: string;
  }> = new Map();

  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  for (const line of lines) {
    // 헤더 행 또는 구분선 제외
    if (line.startsWith('---') || line.includes('시간대') && line.includes('메인')) {
      continue;
    }

    // 탭 또는 공백(2개 이상), 쉼표, 파이프('|') 분리
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map((p) => p.trim());
    } else if (line.includes('|')) {
      parts = line.split('|').map((p) => p.trim()).filter((p) => p.length > 0);
    } else {
      parts = line.split(/\s{2,}/).map((p) => p.trim());
    }

    if (parts.length >= 2) {
      const shiftRaw = parts[0];
      // 시간대 표준화
      let shift = shiftRaw;
      if (shiftRaw.includes('12시')) shift = '12:00 ~ 13:05';
      else if (shiftRaw.includes('1시')) shift = '13:00 ~ 14:05';
      else if (shiftRaw.includes('2시')) shift = '14:00 ~ 15:05';
      else if (shiftRaw.includes('3시')) shift = '15:00 ~ 16:05';
      else if (shiftRaw.includes('4시')) shift = '16:00 ~ 17:05';
      else if (shiftRaw.includes('5시')) shift = '17:30 ~ 18:00';

      const mainAdmin = parts[1] || '';
      const squad1 = parts[3] || '';
      const squad2 = parts[4] || '';

      const addPerson = (name: string, group: string, role: string) => {
        const cleanName = name.trim();
        if (!cleanName || cleanName === '전원') return;
        if (!memberMap.has(cleanName)) {
          memberMap.set(cleanName, {
            name: cleanName,
            groupList: new Set([group]),
            shiftList: new Set([shift]),
            roleNote: role,
          });
        } else {
          const existing = memberMap.get(cleanName)!;
          existing.groupList.add(group);
          existing.shiftList.add(shift);
        }
      };

      if (mainAdmin) addPerson(mainAdmin, '메인 운영진', '메인 운영진');
      if (squad1) {
        squad1.split(',').forEach((n) => addPerson(n, `전우조1 (${squad1.trim()})`, '아기사자'));
      }
      if (squad2) {
        squad2.split(',').forEach((n) => addPerson(n, `전우조2 (${squad2.trim()})`, '아기사자'));
      }
    }
  }

  // 18명의 고유 멤버 배열로 변환
  const result: Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[] = [];
  memberMap.forEach((val) => {
    result.push({
      name: val.name,
      group: Array.from(val.groupList)[0], // 대표 조
      shiftTime: Array.from(val.shiftList).join(', '),
      roleNote: val.roleNote,
    });
  });

  return result;
}

export const DEFAULT_SCHEDULE_TABLE_TEMPLATE = `시간대	메인 운영진	아기사자	전우조1	전우조2
12시 ~ 1시(+5분)	A	a,b,c,d	a,b	c,d
1시  ~ 2시 (+5분)	B	aa,bb,cc,dd	aa,cc	bb,dd
2시 ~ 3시(+5분)	C	aaa,bbb,ccc,ddd	ccc,bbb	aaa,ddd
3시 ~ 4시(+5분)	D	e,f,g,h	e,f	g,h
4시 ~ 5시(+5분)	E	ee,ff,gg,hh	ff,hh	ee,gg
5시 반~ 6시	전원	전원		`;
