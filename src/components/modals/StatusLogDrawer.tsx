import React from 'react';
import { Modal } from '../common/Modal';
import { Member } from '../../domain/types';
import { calculateTotalDuration, formatDuration, formatTimeRange } from '../../domain/time-formatter';
import { Clock, Cigarette, HelpCircle, History } from 'lucide-react';

interface StatusLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

export const StatusLogDrawer: React.FC<StatusLogDrawerProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  if (!member) return null;

  const totalSeconds = calculateTotalDuration(member.logs);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'toilet':
        return <Clock size={16} color="#0284c7" />;
      case 'smoking':
        return <Cigarette size={16} color="#d97706" />;
      default:
        return <HelpCircle size={16} color="#9333ea" />;
    }
  };

  const getTypeName = (type: string, reason?: string) => {
    switch (type) {
      case 'toilet':
        return '화장실';
      case 'smoking':
        return '흡연';
      default:
        return reason ? `기타 (${reason})` : '기타';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${member.name} 님 자리비움 기록`}
      isDrawer={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Total Summary Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>오늘 총 자리비움 시간</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {formatDuration(totalSeconds)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>총 횟수</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#4f46e5', marginTop: '2px' }}>
              {member.logs.length}회
            </div>
          </div>
        </div>

        {/* Log Timeline List */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
            출입 상세 타임로그
          </div>

          {member.logs.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '14px',
              }}
            >
              <History size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>오늘 자리비움 기록이 없습니다.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {member.logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        backgroundColor:
                          log.type === 'toilet'
                            ? '#f0f9ff'
                            : log.type === 'smoking'
                            ? '#fffbeb'
                            : '#faf5ff',
                        display: 'flex',
                      }}
                    >
                      {getTypeIcon(log.type)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {getTypeName(log.type, log.reason)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {formatTimeRange(log.startAt, log.endAt)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#0f172a',
                      backgroundColor: '#f1f5f9',
                      padding: '4px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {formatDuration(log.durationSeconds || 0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
