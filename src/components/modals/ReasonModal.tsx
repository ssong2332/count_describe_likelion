import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

interface ReasonModalProps {
  isOpen: boolean;
  memberName: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const PRESET_REASONS = ['통화', '미팅', '편의점', '식사', '개인 업무', '상담', '병원'];

export const ReasonModal: React.FC<ReasonModalProps> = ({
  isOpen,
  memberName,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reason.trim() || '기타');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${memberName} 님 자리비움 사유`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Preset Chips */}
        <div>
          <label style={{ fontSize: '13px', color: '#475569', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
            빠른 사유 선택
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PRESET_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  backgroundColor: reason === preset ? '#faf5ff' : '#f8fafc',
                  color: reason === preset ? '#9333ea' : '#475569',
                  border: `1.5px solid ${reason === preset ? '#9333ea' : '#e2e8f0'}`,
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div>
          <label style={{ fontSize: '13px', color: '#475569', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            직접 입력
          </label>
          <input
            type="text"
            placeholder="사유를 입력하세요 (선택)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              color: '#0f172a',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              fontWeight: 700,
            }}
          >
            취소
          </button>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: '#9333ea',
              color: '#ffffff',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(147, 51, 234, 0.25)',
            }}
          >
            타이머 시작
          </button>
        </div>
      </form>
    </Modal>
  );
};
