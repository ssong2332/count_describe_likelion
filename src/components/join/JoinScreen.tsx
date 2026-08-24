import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Users, PlusCircle, LogIn, Key, Sparkles, AlertCircle, CheckCircle2, UserCheck, History } from 'lucide-react';
import { getRoomService, getCurrentServiceMode } from '../../services/service-factory';
import { Room } from '../../domain/types';

interface JoinScreenProps {
  onJoinSuccess: (session: { role: 'admin' | 'user'; roomId: string; memberId?: string; memberName?: string }) => void;
}

const LAST_LOGIN_RECORD_KEY = 'count_status_last_login_record';

interface LastLoginRecord {
  role: 'admin' | 'user';
  roomId: string;
  memberId?: string;
  memberName?: string;
  updatedAt: number;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({ onJoinSuccess }) => {
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [role, setRole] = useState<'admin' | 'user'>('admin');
  const [roomId, setRoomId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  
  // Create Room state
  const [newRoomId, setNewRoomId] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');

  // User Mode Member Fetch
  const [fetchedRoom, setFetchedRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 최근 로그인 기록
  const [lastRecord, setLastRecord] = useState<LastLoginRecord | null>(null);

  const roomService = getRoomService();
  const serviceMode = getCurrentServiceMode();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_LOGIN_RECORD_KEY);
      if (saved) {
        setLastRecord(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load last login record', e);
    }
  }, []);

  const saveLastRecord = (record: LastLoginRecord) => {
    try {
      localStorage.setItem(LAST_LOGIN_RECORD_KEY, JSON.stringify(record));
      setLastRecord(record);
    } catch (e) {
      console.error('Failed to save last login record', e);
    }
  };

  // 룸 정보 조회 (사용자 모드에서 인원 목록 로드 시)
  const handleCheckRoom = async () => {
    if (!roomId.trim()) {
      setErrorMsg('룸 코드를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const room = await roomService.getRoom(roomId.trim().toUpperCase());
      if (!room) {
        setErrorMsg('존재하지 않는 룸 코드입니다. 룸을 먼저 생성해주세요.');
        setFetchedRoom(null);
      } else {
        setFetchedRoom(room);
        const memberIds = Object.keys(room.members);
        if (memberIds.length > 0) {
          setSelectedMemberId(memberIds[0]);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || '룸 조회 실패');
    } finally {
      setIsLoading(false);
    }
  };

  // 입장 처리
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      setErrorMsg('룸 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const cleanRoomId = roomId.trim().toUpperCase();

    try {
      const room = await roomService.getRoom(cleanRoomId);
      if (!room) {
        setErrorMsg('존재하지 않는 룸 코드입니다.');
        setIsLoading(false);
        return;
      }

      if (role === 'admin') {
        const isPinValid = await roomService.verifyPin(cleanRoomId, pin.trim());
        if (!isPinValid) {
          setErrorMsg('관리자 PIN 번호가 일치하지 않습니다.');
          setIsLoading(false);
          return;
        }

        saveLastRecord({ role: 'admin', roomId: cleanRoomId, updatedAt: Date.now() });
        onJoinSuccess({ role: 'admin', roomId: cleanRoomId });
      } else {
        // User role
        if (!selectedMemberId || !room.members[selectedMemberId]) {
          setErrorMsg('본인의 이름을 선택해주세요.');
          setIsLoading(false);
          return;
        }

        const targetMember = room.members[selectedMemberId];
        // 만약 출석하지 않은 상태라면 직접 출석 체크 후 입장
        if (!targetMember.isPresent) {
          await roomService.checkIn(cleanRoomId, selectedMemberId);
        }

        const record: LastLoginRecord = {
          role: 'user',
          roomId: cleanRoomId,
          memberId: selectedMemberId,
          memberName: targetMember.name,
          updatedAt: Date.now(),
        };
        saveLastRecord(record);

        onJoinSuccess({
          role: 'user',
          roomId: cleanRoomId,
          memberId: selectedMemberId,
          memberName: targetMember.name,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || '입장 중 오류 발생');
    } finally {
      setIsLoading(false);
    }
  };

  // 룸 생성 처리
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomId.trim()) {
      setErrorMsg('룸 코드를 입력해주세요.');
      return;
    }
    if (!newPin.trim() || newPin.trim().length < 4) {
      setErrorMsg('관리자 PIN 번호는 4자리 이상 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const cleanId = newRoomId.trim().toUpperCase();
      await roomService.createRoom(cleanId, newPin.trim());

      saveLastRecord({ role: 'admin', roomId: cleanId, updatedAt: Date.now() });
      onJoinSuccess({ role: 'admin', roomId: cleanId });
    } catch (err: any) {
      setErrorMsg(err.message || '룸 생성 실패');
    } finally {
      setIsLoading(false);
    }
  };

  // 2번 요구사항: 최근 기록 [불러오기] 클릭 시 바로 입장!
  const handleDirectQuickJoin = async (record: LastLoginRecord) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const room = await roomService.getRoom(record.roomId);
      if (!room) {
        setErrorMsg('최근 접속했던 룸이 존재하지 않습니다.');
        return;
      }

      if (record.role === 'admin') {
        // 관리자로 바로 입장
        onJoinSuccess({ role: 'admin', roomId: record.roomId });
      } else {
        // 사용자로 바로 입장
        if (record.memberId && room.members[record.memberId]) {
          const target = room.members[record.memberId];
          if (!target.isPresent) {
            await roomService.checkIn(record.roomId, record.memberId);
          }
          onJoinSuccess({
            role: 'user',
            roomId: record.roomId,
            memberId: record.memberId,
            memberName: target.name,
          });
        } else {
          // 인원 선택 모드로 전환
          setRole('user');
          setRoomId(record.roomId);
          setFetchedRoom(room);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || '바로 입장 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMember = fetchedRoom?.members[selectedMemberId] || null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '88vh',
        width: '100%',
        padding: '16px 0',
      }}
    >
      {/* App Header Logo (1번 요구사항: 상단 룸 목록 관리 버튼 제거) */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
            marginBottom: '12px',
          }}
        >
          <Users size={30} color="#ffffff" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a' }}>
          현황판 출결 시스템
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          스마트폰 실시간 동기화 · 화장실/흡연/기타 타이머
        </p>

        {/* Sync Mode Badge */}
        <div style={{ marginTop: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: serviceMode === 'firebase' ? '#ecfdf5' : '#eef2ff',
              color: serviceMode === 'firebase' ? '#059669' : '#4f46e5',
              border: `1px solid ${serviceMode === 'firebase' ? '#a7f3d0' : '#c7d2fe'}`,
              fontWeight: 700,
            }}
          >
            {serviceMode === 'firebase' ? '⚡ Firebase 원격 실시간' : '🌐 로컬 실시간 모드'}
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '24px 20px',
          borderRadius: '20px',
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        {/* 2번 요구사항: 최근 로그인 기록 카드 -> [불러오기] 클릭 시 바로 입장! */}
        {lastRecord && (
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} color="#4f46e5" />
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>최근 접속 기록</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  {lastRecord.role === 'admin' ? '👑 관리자' : `👤 ${lastRecord.memberName || '사용자'}`} ({lastRecord.roomId})
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDirectQuickJoin(lastRecord)}
              disabled={isLoading}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 900,
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
              }}
            >
              {isLoading ? '입장 중...' : '불러오기'}
            </button>
          </div>
        )}

        {/* Tab Toggle (입장 vs 방 만들기) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => { setTab('join'); setErrorMsg(null); }}
            style={{
              padding: '10px',
              fontSize: '14px',
              fontWeight: 800,
              borderRadius: '10px',
              backgroundColor: tab === 'join' ? '#ffffff' : 'transparent',
              color: tab === 'join' ? '#4f46e5' : '#64748b',
              boxShadow: tab === 'join' ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
            }}
          >
            <LogIn size={16} /> 기존 룸 입장
          </button>
          <button
            type="button"
            onClick={() => { setTab('create'); setErrorMsg(null); }}
            style={{
              padding: '10px',
              fontSize: '14px',
              fontWeight: 800,
              borderRadius: '10px',
              backgroundColor: tab === 'create' ? '#ffffff' : 'transparent',
              color: tab === 'create' ? '#4f46e5' : '#64748b',
              boxShadow: tab === 'create' ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
            }}
          >
            <PlusCircle size={16} /> 새 룸 생성
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '2px solid #f87171',
              borderRadius: '10px',
              color: '#b91c1c',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {tab === 'join' ? (
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Role Selection */}
            <div>
              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 800, display: 'block', marginBottom: '8px' }}>
                접속 모드 선택
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setRole('admin'); setFetchedRoom(null); }}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: role === 'admin' ? '#eef2ff' : '#f8fafc',
                    border: `2px solid ${role === 'admin' ? '#4f46e5' : '#cbd5e1'}`,
                    color: role === 'admin' ? '#4f46e5' : '#475569',
                    fontWeight: 800,
                    fontSize: '13px',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <ShieldCheck size={20} />
                  <span>관리자 모드</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('user'); setFetchedRoom(null); }}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: role === 'user' ? '#ecfdf5' : '#f8fafc',
                    border: `2px solid ${role === 'user' ? '#10b981' : '#cbd5e1'}`,
                    color: role === 'user' ? '#059669' : '#475569',
                    fontWeight: 800,
                    fontSize: '13px',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <User size={20} />
                  <span>사용자 (본인 제어)</span>
                </button>
              </div>
            </div>

            {/* Room ID Input */}
            <div>
              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                룸 코드
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="룸 코드를 입력하세요"
                  value={roomId}
                  onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setFetchedRoom(null); }}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    backgroundColor: '#f8fafc',
                    border: '2px solid #cbd5e1',
                    borderRadius: '12px',
                    color: '#0f172a',
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    outline: 'none',
                  }}
                  required
                />
                {role === 'user' && !fetchedRoom && (
                  <button
                    type="button"
                    onClick={handleCheckRoom}
                    disabled={isLoading}
                    style={{
                      padding: '0 14px',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    인원 조회
                  </button>
                )}
              </div>
            </div>

            {/* Admin PIN Input */}
            {role === 'admin' && (
              <div>
                <label style={{ fontSize: '13px', color: '#475569', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                  관리자 PIN 번호
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    placeholder="4자리 이상 PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      backgroundColor: '#f8fafc',
                      border: '2px solid #cbd5e1',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '15px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                    required
                  />
                  <Key size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                </div>
              </div>
            )}

            {/* User Mode: Member Selection (이름만 표시) */}
            {role === 'user' && fetchedRoom && (
              <div>
                <label style={{ fontSize: '13px', color: '#475569', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                  본인 이름 선택
                </label>
                {Object.keys(fetchedRoom.members).length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: 700 }}>
                    등록된 인원이 없습니다. 관리자에게 먼저 인원 등록을 요청하세요.
                  </p>
                ) : (
                  <>
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        backgroundColor: '#f8fafc',
                        border: '2px solid #cbd5e1',
                        borderRadius: '12px',
                        color: '#0f172a',
                        fontSize: '16px',
                        fontWeight: 900,
                        outline: 'none',
                        marginBottom: '8px',
                      }}
                    >
                      {Object.values(fetchedRoom.members).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>

                    {/* Member Status Notice */}
                    {selectedMember && (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          backgroundColor: selectedMember.isPresent ? '#ecfdf5' : '#fffbeb',
                          border: `1.5px solid ${selectedMember.isPresent ? '#a7f3d0' : '#fde68a'}`,
                          color: selectedMember.isPresent ? '#059669' : '#d97706',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {selectedMember.isPresent ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>출석 확인되었습니다.</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={16} />
                            <span>미출석 상태입니다. 입장 시 <strong>자동으로 출석 체크</strong>됩니다.</span>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (role === 'user' && !fetchedRoom)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: role === 'admin' ? '#4f46e5' : '#10b981',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 900,
                boxShadow: `0 4px 14px ${role === 'admin' ? 'rgba(79, 70, 229, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                marginTop: '4px',
                opacity: isLoading || (role === 'user' && !fetchedRoom) ? 0.6 : 1,
              }}
            >
              {isLoading
                ? '확인 중...'
                : role === 'admin'
                ? '관리자 대시보드 입장'
                : selectedMember?.isPresent
                ? '내 상태 제어 화면 입장'
                : '출석 체크 및 내 화면 입장'}
            </button>
          </form>
        ) : (
          /* Create Room Form */
          <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                새 룸 코드 설정
              </label>
              <input
                type="text"
                placeholder="예: LIKELION-CAMP"
                value={newRoomId}
                onChange={(e) => setNewRoomId(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
                  border: '2px solid #cbd5e1',
                  borderRadius: '12px',
                  color: '#0f172a',
                  fontSize: '15px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#475569', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                관리자 비밀번호 (PIN)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  placeholder="4자리 이상 PIN 입력"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    backgroundColor: '#f8fafc',
                    border: '2px solid #cbd5e1',
                    borderRadius: '12px',
                    color: '#0f172a',
                    fontSize: '15px',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                  required
                />
                <Key size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 900,
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                marginTop: '4px',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <Sparkles size={18} /> {isLoading ? '생성 중...' : '새 룸 생성 및 관리자 입장'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
