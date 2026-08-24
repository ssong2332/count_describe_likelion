/**
 * Firebase REST 호출 공통 클라이언트.
 *
 * 이전 구현은 모든 실패를 `console.warn` / `.catch(() => {})` 로 삼켜서,
 * 클라우드 저장이 통째로 실패해도 화면에는 아무 표시가 나지 않았다.
 * 여기서는 실패를 반드시 SyncError로 던져 호출자가 사용자에게 알릴 수 있게 한다.
 */
export class SyncError extends Error {
  readonly status?: number;
  readonly url: string;

  constructor(message: string, url: string, status?: number) {
    super(message);
    this.name = 'SyncError';
    this.url = url;
    this.status = status;
  }
}

function messageForStatus(status: number): string {
  if (status === 401 || status === 403) {
    return '클라우드 접근 권한이 거부되었습니다 (데이터베이스 보안 규칙을 확인하세요)';
  }
  if (status === 404) {
    return '클라우드 주소를 찾을 수 없습니다 (Firebase 설정값을 확인하세요)';
  }
  if (status >= 500) {
    return '클라우드 서버 오류로 저장에 실패했습니다';
  }
  return '클라우드 요청이 거부되었습니다';
}

export async function firebaseRest(url: string, init?: RequestInit): Promise<any> {
  let res: Response;

  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
  } catch (e: any) {
    throw new SyncError(
      `클라우드 연결에 실패했습니다 (인터넷 연결을 확인하세요): ${e?.message ?? e}`,
      url
    );
  }

  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 200);
    } catch {
      detail = '';
    }
    throw new SyncError(
      `${messageForStatus(res.status)} [HTTP ${res.status}]${detail ? ` ${detail}` : ''}`,
      url,
      res.status
    );
  }

  return res.json();
}
