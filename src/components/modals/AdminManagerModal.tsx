import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Member } from '../../domain/types';
import { ShieldCheck, CheckSquare, Square, Phone } from 'lucide-react';

interface AdminManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  adminMemberIds: string[];
  onSaveAdminMembers: (selectedIds: string[]) => Promise<void>;
}

export const AdminManagerModal: React.FC<AdminManagerModalProps> = ({
  isOpen,
  onClose,
  members,
  adminMemberIds,
  onSaveAdminMembers,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedIds(adminMemberIds || []);
  }, [adminMemberIds, isOpen]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSaveAdminMembers(selectedIds);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👑 룸 관리자 인원 지정">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          등록된 인원 중 관리자 역할을 수행할 인원을 선택하세요. 선택된 인원의 연락처가 사용자에게 관리자 번호로 제공되며, 사용자로 접속 시 관리자 PIN 인증이 요구됩니다.
        </p>

        {/* Member Selectable List */}
        <div
          style={{
            maxHeight: '260px',
            overflowY: 'auto',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {members.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              등록된 인원이 없습니다. 인원을 먼저 등록해주세요.
            </div>
          ) : (
            members.map((m) => {
              const isSelected = selectedIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggleSelect(m.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                    border: `1.5px solid ${isSelected ? '#4f46e5' : '#f1f5f9'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isSelected ? (
                      <CheckSquare size={18} color="#4f46e5" />
                    ) : (
                      <Square size={18} color="#cbd5e1" />
                    )}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                        {m.name} {isSelected && <span style={{ fontSize: '11px', color: '#4f46e5' }}>👑 관리자</span>}
                      </div>
                      {m.phone && (
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                          <Phone size={11} /> {m.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {m.group && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                      {m.group}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Count Notice */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={15} /> 선택된 관리자: {selectedIds.length}명
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
            onClick={handleSave}
            disabled={isSubmitting}
            style={{
              flex: 1.5,
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontWeight: 900,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? '저장 중...' : '관리자 지정 저장'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
