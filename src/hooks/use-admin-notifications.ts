import { useEffect, useRef, useState, useCallback } from 'react';
import { Member } from '../domain/types';

// Web Audio API 경고음
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
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionStatus(perm);
        if (perm === 'granted') {
          playAlertBeep(587, 0.3);
          new Notification('🔔 알림 활성화 완료', {
            body: '자리비움 상태 전환 및 9분 초과 시 실시간 알림이 발송됩니다.',
            icon: '/favicon.ico',
          });
        } else if (perm === 'denied') {
          alert('브라우저 설정에서 알림 권한이 차단되어 있습니다. 주소창 좌측의 자물쇠/설정 아이콘을 눌러 알림을 [허용]으로 변경해주세요.');
        }
        return perm;
      } catch (e) {
        console.error('Request permission failed', e);
      }
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
