import React from 'react';
import { SummaryStats } from '../../domain/member-logic';
import { Member, ViewSortMode } from '../../domain/types';
import { Users, CheckCircle2, UserX, Clock, Cigarette, HelpCircle, LayoutGrid, Calendar, ListFilter, ShieldCheck, Bell, AlertTriangle } from 'lucide-react';

interface SummaryHeaderProps {
  roomId: string;
  adminMembers: Member[];
  overdueMembers: Member[];
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => void;
  summary: SummaryStats;
  sortMode: ViewSortMode;
  onSetSortMode: (mode: ViewSortMode) => void;
  onOpenAddMember: () => void;
  onOpenBatchImport: () => void;
  onOpenRoomList: () => void;
  onOpenAdminManager: () => void;
  onLogout: () => void;
}

export const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  roomId,
  adminMembers,
  overdueMembers,
  notificationPermission,
  onRequestNotificationPermission,
  summary,
  sortMode,
  onSetSortMode,
  onOpenAddMember,
  onOpenBatchImport,
  onOpenRoomList,
  onOpenAdminManager,
  onLogout,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 0',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>
              {roomId}
            </h2>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                fontWeight: 800,
                border: '1px solid #c7d2fe',
              }}
            >
              관리자 모드
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            실시간 출결 & 9분 초과 알림 모니터링
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={onOpenRoomList}
            style={{
              padding: '8px 10px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              border: '1.5px solid #cbd5e1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
            title="룸 목록 관리"
          >
            <ListFilter size={13} /> 룸 목록
          </button>
          <button
            onClick={onOpenAddMember}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
            }}
          >
            + 인원 등록
          </button>
          <button
            onClick={onLogout}
            style={{
              padding: '8px 10px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            나가기
          </button>
        </div>
      </div>

      {/* 1번 요구사항: 룸 관리자 목록 바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={16} color="#4f46e5" /> 룸 관리자:
          </span>
          {adminMembers.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>미지정 (인원 중 선택 가능)</span>
          ) : (
            adminMembers.map((m) => (
              <span
                key={m.id}
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#4f46e5',
                  backgroundColor: '#eef2ff',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                👑 {m.name}
              </span>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAdminManager}
          style={{
            padding: '5px 10px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            color: '#334155',
            fontSize: '12px',
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          관리자 지정 변경
        </button>
      </div>

      {/* 3번 요구사항: 9분 초과 경고 실시간 배너 */}
      {overdueMembers.length > 0 && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            color: '#b91c1c',
            fontSize: '13px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
            animation: 'pulse 1.5s infinite',
          }}
        >
          <AlertTriangle size={20} color="#ef4444" />
          <div>
            <strong>🚨 9분 초과 자리비움 경고!</strong> {overdueMembers.map((m) => `${m.name} (${m.activeStatus === 'toilet' ? '화장실' : m.activeStatus === 'smoking' ? '흡연' : '기타'})`).join(', ')}
          </div>
        </div>
      )}

      {/* 알림 권한 요청 배너 */}
      {notificationPermission === 'default' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '10px',
            color: '#b45309',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bell size={14} /> 9분 초과 및 상태 전환 푸시 알림을 받으시겠습니까?
          </span>
          <button
            type="button"
            onClick={onRequestNotificationPermission}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: '#d97706',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
            }}
          >
            알림 켜기
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}
      >
        {/* Total & Attendance */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            padding: '10px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b', fontSize: '11px', fontWeight: 700 }}>
            <Users size={13} /> 총원
          </div>
          <div style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', marginTop: '1px' }}>
            {summary.total}명
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '2px solid #a7f3d0',
            padding: '10px',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#059669', fontSize: '11px', fontWeight: 800 }}>
            <CheckCircle2 size={13} /> 출석
          </div>
          <div style={{ fontSize: '19px', fontWeight: 900, color: '#059669', marginTop: '1px' }}>
            {summary.present}명
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '2px solid #e2e8f0',
            padding: '10px',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b', fontSize: '11px', fontWeight: 700 }}>
            <UserX size={13} /> 미출석
          </div>
          <div style={{ fontSize: '19px', fontWeight: 900, color: '#475569', marginTop: '1px' }}>
            {summary.absent}명
          </div>
        </div>

        {/* Departure Breakdowns */}
        <div
          style={{
            backgroundColor: '#f0f9ff',
            border: '2px solid #bae6fd',
            padding: '8px',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#0284c7', fontSize: '11px', fontWeight: 800 }}>
            <Clock size={12} /> 화장실
          </div>
          <div style={{ fontSize: '17px', fontWeight: 900, color: '#0284c7', marginTop: '1px' }}>
            {summary.toilet}명
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '2px solid #fde68a',
            padding: '8px',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#d97706', fontSize: '11px', fontWeight: 800 }}>
            <Cigarette size={12} /> 흡연
          </div>
          <div style={{ fontSize: '17px', fontWeight: 900, color: '#d97706', marginTop: '1px' }}>
            {summary.smoking}명
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#faf5ff',
            border: '2px solid #e9d5ff',
            padding: '8px',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#9333ea', fontSize: '11px', fontWeight: 800 }}>
            <HelpCircle size={12} /> 기타
          </div>
          <div style={{ fontSize: '17px', fontWeight: 900, color: '#9333ea', marginTop: '1px' }}>
            {summary.etc}명
          </div>
        </div>
      </div>

      {/* 일괄 등록 모달 버튼 */}
      {summary.total === 0 && (
        <button
          type="button"
          onClick={onOpenBatchImport}
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: '12px',
            backgroundColor: '#eef2ff',
            border: '2px dashed #4f46e5',
            color: '#4f46e5',
            fontSize: '13px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Calendar size={16} /> 📋 시간표/인원 표로 일괄 등록 및 검증하기
        </button>
      )}

      {/* Category Tabs (3종 뷰) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          backgroundColor: '#e2e8f0',
          padding: '3px',
          borderRadius: '12px',
          gap: '3px',
        }}
      >
        <button
          type="button"
          onClick={() => onSetSortMode('grid')}
          style={{
            padding: '8px 4px',
            fontSize: '12px',
            fontWeight: 800,
            borderRadius: '9px',
            backgroundColor: sortMode === 'grid' ? '#ffffff' : 'transparent',
            color: sortMode === 'grid' ? '#4f46e5' : '#475569',
            boxShadow: sortMode === 'grid' ? '0 1px 4px rgba(0, 0, 0, 0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <LayoutGrid size={14} />
          <span>색상 현황판</span>
        </button>
        <button
          type="button"
          onClick={() => onSetSortMode('schedule')}
          style={{
            padding: '8px 4px',
            fontSize: '12px',
            fontWeight: 800,
            borderRadius: '9px',
            backgroundColor: sortMode === 'schedule' ? '#ffffff' : 'transparent',
            color: sortMode === 'schedule' ? '#4f46e5' : '#475569',
            boxShadow: sortMode === 'schedule' ? '0 1px 4px rgba(0, 0, 0, 0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Clock size={14} />
          <span>시간대 & 전우조별</span>
        </button>
        <button
          type="button"
          onClick={() => onSetSortMode('default')}
          style={{
            padding: '8px 4px',
            fontSize: '12px',
            fontWeight: 800,
            borderRadius: '9px',
            backgroundColor: sortMode === 'default' ? '#ffffff' : 'transparent',
            color: sortMode === 'default' ? '#4f46e5' : '#475569',
            boxShadow: sortMode === 'default' ? '0 1px 4px rgba(0, 0, 0, 0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <CheckCircle2 size={14} />
          <span>상세 목록</span>
        </button>
      </div>
    </div>
  );
};
