// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendNotification } from '../../src/services/notification.service';

/**
 * Android Chrome은 `new Notification()` 생성자를 지원하지 않고 예외를 던진다.
 * 이 예외가 useEffect 안에서 그대로 터지면 React 트리가 언마운트되어
 * 화면이 새까맣게 비고, 새로고침해야 돌아온다 (핸드폰 검은 화면 증상).
 * 알림 계층은 어떤 경우에도 예외를 밖으로 내보내지 않아야 한다.
 */
describe('sendNotification — 알림은 절대 앱을 죽이지 않는다', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubPermission(permission: string) {
    const ctor: any = function () {
      throw new TypeError('Illegal constructor');
    };
    ctor.permission = permission;
    vi.stubGlobal('Notification', ctor);
  }

  // 정상 케이스 — 서비스 워커 경로 (모바일에서 실제로 동작하는 경로)
  it('서비스 워커가 있으면 registration.showNotification으로 보낸다', async () => {
    const showNotification = vi.fn().mockResolvedValue(undefined);
    stubPermission('granted');
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve({ showNotification }) } });

    const ok = await sendNotification('제목', '본문');

    expect(ok).toBe(true);
    expect(showNotification).toHaveBeenCalledTimes(1);
    expect(showNotification.mock.calls[0][0]).toBe('제목');
  });

  it('소리가 나지 않도록 silent 옵션을 켜서 보낸다', async () => {
    const showNotification = vi.fn().mockResolvedValue(undefined);
    stubPermission('granted');
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve({ showNotification }) } });

    await sendNotification('제목', '본문');

    expect(showNotification.mock.calls[0][1]).toMatchObject({ silent: true, body: '본문' });
  });

  // 경계 케이스
  it('권한이 granted가 아니면 보내지 않고 false를 반환한다', async () => {
    const showNotification = vi.fn();
    stubPermission('default');
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve({ showNotification }) } });

    await expect(sendNotification('제목', '본문')).resolves.toBe(false);
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('Notification API 자체가 없는 환경에서도 조용히 false를 반환한다', async () => {
    vi.stubGlobal('Notification', undefined);
    vi.stubGlobal('navigator', {});

    await expect(sendNotification('제목', '본문')).resolves.toBe(false);
  });

  // 예외 케이스 — 검은 화면 재현 지점
  it('생성자가 예외를 던져도(안드로이드 크롬) 예외를 밖으로 내보내지 않는다', async () => {
    stubPermission('granted');
    vi.stubGlobal('navigator', {}); // 서비스 워커 없음 → 생성자 폴백 → throw

    await expect(sendNotification('제목', '본문')).resolves.toBe(false);
  });

  it('서비스 워커 showNotification이 거부돼도 예외를 내보내지 않는다', async () => {
    stubPermission('granted');
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve({ showNotification: () => Promise.reject(new Error('boom')) }) },
    });

    await expect(sendNotification('제목', '본문')).resolves.toBe(false);
  });

  it('serviceWorker.ready 자체가 거부돼도 예외를 내보내지 않는다', async () => {
    stubPermission('granted');
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.reject(new Error('no sw')) } });

    await expect(sendNotification('제목', '본문')).resolves.toBe(false);
  });
});
