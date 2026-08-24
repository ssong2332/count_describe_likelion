import { useEffect, useRef, useState, useCallback } from 'react';
import { Member } from '../domain/types';

// Web Audio API를 활용한 알림 경고음 생성 함수
function playAlertBeep(frequency = 660, duration = 0.4) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error('Audio beep failed', e);
  }
}

export function useAdminNotifications(members: Member[], isEnabled: boolean = true) {
  const prevStatusRef = useRef<Map<string, string>>(new Map());
  const notified9MinRef = useRef<Set<string>>(new Set());
  const [overdueMembers, setOverdueMembers] = useState<Member[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);
      return perm;
    }
    return 'denied';
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
          playAlertBeep(523, 0.2); // 도
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(`✅ [${m.name}] 복귀 완료`, {
              body: `${m.name} 님이 자리로 복귀했습니다.`,
              icon: '/favicon.ico',
            });
          }
          notified9MinRef.current.delete(m.id);
        } else {
          playAlertBeep(784, 0.3); // 솔
          const statusName =
            currentStatus === 'toilet' ? '화장실' : currentStatus === 'smoking' ? '흡연' : m.activeReason || '기타';
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(`🏃 [${m.name}] 자리비움 시작`, {
              body: `${m.name} 님이 [${statusName}] 상태로 전환했습니다.`,
              icon: '/favicon.ico',
            });
          }
        }
      }

      prevMap.set(m.id, currentStatus);
    }
  }, [members, isEnabled]);

  // 3번 요구사항: 9분(540초) 초과 자리비움 모니터링
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
              playAlertBeep(880, 0.6); // 라 (경고 톤)

              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                const statusName =
                  m.activeStatus === 'toilet' ? '화장실' : m.activeStatus === 'smoking' ? '흡연' : '기타';
                new Notification(`⚠️ [경고] ${m.name} 님 9분 초과!`, {
                  body: `${m.name} 님이 [${statusName}] 상태로 자리를 비운 지 9분이 지났습니다.`,
                  icon: '/favicon.ico',
                });
              }
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
