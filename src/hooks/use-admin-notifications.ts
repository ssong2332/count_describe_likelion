import { useEffect, useRef, useState, useCallback } from 'react';
import { Member } from '../domain/types';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendNotification,
} from '../services/notification.service';

/**
 * 관리자 알림.
 *
 * - 경고음(Web Audio)은 사용자 요청으로 제거했다. 알림은 무음으로 발송된다.
 * - 발송은 notification.service를 통해서만 한다. 모바일에서 예외가 나
 *   화면이 검게 비는 일이 없도록 이 훅은 어떤 알림 실패도 밖으로 던지지 않는다.
 */
export function useAdminNotifications(members: Member[], isEnabled: boolean = true) {
  const prevStatusRef = useRef<Map<string, string>>(new Map());
  const notified9MinRef = useRef<Set<string>>(new Set());
  const [overdueMembers, setOverdueMembers] = useState<Member[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );

  const requestPermission = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setPermissionStatus(perm);

    if (perm === 'granted') {
      void sendNotification(
        '🔔 알림 활성화 완료',
        '자리비움 상태 전환 및 9분 초과 시 휴대폰 알림이 표시됩니다.',
        { tag: 'permission-granted' }
      );
    } else if (perm === 'denied') {
      alert(
        '브라우저 설정에서 알림 권한이 차단되어 있습니다. 주소창 좌측의 자물쇠/설정 아이콘을 눌러 알림을 [허용]으로 변경해주세요.'
      );
    }

    return perm;
  }, []);

  // 상태 변경 감지
  useEffect(() => {
    if (!isEnabled) return;

    const prevMap = prevStatusRef.current;

    for (const m of members) {
      const prevStatus = prevMap.get(m.id);
      const currentStatus = m.activeStatus;

      if (prevStatus !== undefined && prevStatus !== currentStatus) {
        if (currentStatus === 'none') {
          void sendNotification(`✅ [${m.name}] 복귀 완료`, `${m.name} 님이 자리로 복귀했습니다.`, {
            tag: `status-${m.id}`,
          });
          notified9MinRef.current.delete(m.id);
        } else {
          const statusName =
            currentStatus === 'toilet'
              ? '화장실'
              : currentStatus === 'smoking'
                ? '흡연'
                : m.activeReason || '기타';
          void sendNotification(
            `🏃 [${m.name}] 자리비움 시작`,
            `${m.name} 님이 [${statusName}] 상태로 전환했습니다.`,
            { tag: `status-${m.id}` }
          );
        }
      }

      prevMap.set(m.id, currentStatus);
    }
  }, [members, isEnabled]);

  // 9분 초과 자리비움 모니터링
  useEffect(() => {
    if (!isEnabled) return;

    const checkOverdue = () => {
      const now = Date.now();
      const NINE_MINUTES_MS = 9 * 60 * 1000;
      const currentOverdue: Member[] = [];

      for (const m of members) {
        if (m.isPresent && m.activeStatus !== 'none' && m.departureTime) {
          const elapsed = now - m.departureTime;
          if (elapsed >= NINE_MINUTES_MS) {
            currentOverdue.push(m);

            if (!notified9MinRef.current.has(m.id)) {
              notified9MinRef.current.add(m.id);

              const statusName =
                m.activeStatus === 'toilet' ? '화장실' : m.activeStatus === 'smoking' ? '흡연' : '기타';
              void sendNotification(
                `⚠️ [경고] ${m.name} 님 9분 초과!`,
                `${m.name} 님이 [${statusName}] 상태로 자리를 비운 지 9분이 지났습니다.`,
                { tag: `overdue-${m.id}`, requireInteraction: true }
              );
            }
          }
        } else {
          notified9MinRef.current.delete(m.id);
        }
      }

      setOverdueMembers(currentOverdue);
    };

    checkOverdue();
    const interval = setInterval(checkOverdue, 3000);
    return () => clearInterval(interval);
  }, [members, isEnabled]);

  return {
    overdueMembers,
    permissionStatus,
    requestPermission,
  };
}
