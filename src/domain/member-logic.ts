import { PRESET_SHIFTS } from './shift-time';
import { DepartureType, Member, StatusLog } from './types';

export function createDefaultMember(
  id: string,
  name: string,
  phone?: string,
  group?: string,
  shiftTime?: string,
  roleNote?: string,
  isAdmin?: boolean
): Member {
  return {
    id,
    name: name.trim(),
    phone: phone?.trim() || undefined,
    group: group?.trim() || undefined,
    shiftTime: shiftTime?.trim() || undefined,
    roleNote: roleNote?.trim() || undefined,
    isAdmin: !!isAdmin,
    isPresent: false, // 기본값은 미출석 (1단계 출석 필요)
    activeStatus: 'none',
    logs: [],
  };
}

export function toggleAttendance(member: Member): Member {
  const newIsPresent = !member.isPresent;
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
  if (!member.isPresent) {
    return { member, error: '출석 체크를 먼저 진행해주세요.' };
  }

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

// 스케줄 블록 빌더 (순수 조별 묶음)
export function buildScheduleBlocks(members: Member[]): ScheduleBlock[] {
  const standardShifts = PRESET_SHIFTS;

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

// 표 파서
export function parseScheduleTextToMembers(rawText: string): Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[] {
  const memberMap: Map<string, {
    name: string;
    phone?: string;
    groupList: Set<string>;
    shiftList: Set<string>;
    roleNote?: string;
    isAdmin?: boolean;
  }> = new Map();

  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  for (const line of lines) {
    if (line.startsWith('---') || (line.includes('시간대') && line.includes('메인'))) {
      continue;
    }

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
      let shift = shiftRaw;
      // 일괄 등록도 수동 입력과 같은 1시간 단위 문자열을 쓴다.
      // 값이 다르면 같은 시간대가 두 블록으로 쪼개진다.
      if (shiftRaw.includes('12시')) shift = PRESET_SHIFTS[0];
      else if (shiftRaw.includes('1시')) shift = PRESET_SHIFTS[1];
      else if (shiftRaw.includes('2시')) shift = PRESET_SHIFTS[2];
      else if (shiftRaw.includes('3시')) shift = PRESET_SHIFTS[3];
      else if (shiftRaw.includes('4시')) shift = PRESET_SHIFTS[4];
      else if (shiftRaw.includes('5시')) shift = PRESET_SHIFTS[5];

      const mainAdmin = parts[1] || '';
      const squad1 = parts[3] || '';
      const squad2 = parts[4] || '';

      const addPerson = (name: string, group: string, isAdmin: boolean) => {
        const cleanName = name.trim();
        if (!cleanName || cleanName === '전원') return;
        if (!memberMap.has(cleanName)) {
          memberMap.set(cleanName, {
            name: cleanName,
            groupList: new Set(group ? [group] : []),
            shiftList: new Set([shift]),
            isAdmin,
          });
        } else {
          const existing = memberMap.get(cleanName)!;
          if (group) existing.groupList.add(group);
          existing.shiftList.add(shift);
          if (isAdmin) existing.isAdmin = true;
        }
      };

      if (mainAdmin) addPerson(mainAdmin, '관리자', true);
      if (squad1) {
        squad1.split(',').forEach((n) => addPerson(n, `전우조1 (${squad1.trim()})`, false));
      }
      if (squad2) {
        squad2.split(',').forEach((n) => addPerson(n, `전우조2 (${squad2.trim()})`, false));
      }
    }
  }

  const result: Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[] = [];
  memberMap.forEach((val) => {
    result.push({
      name: val.name,
      group: Array.from(val.groupList)[0] || undefined,
      shiftTime: Array.from(val.shiftList).join(', '),
      isAdmin: val.isAdmin,
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
