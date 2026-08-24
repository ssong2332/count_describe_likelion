import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Member } from '../../domain/types';
import { Trash2, CheckSquare, Square, AlertTriangle } from 'lucide-react';

interface MemberBatchDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onDeleteMembers: (memberIds: string[]) => Promise<void>;
  onDeleteAllMembers: () => Promise<void>;
}

export const MemberBatchDeleteModal: React.FC<MemberBatchDeleteModalProps> = ({
  isOpen,
  onClose,
  members,
  onDeleteMembers,
  onDeleteAllMembers,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmAll, setIsConfirmAll] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
    setIsConfirmAll(false);
  }, [isOpen]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map((m) => m.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.length}명의 인원을 삭제하시겠습니까?`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onDeleteMembers(selectedIds);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsSubmitting(true);
    try {
      await onDeleteAllMembers();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="인원 선택 및 일괄 삭제">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            삭제할 인원을 선택하거나 전체 삭제를 실행할 수 있습니다.
          </span>
          {members.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              {selectedIds.length === members.length ? '선택 해제' : '전체 선택'}
            </button>
          )}
        </div>

        {/* Member Selectable List */}
        <div
          style={{
            maxHeight: '250px',
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
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              등록된 인원이 없습니다.
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
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#fef2f2' : '#ffffff',
                    border: `1.5px solid ${isSelected ? '#fca5a5' : '#f1f5f9'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSelected ? (
                      <CheckSquare size={17} color="#ef4444" />
                    ) : (
                      <Square size={17} color="#cbd5e1" />
                    )}
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                      {m.name} {m.isAdmin && <span style={{ fontSize: '11px', color: '#4f46e5' }}>👑</span>}
                    </span>
                  </div>
                  {m.group && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                      {m.group}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Delete Action Buttons */}
        {!isConfirmAll ? (
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0 || isSubmitting}
              style={{
                flex: 1.5,
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontWeight: 900,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                opacity: selectedIds.length === 0 || isSubmitting ? 0.5 : 1,
              }}
            >
              <Trash2 size={16} />
              <span>{isSubmitting ? '삭제 중...' : `선택한 ${selectedIds.length}명 삭제`}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmAll(true)}
              disabled={members.length === 0 || isSubmitting}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                border: '1.5px solid #fca5a5',
                color: '#b91c1c',
                fontWeight: 800,
                fontSize: '12px',
                whiteSpace: 'nowrap',
              }}
            >
              🚨 전체 인원 삭제
            </button>
          </div>
        ) : (
          /* 전체 삭제 재확인 경고 */
          <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontSize: '13px', fontWeight: 800 }}>
              <AlertTriangle size={20} />
              <span>등록된 모든 인원({members.length}명)과 출결 기록이 영구 삭제됩니다. 계속할까요?</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsConfirmAll(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  color: '#475569',
                  fontWeight: 800,
                  fontSize: '12px',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '12px',
                }}
              >
                {isSubmitting ? '삭제 중...' : '전체 삭제 확정'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
