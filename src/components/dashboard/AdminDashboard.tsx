import React, { useState, useMemo } from 'react';
import { useRoomSync } from '../../hooks/use-room-sync';
import { useAdminNotifications } from '../../hooks/use-admin-notifications';
import { SummaryHeader } from './SummaryHeader';
import { MemberCard } from './MemberCard';
import { MemberGridTile } from './MemberGridTile';
import { MemberDetailModal } from './MemberDetailModal';
import { MemberFormModal } from '../modals/MemberFormModal';
import { BatchImportModal } from '../modals/BatchImportModal';
import { AdminManagerModal } from '../modals/AdminManagerModal';
import { MemberBatchDeleteModal } from '../modals/MemberBatchDeleteModal';
import { ReasonModal } from '../modals/ReasonModal';
import { StatusLogDrawer } from '../modals/StatusLogDrawer';
import { RoomListModal } from '../modals/RoomListModal';
import { DepartureType, Member } from '../../domain/types';
import { RotateCcw, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Modal } from '../common/Modal';
import { MemberPayload } from '../../services/room-service.interface';

interface AdminDashboardProps {
  roomId: string;
  onLogout: () => void;
  onSwitchRoom?: (newRoomId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ roomId, onLogout, onSwitchRoom }) => {
  const {
    room,
    memberList,
    rawMemberList,
    scheduleBlocks,
    summary,
    isLoading,
    error,
    clearError,
    sortMode,
    setSortMode,
    addMember,
    importScheduleMembers,
    setAdminMembers,
    updateMember,
    deleteMember,
    deleteMembers,
    deleteAllMembers,
    toggleAttendance,
    setDeparture,
    resetDaily,
  } = useRoomSync(roomId);

  // 3번 요구사항: 9분 초과 알림 & 비프음 & 시각 배너
  const { overdueMembers, permissionStatus, requestPermission } = useAdminNotifications(rawMemberList, true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isAdminManagerOpen, setIsAdminManagerOpen] = useState(false);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isRoomListOpen, setIsRoomListOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [reasonTargetMember, setReasonTargetMember] = useState<Member | null>(null);
  const [logDrawerMember, setLogDrawerMember] = useState<Member | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 1번 요구사항: 등록된 인원 중 관리자로 지정된 인원들
  const adminMembers = useMemo(() => {
    return rawMemberList.filter((m) => m.isAdmin);
  }, [rawMemberList]);

  // Handlers
  const handleAddMember = async (payload: MemberPayload) => {
    await addMember(payload);
  };

  const handleEditMember = async (payload: MemberPayload) => {
    if (editingMember) {
      await updateMember(editingMember.id, payload);
    }
  };

  const handleDeleteMemberExecute = async () => {
    if (deletingMember) {
      const id = deletingMember.id;
      setDeletingMember(null);
      setDetailMember(null);
      await deleteMember(id);
    }
  };

  const handleSetDepartureSafe = async (memberId: string, type: DepartureType, reason?: string) => {
    setActionError(null);
    try {
      await setDeparture(memberId, type, reason);
    } catch (err: any) {
      setActionError(err.message || '자리비움 처리 실패');
    }
  };

  const handleReasonSubmit = (reason: string) => {
    if (reasonTargetMember) {
      handleSetDepartureSafe(reasonTargetMember.id, 'etc', reason);
    }
  };

  const handleResetExecute = async () => {
    await resetDaily();
    setIsResetConfirmOpen(false);
  };

  const handleSaveAdminMembers = async (selectedIds: string[]) => {
    await setAdminMembers(selectedIds);
  };

  // 실시간 갱신된 detailMember 동기화
  const activeDetailMember = detailMember
    ? (room?.members[detailMember.id] || null)
    : null;

  if (isLoading && !room) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #c7d2fe', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '14px', color: '#475569', fontSize: '14px', fontWeight: 700 }}>현황판 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', paddingBottom: '40px' }}>
      {/* Header & Stats Summary */}
      <SummaryHeader
        roomId={roomId}
        adminMembers={adminMembers}
        overdueMembers={overdueMembers}
        notificationPermission={permissionStatus}
        onRequestNotificationPermission={requestPermission}
        summary={summary}
        sortMode={sortMode}
        onSetSortMode={setSortMode}
        onOpenAddMember={() => setIsAddModalOpen(true)}
        onOpenBatchImport={() => setIsBatchImportOpen(true)}
        onOpenBatchDelete={() => setIsBatchDeleteOpen(true)}
        onOpenRoomList={() => setIsRoomListOpen(true)}
        onOpenAdminManager={() => setIsAdminManagerOpen(true)}
        onLogout={onLogout}
      />

      {(error || actionError) && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '2px solid #f87171',
            borderRadius: '10px',
            color: '#b91c1c',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {error || actionError}</span>
          <button
            type="button"
            onClick={() => { clearError(); setActionError(null); }}
            style={{ color: '#b91c1c', fontWeight: 800, fontSize: '12px' }}
          >
            닫기
          </button>
        </div>
      )}

      {/* Main Content Area based on sortMode */}
      {rawMemberList.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '44px 20px',
            textAlign: 'center',
            borderRadius: '20px',
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            marginTop: '8px',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>👥</div>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>
            등록된 인원이 없습니다
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            표 형태로 시간표를 붙여넣어 검증 후 일괄 등록하거나, 직접 인원을 등록할 수 있습니다.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '320px', margin: '0 auto' }}>
            <button
              onClick={() => setIsBatchImportOpen(true)}
              style={{
                padding: '13px 18px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '14px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Calendar size={16} /> 📋 시간표 표로 일괄 등록 및 검증
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                padding: '11px 18px',
                backgroundColor: '#f1f5f9',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '13px',
              }}
            >
              + 직접 인원 등록하기
            </button>
          </div>
        </div>
      ) : sortMode === 'grid' ? (
        /* 색상 현황판 4열 고정 */
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🎨 전체 인원 현황판 ({rawMemberList.length}명)</span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>클릭 시 상세 관리</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
            }}
          >
            {rawMemberList.map((member) => (
              <MemberGridTile
                key={member.id}
                member={member}
                onClick={(m) => setDetailMember(m)}
              />
            ))}
          </div>
        </div>
      ) : sortMode === 'schedule' ? (
        /* 시간대 & 전우조별 가로 인라인 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {scheduleBlocks.map((block) => (
            <div
              key={block.shiftTime}
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '14px',
                padding: '12px 14px',
                boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
              }}
            >
              {/* Shift Time Header */}
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                }}
              >
                <Clock size={15} />
                <span>⏰ {block.shiftTime}</span>
              </div>

              {/* 가로 인라인 배치 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start' }}>
                {block.squads.map((squad) => (
                  <div
                    key={squad.squadName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '4px 8px',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#4f46e5', whiteSpace: 'nowrap' }}>
                      {squad.squadName}:
                    </span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {squad.members.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setDetailMember(m)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: !m.isPresent ? '#e2e8f0' : m.activeStatus === 'toilet' ? '#0284c7' : m.activeStatus === 'smoking' ? '#d97706' : m.activeStatus === 'etc' ? '#9333ea' : '#10b981',
                            color: !m.isPresent ? '#475569' : '#ffffff',
                            fontSize: '12px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 상세 목록 뷰 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {memberList.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onToggleAttendance={(id) => toggleAttendance(id)}
              onSetDeparture={(id, type: DepartureType) => handleSetDepartureSafe(id, type)}
              onOpenReasonModal={(m) => setReasonTargetMember(m)}
              onOpenLogDrawer={(m) => setLogDrawerMember(m)}
              onOpenEditModal={(m) => setEditingMember(m)}
              onDeleteMember={(m) => setDeletingMember(m)}
            />
          ))}
        </div>
      )}

      {/* Bottom Reset Button */}
      {rawMemberList.length > 0 && (
        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              color: '#ef4444',
              border: '1.5px solid #fecaca',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            <RotateCcw size={13} /> 오늘 전체 출결/기록 초기화
          </button>
        </div>
      )}

      {/* Modals */}
      <MemberDetailModal
        isOpen={!!activeDetailMember}
        member={activeDetailMember}
        onClose={() => setDetailMember(null)}
        onToggleAttendance={(id) => toggleAttendance(id)}
        onSetDeparture={(id, type) => handleSetDepartureSafe(id, type)}
        onOpenReasonModal={(m) => setReasonTargetMember(m)}
        onOpenLogDrawer={(m) => setLogDrawerMember(m)}
        onOpenEditModal={(m) => setEditingMember(m)}
        onDeleteMember={(m) => setDeletingMember(m)}
      />

      <MemberFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMember}
      />

      <BatchImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        onConfirmImport={async (imported) => {
          await importScheduleMembers(imported);
        }}
      />

      {/* 1번 요구사항: 복수 관리자 선택 지정 모달 */}
      <AdminManagerModal
        isOpen={isAdminManagerOpen}
        onClose={() => setIsAdminManagerOpen(false)}
        members={rawMemberList}
        adminMemberIds={room?.adminMemberIds || []}
        onSaveAdminMembers={handleSaveAdminMembers}
      />

      {/* 2번 요구사항: 인원 선택 및 전체 삭제 모달 */}
      <MemberBatchDeleteModal
        isOpen={isBatchDeleteOpen}
        onClose={() => setIsBatchDeleteOpen(false)}
        members={rawMemberList}
        onDeleteMembers={async (ids) => {
          await deleteMembers(ids);
        }}
        onDeleteAllMembers={async () => {
          await deleteAllMembers();
        }}
      />

      <MemberFormModal
        isOpen={!!editingMember}
        editingMember={editingMember}
        onClose={() => setEditingMember(null)}
        onSubmit={handleEditMember}
      />

      <ReasonModal
        isOpen={!!reasonTargetMember}
        memberName={reasonTargetMember?.name || ''}
        onClose={() => setReasonTargetMember(null)}
        onSubmit={handleReasonSubmit}
      />

      <StatusLogDrawer
        isOpen={!!logDrawerMember}
        member={logDrawerMember ? (room?.members[logDrawerMember.id] || null) : null}
        onClose={() => setLogDrawerMember(null)}
      />

      {/* 룸 목록 모달 */}
      <RoomListModal
        isOpen={isRoomListOpen}
        onClose={() => setIsRoomListOpen(false)}
        currentRoomId={roomId}
        onSelectRoom={(newId) => {
          if (onSwitchRoom) {
            onSwitchRoom(newId);
          }
        }}
      />

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        title="인원 삭제 확인"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
            <AlertTriangle size={32} />
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#334155' }}>
              <strong>{deletingMember?.name}</strong> 님을 목록에서 삭제하시겠습니까? 관련 출결 및 자리비움 기록도 함께 삭제됩니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setDeletingMember(null)}
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
              onClick={handleDeleteMemberExecute}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontWeight: 900,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              }}
            >
              삭제 실행
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirm Modal */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="당일 데이터 초기화"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
            <AlertTriangle size={32} />
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#334155' }}>
              모든 인원의 출결 상태 및 당일 자리비움 기록이 리셋됩니다. 계속하시겠습니까?
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(false)}
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
              onClick={handleResetExecute}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontWeight: 900,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              }}
            >
              초기화 실행
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
