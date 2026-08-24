import React from 'react';
import { DepartureType, Member } from '../../domain/types';
import { useTimer } from '../../hooks/use-timer';
import { Badge } from '../common/Badge';
import { Clock, Cigarette, HelpCircle, History, Edit2, Trash2, CheckCircle2, Circle, Phone, Users } from 'lucide-react';

interface MemberCardProps {
  member: Member;
  onToggleAttendance: (memberId: string) => void;
  onSetDeparture: (memberId: string, type: DepartureType) => void;
  onOpenReasonModal: (member: Member) => void;
  onOpenLogDrawer: (member: Member) => void;
  onOpenEditModal: (member: Member) => void;
  onDeleteMember: (member: Member) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onToggleAttendance,
  onSetDeparture,
  onOpenReasonModal,
  onOpenLogDrawer,
  onOpenEditModal,
  onDeleteMember,
}) => {
  const { formatted: timerFormatted } = useTimer(member.departureTime);

  const getActiveClass = () => {
    if (member.activeStatus === 'toilet') return 'active-toilet';
    if (member.activeStatus === 'smoking') return 'active-smoking';
    if (member.activeStatus === 'etc') return 'active-etc';
    return '';
  };

  return (
    <div
      className={`glass-panel ${getActiveClass()}`}
      style={{
        padding: '16px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        opacity: member.isPresent ? 1 : 0.75,
        backgroundColor: '#ffffff',
        border: '1.5px solid #e2e8f0',
        transition: 'all 0.2s ease',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* Top Info Bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <button
            type="button"
            onClick={() => onToggleAttendance(member.id)}
            style={{
              background: 'transparent',
              padding: '2px 0 0 0',
              color: member.isPresent ? '#10b981' : '#94a3b8',
            }}
            title={member.isPresent ? '출석 중 (클릭 시 결석 전환)' : '결석 (클릭 시 출석 전환)'}
          >
            {member.isPresent ? <CheckCircle2 size={24} /> : <Circle size={24} />}
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {member.name}
              </span>
              <Badge
                type={member.isPresent ? (member.activeStatus !== 'none' ? member.activeStatus : 'present') : 'absent'}
                label={
                  !member.isPresent
                    ? '미출석'
                    : member.activeStatus === 'none'
                    ? '출석'
                    : member.activeStatus === 'toilet'
                    ? '화장실'
                    : member.activeStatus === 'smoking'
                    ? '흡연'
                    : member.activeReason || '기타'
                }
                active={member.activeStatus !== 'none'}
                size="sm"
              />
              {member.group && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    backgroundColor: '#eef2ff',
                    color: '#4f46e5',
                    border: '1px solid #c7d2fe',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <Users size={11} /> {member.group}
                </span>
              )}
            </div>

            {/* Sub Info (Shift Time & Phone) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              {member.shiftTime && (
                <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={12} /> 부스: {member.shiftTime}
                </span>
              )}
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  style={{
                    fontSize: '12px',
                    color: '#4f46e5',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    backgroundColor: '#f1f5f9',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                  title="전화 걸기"
                >
                  <Phone size={11} /> {member.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => onOpenLogDrawer(member)}
            style={{
              padding: '6px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
            }}
            title="기록 보기"
          >
            <History size={16} />
          </button>
          <button
            type="button"
            onClick={() => onOpenEditModal(member)}
            style={{
              padding: '6px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
            }}
            title="정보 수정"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDeleteMember(member)}
            style={{
              padding: '6px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#ef4444',
            }}
            title="인원 삭제"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Realtime Active Timer Banner if away */}
      {member.isPresent && member.activeStatus !== 'none' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '10px',
            backgroundColor:
              member.activeStatus === 'toilet'
                ? '#f0f9ff'
                : member.activeStatus === 'smoking'
                ? '#fffbeb'
                : '#faf5ff',
            border: `1px solid ${
              member.activeStatus === 'toilet'
                ? '#bae6fd'
                : member.activeStatus === 'smoking'
                ? '#fde68a'
                : '#e9d5ff'
            }`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
            <span style={{ fontSize: '15px' }}>
              {member.activeStatus === 'toilet' ? '🚻' : member.activeStatus === 'smoking' ? '🚬' : '🏃'}
            </span>
            <span
              style={{
                color:
                  member.activeStatus === 'toilet'
                    ? '#0284c7'
                    : member.activeStatus === 'smoking'
                    ? '#d97706'
                    : '#9333ea',
              }}
            >
              {member.activeStatus === 'toilet'
                ? '화장실 이용 중'
                : member.activeStatus === 'smoking'
                ? '흡연 중'
                : member.activeReason
                ? `기타 (${member.activeReason})`
                : '기타 자리비움'}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
            ⏱️ {timerFormatted}
          </div>
        </div>
      )}

      {/* 3 Away Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {/* Toilet Button */}
        <button
          type="button"
          disabled={!member.isPresent}
          onClick={() => onSetDeparture(member.id, 'toilet')}
          style={{
            padding: '10px 6px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            backgroundColor:
              member.activeStatus === 'toilet' ? '#0284c7' : '#f0f9ff',
            color: member.activeStatus === 'toilet' ? '#ffffff' : '#0284c7',
            border: `1px solid ${member.activeStatus === 'toilet' ? '#0284c7' : '#bae6fd'}`,
            boxShadow: member.activeStatus === 'toilet' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
            flexDirection: 'column',
            gap: '3px',
            minHeight: '48px',
          }}
        >
          <Clock size={15} />
          <span>{member.activeStatus === 'toilet' ? '복귀 (OFF)' : '화장실'}</span>
        </button>

        {/* Smoking Button */}
        <button
          type="button"
          disabled={!member.isPresent}
          onClick={() => onSetDeparture(member.id, 'smoking')}
          style={{
            padding: '10px 6px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            backgroundColor:
              member.activeStatus === 'smoking' ? '#d97706' : '#fffbeb',
            color: member.activeStatus === 'smoking' ? '#ffffff' : '#d97706',
            border: `1px solid ${member.activeStatus === 'smoking' ? '#d97706' : '#fde68a'}`,
            boxShadow: member.activeStatus === 'smoking' ? '0 2px 8px rgba(217, 119, 6, 0.3)' : 'none',
            flexDirection: 'column',
            gap: '3px',
            minHeight: '48px',
          }}
        >
          <Cigarette size={15} />
          <span>{member.activeStatus === 'smoking' ? '복귀 (OFF)' : '흡연'}</span>
        </button>

        {/* Etc Button */}
        <button
          type="button"
          disabled={!member.isPresent}
          onClick={() => {
            if (member.activeStatus === 'etc') {
              onSetDeparture(member.id, 'etc');
            } else {
              onOpenReasonModal(member);
            }
          }}
          style={{
            padding: '10px 6px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            backgroundColor:
              member.activeStatus === 'etc' ? '#9333ea' : '#faf5ff',
            color: member.activeStatus === 'etc' ? '#ffffff' : '#9333ea',
            border: `1px solid ${member.activeStatus === 'etc' ? '#9333ea' : '#e9d5ff'}`,
            boxShadow: member.activeStatus === 'etc' ? '0 2px 8px rgba(147, 51, 234, 0.3)' : 'none',
            flexDirection: 'column',
            gap: '3px',
            minHeight: '48px',
          }}
        >
          <HelpCircle size={15} />
          <span>{member.activeStatus === 'etc' ? '복귀 (OFF)' : '기타'}</span>
        </button>
      </div>
    </div>
  );
};
