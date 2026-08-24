/**
 * 배포 플랫폼(Vercel 등)의 환경변수 값 정제.
 *
 * Vite는 로컬 환경변수 파일을 dotenv로 파싱하며 값을 감싼 따옴표를 제거하지만,
 * Vercel 대시보드에 입력된 값은 원문 그대로 번들에 인라인된다.
 * 따라서 대시보드에 `"https://..."` 처럼 따옴표째 저장하면
 * 따옴표가 URL의 일부가 되어 REST 404 / WebSocket ERR_NAME_NOT_RESOLVED 를 일으킨다.
 */
export function sanitizeConfigValue(raw: string | undefined | null): string | undefined {
  if (typeof raw !== 'string') return undefined;

  let value = raw.trim();

  // 앞뒤를 모두 감싼 따옴표만 제거한다 (한쪽만 있으면 값의 일부로 본다)
  while (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      value = value.slice(1, -1).trim();
    } else {
      break;
    }
  }

  // REST 경로 조합 시 이중 슬래시가 생기지 않도록 끝 슬래시 제거
  while (value.endsWith('/')) {
    value = value.slice(0, -1);
  }

  return value.length > 0 ? value : undefined;
}
