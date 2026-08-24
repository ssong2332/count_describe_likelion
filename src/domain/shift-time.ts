/**
 * 부스 운영 시간대.
 *
 * 한 인원이 여러 시간대를 맡을 수 있으므로 다중 선택을 지원한다.
 * 저장 형식은 기존과 같은 콤마 결합 문자열이다 — buildScheduleBlocks가
 * 이미 콤마로 분리해 시간대별 블록을 만들기 때문에 데이터 구조를 바꾸지
 * 않고도 그대로 맞물린다. 예전에 저장된 단일 값도 그대로 읽힌다.
 */
export const PRESET_SHIFTS = [
  '12:00 ~ 13:00',
  '13:00 ~ 14:00',
  '14:00 ~ 15:00',
  '15:00 ~ 16:00',
  '16:00 ~ 17:00',
  '17:00 ~ 18:00',
];

export function parseShiftTimes(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** 시작 시각 기준 정렬 키. 시각 형식이 아니면 뒤로 보낸다. */
function sortKey(shift: string): string {
  const match = shift.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '99:99';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function formatShiftTimes(shifts: string[]): string {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const s of shifts) {
    const clean = s.trim();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    unique.push(clean);
  }

  return unique.sort((a, b) => sortKey(a).localeCompare(sortKey(b))).join(', ');
}

export function toggleShiftTime(current: string | undefined, shift: string): string {
  const clean = shift.trim();
  const selected = parseShiftTimes(current);

  const next = selected.includes(clean)
    ? selected.filter((s) => s !== clean)
    : [...selected, clean];

  return formatShiftTimes(next);
}

export function isShiftSelected(current: string | undefined, shift: string): boolean {
  return parseShiftTimes(current).includes(shift.trim());
}
