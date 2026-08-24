/**
 * 전화번호 자동 하이픈.
 *
 * 입력 중에도 매 글자마다 다시 계산해 붙이므로, 사용자가 숫자만 눌러도
 * 010-1234-5678 형태가 된다. 붙여넣기나 지우기에도 같은 규칙이 적용된다.
 */
const MAX_DIGITS = 11;

export function formatPhoneNumber(raw: string | undefined | null): string {
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '').slice(0, MAX_DIGITS);
  if (digits.length === 0) return '';

  // 서울 지역번호(02)만 앞자리가 2개다.
  const headLength = digits.startsWith('02') ? 2 : 3;

  const head = digits.slice(0, headLength);
  const rest = digits.slice(headLength);

  if (rest.length === 0) return head;

  // 010 번호는 전부 11자리(3-4-4)이므로, 입력 도중에도 가운데를 4로 끊는다.
  // 그 외 번호는 다 입력돼야 자릿수를 알 수 있어 남은 길이로 판단한다.
  const middleLength = head === '010' || rest.length > 7 ? 4 : 3;
  const middle = rest.slice(0, middleLength);
  const tail = rest.slice(middleLength);

  if (tail.length === 0) return `${head}-${middle}`;
  return `${head}-${middle}-${tail}`;
}

/** 저장용 — 화면 표기와 동일한 형식으로 통일한다. */
export function normalizePhoneNumber(raw: string | undefined | null): string | undefined {
  const formatted = formatPhoneNumber(raw);
  return formatted.length > 0 ? formatted : undefined;
}
