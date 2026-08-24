import React from 'react';
import { Modal } from '../common/Modal';
import { DepartureType, Member } from '../../domain/types';
import { useTimer } from '../../hooks/use-timer';
import { parseShiftTimes } from '../../domain/shift-time';
import { Badge } from '../common/Badge';
import { Clock, Cigarette, HelpCircle, History, Edit2, Trash2, Users, Phone } from 'lucide-react';

interface MemberDetailModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onToggleAttendance: (memberId: string) => void;
  onSetDeparture: (memberId: string, type: DepartureType) => void;
  onOpenReasonModal: (member: Member) => void;
  onOpenLogDrawer: (member: Member) => void;
  onOpenEditModal: (member: Member) => void;
  onDeleteMember: (member: Member) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  member,
  onClose,
  onToggleAttendance,
  onSetDeparture,
  onOpenReasonModal,
  onOpenLogDrawer,
  onOpenEditModal,
  onDeleteMember,
}) => {
  if (!member) return null;

  const { formatted: timerFormatted } = useTimer(member.departureTime);

  const isToilet = member.activeStatus === 'toilet';
  const isSmoking = member.activeStatus === 'smoking';
  const isEtc = member.activeStatus === 'etc';
  const isAway = member.activeStatus !== 'none';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${member.name} 님 상세 관리`}
      isDrawer={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header Profile Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>
                {member.name}
              </span>
              <Badge
                type={member.isPresent ? (member.activeStatus !== 'none' ? member.activeStatus : 'present') : 'absent'}
                label={member.isPresent ? (member.activeStatus !== 'none' ? (member.activeStatus === 'toilet' ? '화장실' : member.activeStatus === 'smoking' ? '흡연' : member.activeReason || '기타') : '출석 완료') : '미출석'}
                active={isAway}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              {member.group && (
                <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Users size={13} /> {member.group}
                </span>
              )}
              {parseShiftTimes(member.shiftTime).map((slot, idx) => (
                <span
                  key={slot}
                  style={{
                    fontSize: '12px',
                    color: '#0284c7',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {idx === 0 && <Clock size={13} />}
                  {slot}
                </span>
              ))}
            </div>
          </div>

          {/* 전화번호 텍스트 표시 */}
          {member.phone && (
            <div
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                fontWeight: 800,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                alignSelf: 'flex-start',
              }}
            >
              <Phone size={13} color="#4f46e5" />
              <span style={{ whiteSpace: 'nowrap' }}>{member.phone}</span>
            </div>
          )}
        </div>

        {/* 1단계: 출석 / 결석 스위치 (10번 요구사항: 출석 상태일 때 결석 처리 버튼은 작게 표현) */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: member.isPresent ? '#ecfdf5' : '#f1f5f9',
            border: `2px solid ${member.isPresent ? '#a7f3d0' : '#cbd5e1'}`,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: member.isPresent ? '#059669' : '#475569' }}>
              {member.isPresent ? '✅ 출석 확인됨' : '❌ 미출석 상태'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
              {member.isPresent ? '자리비움 제어가 가능합니다.' : '출석 체크 후 자리비움 기능을 사용할 수 있습니다.'}
            </div>
          </div>

          {member.isPresent ? (
            /* 10번 요구사항: 출석 선택된 경우 결석 처리는 작고 덜 눈에 띄는 버튼 */
            <button
              type="button"
              onClick={() => onToggleAttendance(member.id)}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#64748b',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              결석으로 변경
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggleAttendance(member.id)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 900,
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              출석 체크
            </button>
          )}
        </div>

        {/* Active Timer Banner */}
        {isAway && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: isToilet ? '#f0f9ff' : isSmoking ? '#fffbeb' : '#faf5ff',
              border: `2px solid ${isToilet ? '#0284c7' : isSmoking ? '#d97706' : '#9333ea'}`,
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 800, color: isToilet ? '#0284c7' : isSmoking ? '#d97706' : '#9333ea' }}>
              {isToilet ? '🚻 화장실 이용 중' : isSmoking ? '🚬 흡연 중' : `🏃 기타 (${member.activeReason || ''})`}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
              ⏱️ {timerFormatted}
            </div>
          </div>
        )}

        {/* 2단계: 자리비움 3종 버튼 (미출석 시 비활성화) */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
            자리비움 원터치 제어
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {/* Toilet */}
            <button
              type="button"
              disabled={!member.isPresent}
              onClick={() => onSetDeparture(member.id, 'toilet')}
              style={{
                padding: '14px 8px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 800,
                backgroundColor: isToilet ? '#0284c7' : '#f0f9ff',
                color: isToilet ? '#ffffff' : '#0284c7',
                border: `2px solid ${isToilet ? '#0284c7' : '#bae6fd'}`,
                boxShadow: isToilet ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
                flexDirection: 'column',
                gap: '4px',
                opacity: member.isPresent ? 1 : 0.4,
              }}
            >
              <Clock size={18} />
              <span>{isToilet ? '복귀 (OFF)' : '화장실'}</span>
            </button>

            {/* Smoking */}
            <button
              type="button"
              disabled={!member.isPresent}
              onClick={() => onSetDeparture(member.id, 'smoking')}
              style={{
                padding: '14px 8px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 800,
                backgroundColor: isSmoking ? '#d97706' : '#fffbeb',
                color: isSmoking ? '#ffffff' : '#d97706',
                border: `2px solid ${isSmoking ? '#d97706' : '#fde68a'}`,
                boxShadow: isSmoking ? '0 4px 12px rgba(217, 119, 6, 0.3)' : 'none',
                flexDirection: 'column',
                gap: '4px',
                opacity: member.isPresent ? 1 : 0.4,
              }}
            >
              <Cigarette size={18} />
              <span>{isSmoking ? '복귀 (OFF)' : '흡연'}</span>
            </button>

            {/* Etc */}
            <button
              type="button"
              disabled={!member.isPresent}
              onClick={() => {
                if (isEtc) {
                  onSetDeparture(member.id, 'etc');
                } else {
                  onOpenReasonModal(member);
                }
              }}
              style={{
                padding: '14px 8px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 800,
                backgroundColor: isEtc ? '#9333ea' : '#faf5ff',
                color: isEtc ? '#ffffff' : '#9333ea',
                border: `2px solid ${isEtc ? '#9333ea' : '#e9d5ff'}`,
                boxShadow: isEtc ? '0 4px 12px rgba(147, 51, 234, 0.3)' : 'none',
                flexDirection: 'column',
                gap: '4px',
                opacity: member.isPresent ? 1 : 0.4,
              }}
            >
              <HelpCircle size={18} />
              <span>{isEtc ? '복귀 (OFF)' : '기타'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Tool Actions */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button"
            onClick={() => { onClose(); onOpenLogDrawer(member); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              color: '#334155',
              fontWeight: 800,
              fontSize: '13px',
            }}
          >
            <History size={15} /> 기록 보기 ({member.logs.length})
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onOpenEditModal(member); }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              color: '#334155',
              fontWeight: 800,
              fontSize: '13px',
            }}
          >
            <Edit2 size={15} /> 정보 수정
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onDeleteMember(member); }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#ef4444',
              fontWeight: 800,
              fontSize: '13px',
            }}
          >
            <Trash2 size={15} /> 삭제
          </button>
        </div>
      </div>
    </Modal>
  );
};
