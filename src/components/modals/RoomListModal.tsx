import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { getRoomService } from '../../services/service-factory';
import { DoorOpen, Users, Clock, X, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { forgetRoom, getRoomHistory, RoomHistoryEntry } from '../../services/room-history';

/**
 * 이 기기가 접속했던 룸 목록.
 *
 * 보안 규칙이 전체 룸 열거(/rooms 조회)를 막으므로 서버 목록을 받아오지 않는다.
 * 기기에 남은 접속 기록으로 목록을 만들고, 각 룸의 인원수만 개별 조회로 채운다.
 * 룸의 영구 삭제도 규칙으로 금지되어 있어, 여기서는 이 기기의 목록에서만 제거한다.
 */
interface RoomRow extends RoomHistoryEntry {
  memberCount: number | null;
  missing: boolean;
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
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [forgettingRoomId, setForgettingRoomId] = useState<string | null>(null);

  const roomService = getRoomService();

  const loadRooms = async () => {
    setIsLoading(true);

    const history = getRoomHistory();
    setRooms(history.map((h) => ({ ...h, memberCount: null, missing: false })));

    const filled = await Promise.all(
      history.map(async (h): Promise<RoomRow> => {
        try {
          const room = await roomService.getRoom(h.roomId);
          if (!room) return { ...h, memberCount: null, missing: true };
          return { ...h, memberCount: Object.keys(room.members).length, missing: false };
        } catch (e) {
          console.error('[RoomListModal] 룸 조회 실패:', h.roomId, e);
          return { ...h, memberCount: null, missing: false };
        }
      })
    );

    setRooms(filled);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      void loadRooms();
    }
  }, [isOpen]);

  const handleForget = () => {
    if (!forgettingRoomId) return;
    forgetRoom(forgettingRoomId);
    setForgettingRoomId(null);
    void loadRooms();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="이 기기에서 접속한 룸">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
          이 기기로 접속했던 룸 목록입니다. 보안을 위해 전체 룸 목록은 조회하지 않습니다. 다른 기기에서
          만든 룸은 룸 코드를 직접 입력해 입장하세요.
        </p>

        {isLoading && rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
            룸 정보를 불러오는 중...
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
            이 기기에서 접속한 룸이 없습니다.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '340px',
              overflowY: 'auto',
            }}
          >
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
                      {r.missing && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#ef4444',
                          }}
                        >
                          삭제됨
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '2px',
                        fontSize: '12px',
                        color: '#64748b',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        {r.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                        {r.role === 'admin' ? '관리자' : '사용자'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Users size={12} /> 인원 {r.memberCount === null ? '—' : `${r.memberCount}명`}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={12} /> {new Date(r.visitedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!isCurrent && !r.missing && (
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
                      onClick={() => setForgettingRoomId(r.roomId)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#64748b',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                      title="이 기기의 목록에서 빼기"
                    >
                      <X size={13} />
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

      {/* 목록에서 빼기 확인 */}
      <Modal
        isOpen={!!forgettingRoomId}
        onClose={() => setForgettingRoomId(null)}
        title="목록에서 빼기"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b' }}>
            <AlertTriangle size={28} />
            <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#334155' }}>
              <strong>{forgettingRoomId}</strong> 을(를) 이 기기의 목록에서만 제거합니다. 룸과 인원
              데이터는 그대로 남아 있으며, 룸 코드를 입력하면 다시 들어갈 수 있습니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setForgettingRoomId(null)}
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
              onClick={handleForget}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#475569',
                color: '#ffffff',
                fontWeight: 900,
              }}
            >
              목록에서 빼기
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};
