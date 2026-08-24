import React from 'react';
import { Member } from '../../domain/types';
import { useTimer } from '../../hooks/use-timer';
import { Clock, Cigarette, HelpCircle } from 'lucide-react';

interface MemberGridTileProps {
  member: Member;
  onClick: (member: Member) => void;
}

export const MemberGridTile: React.FC<MemberGridTileProps> = ({ member, onClick }) => {
  const { formatted: timerFormatted } = useTimer(member.departureTime);

  const getTileStyle = () => {
    if (!member.isPresent) {
      return {
        bg: '#f8fafc',
        border: '2px solid #cbd5e1',
        text: '#475569',
        badgeBg: '#e2e8f0',
        badgeText: '#475569',
        statusLabel: '미출석',
      };
    }

    switch (member.activeStatus) {
      case 'toilet':
        return {
          bg: '#0284c7',
          border: '2px solid #0369a1',
          text: '#ffffff',
          badgeBg: 'rgba(255, 255, 255, 0.25)',
          badgeText: '#ffffff',
          statusLabel: '화장실',
          icon: <Clock size={12} />,
        };
      case 'smoking':
        return {
          bg: '#d97706',
          border: '2px solid #b45309',
          text: '#ffffff',
          badgeBg: 'rgba(255, 255, 255, 0.25)',
          badgeText: '#ffffff',
          statusLabel: '흡연',
          icon: <Cigarette size={12} />,
        };
      case 'etc':
        return {
          bg: '#9333ea',
          border: '2px solid #7e22ce',
          text: '#ffffff',
          badgeBg: 'rgba(255, 255, 255, 0.25)',
          badgeText: '#ffffff',
          statusLabel: member.activeReason ? `기타` : '기타',
          icon: <HelpCircle size={12} />,
        };
      default:
        // 출석 중 (자리 있음)
        return {
          bg: '#10b981',
          border: '2px solid #059669',
          text: '#ffffff',
          badgeBg: 'rgba(255, 255, 255, 0.25)',
          badgeText: '#ffffff',
          statusLabel: '출석',
        };
    }
  };

  const style = getTileStyle();
  const isAway = member.isPresent && member.activeStatus !== 'none';

  return (
    <div
      onClick={() => onClick(member)}
      style={{
        backgroundColor: style.bg,
        border: style.border,
        borderRadius: '12px',
        padding: '8px 6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        cursor: 'pointer',
        boxShadow: isAway ? '0 3px 10px rgba(0,0,0,0.15)' : '0 1px 4px rgba(15,23,42,0.06)',
        transition: 'all 0.15s ease',
        userSelect: 'none',
        minHeight: '58px',
        position: 'relative',
      }}
    >
      {/* Member Name (1번 요구사항: 이름만 큼직하게) */}
      <div
        style={{
          fontSize: '17px',
          fontWeight: 900,
          color: style.text,
          letterSpacing: '-0.3px',
          lineHeight: 1.2,
        }}
      >
        {member.name}
      </div>

      {/* Status Badge or Timer (컴팩트) */}
      {isAway ? (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 800,
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            padding: '1px 6px',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            marginTop: '3px',
          }}
        >
          {style.icon}
          <span>{timerFormatted}</span>
        </div>
      ) : (
        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            backgroundColor: style.badgeBg,
            color: style.badgeText,
            padding: '1px 5px',
            borderRadius: '4px',
            marginTop: '3px',
          }}
        >
          {style.statusLabel}
        </span>
      )}
    </div>
  );
};
