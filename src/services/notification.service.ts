/**
 * 알림 발송 계층.
 *
 * 두 가지를 보장한다.
 * 1. 모바일 대응 — Android Chrome은 `new Notification()` 생성자를 지원하지 않고
 *    `TypeError: Illegal constructor` 를 던진다. 모바일에서 알림을 띄우려면
 *    서비스 워커의 `registration.showNotification()` 을 써야 한다.
 * 2. 무해성 — 어떤 실패도 호출자에게 전파하지 않는다. 알림 실패가 React
 *    렌더 트리를 무너뜨려 화면이 검게 비는 일이 없어야 한다.
 *
 * 소리는 내지 않는다 (silent). 사용자 요청에 따라 경고음을 제거했다.
 */
export interface NotifyOptions {
  /** 같은 tag의 알림은 덮어써서 중복 쌓임을 막는다 */
  tag?: string;
  /** 중요 알림은 사용자가 닫을 때까지 유지 */
  requireInteraction?: boolean;
}

export function getNotificationPermission(): NotificationPermission {
  try {
    if (typeof Notification === 'undefined') return 'denied';
    return Notification.permission;
  } catch {
    return 'denied';
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  try {
    if (typeof Notification === 'undefined') return 'denied';
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export async function sendNotification(
  title: string,
  body: string,
  options: NotifyOptions = {}
): Promise<boolean> {
  try {
    if (getNotificationPermission() !== 'granted') return false;

    const payload = {
      body,
      silent: true,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction ?? false,
    };

    // 1순위: 서비스 워커 — 모바일에서 동작하는 유일한 경로
    const sw = (globalThis as any).navigator?.serviceWorker;
    if (sw?.ready) {
      try {
        const registration = await sw.ready;
        await registration.showNotification(title, payload);
        return true;
      } catch (e) {
        console.error('[Notification] 서비스 워커 알림 실패:', e);
        return false;
      }
    }

    // 2순위: 데스크톱 생성자 (모바일에서는 여기서 예외가 난다 → 삼킨다)
    new Notification(title, payload);
    return true;
  } catch (e) {
    console.error('[Notification] 알림 발송 실패:', e);
    return false;
  }
}
