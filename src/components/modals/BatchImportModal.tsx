import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { parseScheduleTextToMembers, DEFAULT_SCHEDULE_TABLE_TEMPLATE } from '../../domain/member-logic';
import { Member } from '../../domain/types';
import { Table, CheckCircle2, RefreshCw } from 'lucide-react';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (members: Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[]) => Promise<void>;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
}) => {
  const [inputText, setInputText] = useState<string>(DEFAULT_SCHEDULE_TABLE_TEMPLATE);
  const [parsedMembers, setParsedMembers] = useState<Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[]>(() => {
    return parseScheduleTextToMembers(DEFAULT_SCHEDULE_TABLE_TEMPLATE);
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleParse = () => {
    const result = parseScheduleTextToMembers(inputText);
    setParsedMembers(result);
  };

  const handleConfirm = async () => {
    if (parsedMembers.length === 0) return;
    setIsSubmitting(true);
    try {
      await onConfirmImport(parsedMembers);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="표/시간표 텍스트로 인원 일괄 등록">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          시간표 또는 인원 표 텍스트를 붙여넣으시면 인원과 시간대, 전우조를 자동으로 분류합니다. 미리보기를 확인하신 후 등록하세요. (동명이인은 1명으로 자동 통합)
        </p>

        {/* Text Input Area */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>
              시간표 표 데이터 입력
            </label>
            <button
              type="button"
              onClick={handleParse}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                fontSize: '12px',
                fontWeight: 800,
                border: '1px solid #c7d2fe',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <RefreshCw size={12} /> 분류 및 검증
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              border: '2px solid #cbd5e1',
              borderRadius: '10px',
              color: '#0f172a',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              outline: 'none',
              resize: 'vertical',
            }}
            placeholder="시간표 표를 붙여넣으세요"
          />
        </div>

        {/* Verification Preview Table */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Table size={14} /> 자동 분류 및 검증 결과 ({parsedMembers.length}명)
          </div>

          {parsedMembers.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#ef4444', fontSize: '12px' }}>
              파싱된 인원이 없습니다. 상단 텍스트를 확인해주세요.
            </div>
          ) : (
            <div style={{ maxHeight: '190px', overflowY: 'auto', border: '2px solid #e2e8f0', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 10px', fontWeight: 800, color: '#475569' }}>이름</th>
                    <th style={{ padding: '6px 10px', fontWeight: 800, color: '#475569' }}>전우조</th>
                    <th style={{ padding: '6px 10px', fontWeight: 800, color: '#475569' }}>시간대</th>
                    <th style={{ padding: '6px 10px', fontWeight: 800, color: '#475569' }}>역할</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedMembers.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 800, color: '#0f172a' }}>{m.name}</td>
                      <td style={{ padding: '6px 10px', color: '#4f46e5', fontWeight: 700 }}>{m.group || '-'}</td>
                      <td style={{ padding: '6px 10px', color: '#0284c7', fontWeight: 700 }}>{m.shiftTime || '-'}</td>
                      <td style={{ padding: '6px 10px', color: '#64748b' }}>{m.roleNote || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              border: '1.5px solid #cbd5e1',
              color: '#475569',
              fontWeight: 800,
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={parsedMembers.length === 0 || isSubmitting}
            style={{
              flex: 1.5,
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              opacity: parsedMembers.length === 0 || isSubmitting ? 0.5 : 1,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{isSubmitting ? '등록 중...' : `위 ${parsedMembers.length}명 일괄 등록 확정`}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
