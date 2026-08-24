import React, { useState, useMemo } from 'react';
import { useRoomSync } from '../../hooks/use-room-sync';
import { useTimer } from '../../hooks/use-timer';
import { Badge } from '../common/Badge';
import { ReasonModal } from '../modals/ReasonModal';
import { StatusLogDrawer } from '../modals/StatusLogDrawer';
import { Clock, Cigarette, HelpCircle, History, LogOut, CheckCircle2, UserX, Users, AlertCircle, PhoneCall, Phone, ShieldCheck } from 'lucide-react';
import { DepartureType } from '../../domain/types';
import { parseShiftTimes } from '../../domain/shift-time';
import { Modal } from '../common/Modal';

interface UserControlPanelProps {
  roomId: string;
  memberId: string;
  onLogout: () => void;
}

export const UserControlPanel: React.FC<UserControlPanelProps> = ({
  roomId,
  memberId,
  onLogout,
}) => {
  const { room, rawMemberList, setDeparture, isLoading, error } = useRoomSync(roomId);
  const member = room?.members[memberId] || null;

  const { formatted: timerFormatted } = useTimer(member?.departureTime);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isAdminContactOpen, setIsAdminContactOpen] = useState(false);
  const [actionWarning, setActionWarning] = useState<string | null>(null);

  // 1번 요구사항: 룸에 등록된 모든 관리자(운영진) 목록
  const adminMembers = useMemo(() => {
    return rawMemberList.filter((m) => m.isAdmin);
  }, [rawMemberList]);

  const handleSafeSetDeparture = async (type: DepartureType, reason?: string) => {
    if (!member) return;
    setActionWarning(null);

    // 다른 상태로 이미 자리비움 중일 때 전환 시 알림 및 차단
    if (member.activeStatus !== 'none' && member.activeStatus !== type) {
      const currentName =
        member.activeStatus === 'toilet'
          ? '화장실'
          : member.activeStatus === 'smoking'
          ? '흡연'
          : '기타';
      setActionWarning(`현재 [${currentName}] 이용 중입니다. 먼저 [복귀 (OFF)] 처리를 해주세요.`);
      return;
    }

    try {
      await setDeparture(member.id, type, reason);
    } catch (err: any) {
      setActionWarning(err.message || '자리비움 상태 변경 실패');
    }
  };

  const handleReasonSubmit = (reason: string) => {
    handleSafeSetDeparture('etc', reason);
  };

  if (isLoading && !room) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #a7f3d0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '14px', color: '#475569', fontSize: '14px', fontWeight: 700 }}>내 상태 동기화 중...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="glass-panel" style={{ padding: '32px 20px', textAlign: 'center', marginTop: '40px', backgroundColor: '#ffffff', border: '2px solid #e2e8f0' }}>
        <UserX size={44} color="#ef4444" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>
          인원 정보를 찾을 수 없습니다
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
          관리자에 의해 정보가 변경되었거나 삭제되었습니다.
        </p>
        <button
          onClick={onLogout}
          style={{
            padding: '12px 20px',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            borderRadius: '10px',
            fontWeight: 800,
          }}
        >
          룸 접속 화면으로 이동
        </button>
      </div>
    );
  }

  const isToilet = member.activeStatus === 'toilet';
  const isSmoking = member.activeStatus === 'smoking';
  const isEtc = member.activeStatus === 'etc';
  const isAway = member.activeStatus !== 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', gap: '14px', paddingBottom: '30px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', padding: '4px 0' }}>
        <div style={{ minWidth: 0, flex: '1 1 200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>
              {member.name} 님
            </h2>
            <Badge
              type={member.isPresent ? 'present' : 'absent'}
              label={member.isPresent ? '출석 완료' : '미출석'}
              size="sm"
            />
            {member.isAdmin && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#eef2ff',
                  color: '#4f46e5',
                  border: '1px solid #c7d2fe',
                }}
              >
                👑 룸 관리자
              </span>
            )}
            {member.group && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Users size={12} /> {member.group}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
              룸: <strong style={{ color: '#4f46e5' }}>{roomId}</strong>
            </span>
            {/* 시간대는 슬롯마다 따로 칩으로 둔다 — 한 덩어리면 "12:00 ~" 중간에서 끊긴다 */}
            {parseShiftTimes(member.shiftTime).map((slot, idx) => (
              <span
                key={slot}
                style={{
                  fontSize: '12px',
                  color: '#0284c7',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  padding: '1px 7px',
                  borderRadius: '6px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                }}
              >
                {idx === 0 && <Clock size={11} />}
                {slot}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: 'auto' }}>
          {/* 1번 요구사항: 관리자 연락처 확인 버튼 */}
          <button
            type="button"
            onClick={() => setIsAdminContactOpen(true)}
            title="관리자 연락처 보기"
            style={{
              padding: '8px 10px',
              borderRadius: '10px',
              backgroundColor: '#eef2ff',
              border: '1.5px solid #c7d2fe',
              color: '#4f46e5',
              fontSize: '12px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <PhoneCall size={13} /> 연락처 {adminMembers.length > 0 && `(${adminMembers.length})`}
          </button>
          <button
            type="button"
            onClick={() => setIsLogDrawerOpen(true)}
            style={{
              padding: '8px 10px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #cbd5e1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 800,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <History size={14} /> 기록
          </button>
          <button
            onClick={onLogout}
            style={{
              padding: '8px 10px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: 700,
              flexShrink: 0,
              lineHeight: 0,
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {(error || actionWarning) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '2px solid #f87171',
            borderRadius: '10px',
            color: '#b91c1c',
            fontSize: '13px',
            fontWeight: 800,
          }}
        >
          <AlertCircle size={18} />
          <span>{error || actionWarning}</span>
        </div>
      )}

      {/* Current Active Status & Hero Card */}
      <div
        className={`glass-panel ${
          isToilet ? 'active-toilet' : isSmoking ? 'active-smoking' : isEtc ? 'active-etc' : ''
        }`}
        style={{
          padding: '24px 20px',
          borderRadius: '20px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: isAway
            ? `3px solid ${isToilet ? '#0284c7' : isSmoking ? '#d97706' : '#9333ea'}`
            : '2px solid #e2e8f0',
          boxShadow: isAway ? '0 6px 24px rgba(0,0,0,0.1)' : '0 2px 8px rgba(15,23,42,0.04)',
        }}
      >
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 800, marginBottom: '6px' }}>
          현재 나의 상태
        </div>

        <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>
          {isToilet ? (
            <span style={{ color: '#0284c7' }}>🚻 화장실 이용 중</span>
          ) : isSmoking ? (
            <span style={{ color: '#d97706' }}>🚬 흡연 중</span>
          ) : isEtc ? (
            <span style={{ color: '#9333ea' }}>🏃 {member.activeReason ? `기타 (${member.activeReason})` : '자리비움 중'}</span>
          ) : (
            <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={26} /> 자리 있음
            </span>
          )}
        </div>

        {isAway ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '28px',
              fontWeight: 900,
              color: '#0f172a',
              backgroundColor: '#f8fafc',
              border: '2px solid #cbd5e1',
              padding: '6px 20px',
              borderRadius: '14px',
              marginTop: '4px',
            }}
          >
            ⏱️ {timerFormatted}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
            자리를 비우실 때 아래 버튼을 터치해주세요.
          </p>
        )}
      </div>

      {/* 3 Huge Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Toilet Big Button */}
        <button
          type="button"
          onClick={() => handleSafeSetDeparture('toilet')}
          style={{
            width: '100%',
            padding: '18px 16px',
            borderRadius: '16px',
            fontSize: '17px',
            fontWeight: 900,
            backgroundColor: isToilet ? '#0284c7' : '#f0f9ff',
            color: isToilet ? '#ffffff' : '#0284c7',
            border: `2px solid ${isToilet ? '#0284c7' : '#bae6fd'}`,
            boxShadow: isToilet ? '0 4px 16px rgba(2, 132, 199, 0.35)' : 'none',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: isToilet ? 'rgba(255, 255, 255, 0.25)' : 'rgba(2, 132, 199, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={22} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div>화장실</div>
              <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: 700, marginTop: '1px' }}>
                {isToilet ? '터치하여 복귀 완료' : '나갈 때 클릭'}
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '13px',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: isToilet ? '#ffffff' : '#0284c7',
              color: isToilet ? '#0284c7' : '#ffffff',
              fontWeight: 900,
            }}
          >
            {isToilet ? '복귀 (OFF)' : '시작 (ON)'}
          </span>
        </button>

        {/* Smoking Big Button */}
        <button
          type="button"
          onClick={() => handleSafeSetDeparture('smoking')}
          style={{
            width: '100%',
            padding: '18px 16px',
            borderRadius: '16px',
            fontSize: '17px',
            fontWeight: 900,
            backgroundColor: isSmoking ? '#d97706' : '#fffbeb',
            color: isSmoking ? '#ffffff' : '#d97706',
            border: `2px solid ${isSmoking ? '#d97706' : '#fde68a'}`,
            boxShadow: isSmoking ? '0 4px 16px rgba(217, 119, 6, 0.35)' : 'none',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: isSmoking ? 'rgba(255, 255, 255, 0.25)' : 'rgba(217, 119, 6, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cigarette size={22} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div>흡연</div>
              <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: 700, marginTop: '1px' }}>
                {isSmoking ? '터치하여 복귀 완료' : '나갈 때 클릭'}
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '13px',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: isSmoking ? '#ffffff' : '#d97706',
              color: isSmoking ? '#d97706' : '#ffffff',
              fontWeight: 900,
            }}
          >
            {isSmoking ? '복귀 (OFF)' : '시작 (ON)'}
          </span>
        </button>

        {/* Etc Big Button */}
        <button
          type="button"
          onClick={() => {
            if (isEtc) {
              handleSafeSetDeparture('etc');
            } else {
              setIsReasonModalOpen(true);
            }
          }}
          style={{
            width: '100%',
            padding: '18px 16px',
            borderRadius: '16px',
            fontSize: '17px',
            fontWeight: 900,
            backgroundColor: isEtc ? '#9333ea' : '#faf5ff',
            color: isEtc ? '#ffffff' : '#9333ea',
            border: `2px solid ${isEtc ? '#9333ea' : '#e9d5ff'}`,
            boxShadow: isEtc ? '0 4px 16px rgba(147, 51, 234, 0.35)' : 'none',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: isEtc ? 'rgba(255, 255, 255, 0.25)' : 'rgba(147, 51, 234, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HelpCircle size={22} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div>기타 사유</div>
              <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: 700, marginTop: '1px' }}>
                {isEtc ? `사유: ${member.activeReason || '기타'}` : '통화, 미팅 등 사유 입력'}
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '13px',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: isEtc ? '#ffffff' : '#9333ea',
              color: isEtc ? '#9333ea' : '#ffffff',
              fontWeight: 900,
            }}
          >
            {isEtc ? '복귀 (OFF)' : '사유입력 (ON)'}
          </span>
        </button>
      </div>

      {/* 1번 요구사항: 관리자(운영진) 연락처 목록 모달 */}
      <Modal
        isOpen={isAdminContactOpen}
        onClose={() => setIsAdminContactOpen(false)}
        title="👑 관리자(운영진) 연락처 안내"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {adminMembers.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              현재 등록된 관리자 연락처가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {adminMembers.map((adm) => (
                <div
                  key={adm.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={16} color="#4f46e5" />
                      <span>{adm.name}</span>
                    </div>
                    {adm.roleNote && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                        {adm.roleNote}
                      </div>
                    )}
                  </div>

                  {adm.phone ? (
                    <a
                      href={`tel:${adm.phone}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#eef2ff',
                        border: '1px solid #c7d2fe',
                        color: '#4f46e5',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        fontWeight: 800,
                      }}
                    >
                      <Phone size={13} />
                      <span>{adm.phone}</span>
                    </a>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>전화번호 미등록</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsAdminContactOpen(false)}
            style={{
              marginTop: '6px',
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              border: '1.5px solid #cbd5e1',
              color: '#475569',
              fontWeight: 800,
            }}
          >
            닫기
          </button>
        </div>
      </Modal>

      {/* Reason Modal */}
      <ReasonModal
        isOpen={isReasonModalOpen}
        memberName={member.name}
        onClose={() => setIsReasonModalOpen(false)}
        onSubmit={handleReasonSubmit}
      />

      {/* Log Drawer */}
      <StatusLogDrawer
        isOpen={isLogDrawerOpen}
        member={member}
        onClose={() => setIsLogDrawerOpen(false)}
      />
    </div>
  );
};
