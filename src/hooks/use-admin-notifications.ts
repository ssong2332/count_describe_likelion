import { useEffect, useRef } from 'react';
import { Member } from '../domain/types';

export function useAdminNotifications(members: Member[], isEnabled: boolean = true) {
  const prevStatusRef = useRef<Map<string, string>>(new Map());
  const notified9MinRef = useRef<Set<string>>(new Set());

  // 브라우저 Notification 권한 요청
  useEffect(() => {
    if (!isEnabled) return;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isEnabled]);

  // 상태 변경 감지 및 알림 발송
  useEffect(() => {
    if (!isEnabled) return;
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const prevMap = prevStatusRef.current;

    for (const m of members) {
      const prevStatus = prevMap.get(m.id);
      const currentStatus = m.activeStatus;

      if (prevStatus !== undefined && prevStatus !== currentStatus) {
        if (currentStatus === 'none') {
          new Notification(`✅ [${m.name}] 복귀 완료`, {
            body: `${m.name} 님이 자리로 복귀했습니다.`,
            icon: '/favicon.ico',
          });
          notified9MinRef.current.delete(m.id);
        } else {
          const statusName =
            currentStatus === 'toilet' ? '화장실' : currentStatus === 'smoking' ? '흡연' : m.activeReason || '기타';
          new Notification(`🏃 [${m.name}] 자리비움 시작`, {
            body: `${m.name} 님이 [${statusName}] 상태로 전환했습니다.`,
            icon: '/favicon.ico',
          });
        }
      }

      prevMap.set(m.id, currentStatus);
    }
  }, [members, isEnabled]);

  // 8번 요구사항: 9분(540초) 초과 자리비움 모니터링 알림
  useEffect(() => {
    if (!isEnabled) return;
    const interval = setInterval(() => {
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      const now = Date.now();
      const NINE_MINUTES_MS = 9 * 60 * 1000;

      for (const m of members) {
        if (m.isPresent && m.activeStatus !== 'none' && m.departureTime) {
          const elapsed = now - m.departureTime;
          if (elapsed >= NINE_MINUTES_MS && !notified9MinRef.current.has(m.id)) {
            notified9MinRef.current.add(m.id);
            const statusName =
              m.activeStatus === 'toilet' ? '화장실' : m.activeStatus === 'smoking' ? '흡연' : '기타';
            new Notification(`⚠️ [경고] ${m.name} 님 9분 초과!`, {
              body: `${m.name} 님이 [${statusName}] 상태로 자리를 비운 지 9분이 지났습니다.`,
              icon: '/favicon.ico',
            });
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [members, isEnabled]);
}
