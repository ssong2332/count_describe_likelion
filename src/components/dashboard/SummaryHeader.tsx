import React, { useState } from 'react';
import { SummaryStats } from '../../domain/member-logic';
import { DepartureType, Member, ViewSortMode } from '../../domain/types';
import { Users, CheckCircle2, UserX, Clock, Cigarette, HelpCircle, LayoutGrid, Calendar, ListFilter, Settings } from 'lucide-react';
import { Modal } from '../common/Modal';

interface SummaryHeaderProps {
  roomId: string;
  adminName?: string;
  adminPhone?: string;
  adminMember?: Member | null;
  summary: SummaryStats;
  sortMode: ViewSortMode;
  onSetSortMode: (mode: ViewSortMode) => void;
  onOpenAddMember: () => void;
  onOpenBatchImport: () => void;
  onOpenRoomList: () => void;
  onUpdateAdminProfile: (name: string, phone?: string) => Promise<void>;
  onAdminSetDeparture: (type: DepartureType, reason?: string) => void;
  onAdminToggleAttendance: () => void;
  onLogout: () => void;
}

export const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  roomId,
  adminName,
  adminPhone,
  adminMember,
  summary,
  sortMode,
  onSetSortMode,
  onOpenAddMember,
  onOpenBatchImport,
  onOpenRoomList,
  onUpdateAdminProfile,
  onAdminSetDeparture,
  onAdminToggleAttendance,
  onLogout,
}) => {
  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(adminName || '');
  const [profilePhone, setProfilePhone] = useState(adminPhone || '');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    await onUpdateAdminProfile(profileName.trim(), profilePhone.trim());
    setIsAdminProfileOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
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

      {/* 9번 요구사항: 관리자 본인 상태 제어 바 */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
            👑 내 상태 ({adminName || '관리자'})
          </span>
          <button
            type="button"
            onClick={() => setIsAdminProfileOpen(true)}
            style={{ color: '#64748b', padding: '2px' }}
            title="관리자 프로필 및 전화번호 설정"
          >
            <Settings size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {adminMember ? (
            <>
              <button
                type="button"
                onClick={onAdminToggleAttendance}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: adminMember.isPresent ? '#ecfdf5' : '#f1f5f9',
                  color: adminMember.isPresent ? '#059669' : '#64748b',
                  border: `1px solid ${adminMember.isPresent ? '#a7f3d0' : '#cbd5e1'}`,
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                {adminMember.isPresent ? '출석됨' : '미출석'}
              </button>
              {adminMember.isPresent && (
                <>
                  <button
                    type="button"
                    onClick={() => onAdminSetDeparture('toilet')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: adminMember.activeStatus === 'toilet' ? '#0284c7' : '#f0f9ff',
                      color: adminMember.activeStatus === 'toilet' ? '#ffffff' : '#0284c7',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    {adminMember.activeStatus === 'toilet' ? '화장실(OFF)' : '화장실'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdminSetDeparture('smoking')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: adminMember.activeStatus === 'smoking' ? '#d97706' : '#fffbeb',
                      color: adminMember.activeStatus === 'smoking' ? '#ffffff' : '#d97706',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    {adminMember.activeStatus === 'smoking' ? '흡연(OFF)' : '흡연'}
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdminProfileOpen(true)}
              style={{
                fontSize: '11px',
                color: '#4f46e5',
                fontWeight: 700,
                backgroundColor: '#eef2ff',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              + 관리자 이름/연락처 등록
            </button>
          )}
        </div>
      </div>

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

      {/* 4번 요구사항: 일괄 등록 모달 버튼 */}
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

      {/* Admin Profile Modal */}
      <Modal
        isOpen={isAdminProfileOpen}
        onClose={() => setIsAdminProfileOpen(false)}
        title="관리자 본인 정보 설정"
      >
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>
              관리자 본인 이름
            </label>
            <input
              type="text"
              placeholder="예: 관리자A"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
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

          <div>
            <label style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>
              관리자 전화번호 (사용자에게 공개)
            </label>
            <input
              type="tel"
              placeholder="예: 010-1234-5678"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
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

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setIsAdminProfileOpen(false)}
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
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontWeight: 900,
              }}
            >
              저장하기
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
