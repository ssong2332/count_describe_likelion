import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Member } from '../../domain/types';
import { MemberPayload } from '../../services/room-service.interface';
import { Users, Clock, Phone, User } from 'lucide-react';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: MemberPayload) => Promise<void>;
  editingMember?: Member | null;
}

// 3번 요구사항: 사용자가 전달한 실제 시간표 내용으로 프리셋 교체
const PRESET_GROUPS = ['메인 운영진', '전우조1', '전우조2', '전원'];
const PRESET_SHIFTS = [
  '12:00 ~ 13:05',
  '13:00 ~ 14:05',
  '14:00 ~ 15:05',
  '15:00 ~ 16:05',
  '16:00 ~ 17:05',
  '17:30 ~ 18:00',
];

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingMember,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState('');
  const [shiftTime, setShiftTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name || '');
      setPhone(editingMember.phone || '');
      setGroup(editingMember.group || '');
      setShiftTime(editingMember.shiftTime || '');
    } else {
      setName('');
      setPhone('');
      setGroup('');
      setShiftTime('');
    }
    setError(null);
  }, [editingMember, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim() || undefined,
        group: group.trim() || undefined,
        shiftTime: shiftTime.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || '저장 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingMember ? '인원 정보 수정' : '새 인원 등록'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Name */}
        <div>
          <label style={{ fontSize: '13px', color: '#475569', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <User size={15} /> 이름 (필수)
          </label>
          <input
            type="text"
            placeholder="예: 홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              border: '2px solid #cbd5e1',
              borderRadius: '10px',
              color: '#0f172a',
              fontSize: '14px',
              fontWeight: 700,
              outline: 'none',
            }}
            required
          />
        </div>

        {/* Phone Number */}
        <div>
          <label style={{ fontSize: '13px', color: '#475569', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Phone size={15} /> 전화번호 (선택)
          </label>
          <input
            type="tel"
            placeholder="예: 010-1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              border: '2px solid #cbd5e1',
              borderRadius: '10px',
              color: '#0f172a',
              fontSize: '14px',
              fontWeight: 700,
              outline: 'none',
            }}
          />
        </div>

        {/* Squad / Group */}
        <div>
          <label style={{ fontSize: '13px', color: '#475569', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Users size={15} /> 전우조 (조 명칭)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
            {PRESET_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '16px',
                  backgroundColor: group === g ? '#eef2ff' : '#f8fafc',
                  color: group === g ? '#4f46e5' : '#475569',
                  border: `1.5px solid ${group === g ? '#4f46e5' : '#cbd5e1'}`,
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                {g}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="직접 입력 (예: 메인 운영진, 전우조1 등)"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              border: '2px solid #cbd5e1',
              borderRadius: '10px',
              color: '#0f172a',
              fontSize: '14px',
              fontWeight: 700,
              outline: 'none',
            }}
          />
        </div>

        {/* Booth Schedule Time */}
        <div>
          <label style={{ fontSize: '13px', color: '#475569', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Clock size={15} /> 부스 운영 시간대
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
            {PRESET_SHIFTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShiftTime(s)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '16px',
                  backgroundColor: shiftTime === s ? '#f0f9ff' : '#f8fafc',
                  color: shiftTime === s ? '#0284c7' : '#475569',
                  border: `1.5px solid ${shiftTime === s ? '#0284c7' : '#cbd5e1'}`,
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="직접 입력 (예: 12:00 ~ 13:05)"
            value={shiftTime}
            onChange={(e) => setShiftTime(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              border: '2px solid #cbd5e1',
              borderRadius: '10px',
              color: '#0f172a',
              fontSize: '14px',
              fontWeight: 700,
              outline: 'none',
            }}
          />
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: 800 }}>{error}</p>
        )}

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
            type="submit"
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontWeight: 900,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? '저장 중...' : editingMember ? '수정 완료' : '등록하기'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
