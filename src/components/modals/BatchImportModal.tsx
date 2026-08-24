import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { parseScheduleTextToMembers, DEFAULT_SCHEDULE_TABLE_TEMPLATE } from '../../domain/member-logic';
import { Member } from '../../domain/types';
import { RefreshCw, CheckCircle2, FileText, AlertCircle, Sparkles } from 'lucide-react';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (members: Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[]) => Promise<void>;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  // 2번 요구사항: 기본 목업 데이터 제거 (빈 문자열로 시작)
  const [rawText, setRawText] = useState<string>('');
  const [parsedMembers, setParsedMembers] = useState<Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = (textToParse: string = rawText) => {
    if (!textToParse.trim()) {
      setParsedMembers([]);
      setError(null);
      return;
    }
    try {
      const members = parseScheduleTextToMembers(textToParse);
      setParsedMembers(members);
      setError(null);
    } catch (e: any) {
      setError(e.message || '파싱 중 오류가 발생했습니다.');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    handleParse(val);
  };

  const handleLoadSample = () => {
    setRawText(DEFAULT_SCHEDULE_TABLE_TEMPLATE);
    handleParse(DEFAULT_SCHEDULE_TABLE_TEMPLATE);
  };

  const handleSubmit = async () => {
    if (parsedMembers.length === 0) {
      setError('등록할 인원 데이터가 없습니다. 표를 먼저 붙여넣어주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onImport(parsedMembers);
      onClose();
    } catch (err: any) {
      setError(err.message || '일괄 등록 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="표/시간표 텍스트로 인원 일괄 등록">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          스프레드시트나 표 텍스트를 복사하여 아래에 붙여넣으시면 인원, 시간대, 전우조가 자동으로 분류됩니다. (동명이인은 1명으로 자동 통합)
        </p>

        {/* Input Area Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={15} /> 시간표 표 데이터 붙여넣기
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handleLoadSample}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '11px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Sparkles size={12} color="#4f46e5" /> 예시 서식 채우기
            </button>
            <button
              type="button"
              onClick={() => handleParse(rawText)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#eef2ff',
                border: '1px solid #c7d2fe',
                color: '#4f46e5',
                fontSize: '11px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <RefreshCw size={12} /> 다시 분류
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          rows={5}
          value={rawText}
          onChange={handleTextChange}
          placeholder="엑셀이나 표에서 복사한 내용을 여기에 붙여넣으세요...&#10;&#10;예시)&#10;시간대	메인 운영진	아기사자	전우조1	전우조2&#10;12시 ~ 1시(+5분)	A	a,b,c,d	a,b	c,d"
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#f8fafc',
            border: '2px solid #cbd5e1',
            borderRadius: '10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: '1.4',
            outline: 'none',
            resize: 'vertical',
          }}
        />

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '13px', fontWeight: 800 }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Parsed Result Preview */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>자동 분류 및 검증 결과 ({parsedMembers.length}명)</span>
          </div>

          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
            }}
          >
            {parsedMembers.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                표 데이터를 붙여넣으시면 자동으로 인원 목록이 미리보기에 나타납니다.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '8px 10px', fontWeight: 800 }}>이름</th>
                    <th style={{ padding: '8px 10px', fontWeight: 800 }}>전우조</th>
                    <th style={{ padding: '8px 10px', fontWeight: 800 }}>시간대</th>
                    <th style={{ padding: '8px 10px', fontWeight: 800 }}>관리자</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedMembers.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 800, color: '#0f172a' }}>{m.name}</td>
                      <td style={{ padding: '7px 10px', color: '#4f46e5', fontWeight: 700 }}>{m.group || '-'}</td>
                      <td style={{ padding: '7px 10px', color: '#0284c7', fontWeight: 700 }}>{m.shiftTime || '-'}</td>
                      <td style={{ padding: '7px 10px', color: '#64748b' }}>{m.isAdmin ? '👑 관리자' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
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
            onClick={handleSubmit}
            disabled={parsedMembers.length === 0 || isSubmitting}
            style={{
              flex: 1.5,
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontWeight: 900,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
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
