import { describe, it, expect, vi, afterEach } from 'vitest';
import { firebaseRest, SyncError } from '../../src/services/rest-client';

const URL = 'https://example.firebasedatabase.app/rooms/R1.json';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(impl: any) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

describe('firebaseRest — 동기화 실패를 삼키지 않고 전파한다', () => {
  // 정상 케이스
  it('2xx 응답이면 파싱된 JSON을 반환한다', async () => {
    stubFetch(async () => ({ ok: true, status: 200, json: async () => ({ roomId: 'R1' }) }));
    await expect(firebaseRest(URL)).resolves.toEqual({ roomId: 'R1' });
  });

  it('본문이 null이어도 정상 처리한다 (존재하지 않는 경로)', async () => {
    stubFetch(async () => ({ ok: true, status: 200, json: async () => null }));
    await expect(firebaseRest(URL)).resolves.toBeNull();
  });

  // 경계·예외 케이스 — 지금까지 조용히 삼켜지던 것들
  it('404 응답이면 SyncError를 던진다', async () => {
    stubFetch(async () => ({ ok: false, status: 404, text: async () => 'Not Found' }));
    await expect(firebaseRest(URL)).rejects.toBeInstanceOf(SyncError);
  });

  it('401 응답이면 권한 안내가 담긴 메시지를 던진다', async () => {
    stubFetch(async () => ({ ok: false, status: 401, text: async () => 'Permission denied' }));
    await expect(firebaseRest(URL)).rejects.toThrow(/권한/);
  });

  it('네트워크 실패면 접속 안내가 담긴 메시지를 던진다', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(firebaseRest(URL)).rejects.toThrow(/연결/);
  });

  it('던지는 오류에 HTTP 상태와 URL이 담겨 원인 추적이 가능하다', async () => {
    stubFetch(async () => ({ ok: false, status: 500, text: async () => 'boom' }));
    try {
      await firebaseRest(URL);
      throw new Error('여기 도달하면 안 된다');
    } catch (e) {
      const err = e as SyncError;
      expect(err.status).toBe(500);
      expect(err.url).toBe(URL);
    }
  });

  it('쓰기 요청도 동일하게 실패를 전파한다', async () => {
    stubFetch(async () => ({ ok: false, status: 403, text: async () => 'denied' }));
    await expect(
      firebaseRest(URL, { method: 'PUT', body: JSON.stringify({ a: 1 }) })
    ).rejects.toBeInstanceOf(SyncError);
  });
});
