import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { getRoomService } from '../../services/service-factory';
import { DoorOpen, Trash2, Users, Clock, AlertTriangle } from 'lucide-react';

interface RoomInfo {
  roomId: string;
  memberCount: number;
  createdAt: number;
}

interface RoomListModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId?: string;
  onSelectRoom: (roomId: string) => void;
}

export const RoomListModal: React.FC<RoomListModalProps> = ({
  isOpen,
  onClose,
  currentRoomId,
  onSelectRoom,
}) => {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  const roomService = getRoomService();

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const list = await roomService.listRooms();
      setRooms(list);
    } catch (e) {
      console.error('Failed to list rooms', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRooms();
    }
  }, [isOpen]);

  const handleDeleteRoom = async () => {
    if (!deletingRoomId) return;
    try {
      await roomService.deleteRoom(deletingRoomId);
      setDeletingRoomId(null);
      await loadRooms();
    } catch (e) {
      console.error('Failed to delete room', e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="생성된 룸 목록 관리">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          현재 기기에서 생성된 룸 목록입니다. 클릭하여 바로 이동하거나 삭제할 수 있습니다.
        </p>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
            룸 목록을 불러오는 중...
          </div>
        ) : rooms.length === 0 ? (
          <div
            style={{
              padding: '28px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1.5px dashed #cbd5e1',
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            생성된 룸이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
            {rooms.map((r) => {
              const isCurrent = currentRoomId && r.roomId.toUpperCase() === currentRoomId.toUpperCase();
              return (
                <div
                  key={r.roomId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: isCurrent ? '#eef2ff' : '#ffffff',
                    border: `1.5px solid ${isCurrent ? '#4f46e5' : '#e2e8f0'}`,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                        {r.roomId}
                      </span>
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#4f46e5',
                            color: '#ffffff',
                          }}
                        >
                          현재 룸
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '12px', color: '#64748b' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Users size={12} /> 인원 {r.memberCount}명
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={12} /> {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRoom(r.roomId);
                          onClose();
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#4f46e5',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <DoorOpen size={13} /> 입장
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeletingRoomId(r.roomId)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                      title="룸 삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              border: '1.5px solid #cbd5e1',
              color: '#475569',
              fontWeight: 800,
            }}
          >
            닫기
          </button>
        </div>
      </div>

      {/* Room Delete Confirm Sub-modal */}
      <Modal
        isOpen={!!deletingRoomId}
        onClose={() => setDeletingRoomId(null)}
        title="룸 삭제 확인"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
            <AlertTriangle size={28} />
            <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#334155' }}>
              <strong>{deletingRoomId}</strong> 룸과 소속된 모든 인원 및 기록이 영구히 삭제됩니다. 계속하시겠습니까?
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setDeletingRoomId(null)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontWeight: 800,
              }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDeleteRoom}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontWeight: 900,
              }}
            >
              룸 삭제
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};
