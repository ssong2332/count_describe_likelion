import { useState, useEffect, useCallback, useMemo } from 'react';
import { DepartureType, Member, Room, ViewSortMode } from '../domain/types';
import { getRoomService } from '../services/service-factory';
import { calculateSummary, SummaryStats, sortMembersByShiftTime, buildScheduleBlocks } from '../domain/member-logic';
import { MemberPayload } from '../services/room-service.interface';

export function useRoomSync(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<ViewSortMode>('grid');

  const roomService = getRoomService();

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    const unsubscribe = roomService.subscribeRoom(roomId, (updatedRoom) => {
      clearTimeout(safetyTimer);
      setRoom(updatedRoom);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [roomId, roomService]);

  const addMember = useCallback(
    async (payload: MemberPayload | string): Promise<Member | null> => {
      if (!roomId) return null;
      try {
        const newMember = await roomService.addMember(roomId, payload);
        return newMember;
      } catch (err: any) {
        setError(err.message || '인원 추가 실패');
        return null;
      }
    },
    [roomId, roomService]
  );

  const importScheduleMembers = useCallback(
    async (members: Omit<Member, 'id' | 'isPresent' | 'activeStatus' | 'logs'>[]) => {
      if (!roomId) return;
      try {
        await roomService.importScheduleMembers(roomId, members);
      } catch (err: any) {
        setError(err.message || '인원 일괄 등록 실패');
      }
    },
    [roomId, roomService]
  );

  const setAdminMembers = useCallback(
    async (memberIds: string[]) => {
      if (!roomId) return;
      try {
        await roomService.setAdminMembers(roomId, memberIds);
      } catch (err: any) {
        setError(err.message || '관리자 목록 설정 실패');
      }
    },
    [roomId, roomService]
  );

  const updateMember = useCallback(
    async (memberId: string, payload: MemberPayload) => {
      if (!roomId) return;
      try {
        await roomService.updateMember(roomId, memberId, payload);
      } catch (err: any) {
        setError(err.message || '인원 수정 실패');
      }
    },
    [roomId, roomService]
  );

  const updateMemberName = useCallback(
    async (memberId: string, name: string) => {
      if (!roomId) return;
      try {
        await roomService.updateMemberName(roomId, memberId, name);
      } catch (err: any) {
        setError(err.message || '인원 수정 실패');
      }
    },
    [roomId, roomService]
  );

  const deleteMember = useCallback(
    async (memberId: string) => {
      if (!roomId) return;
      try {
        await roomService.deleteMember(roomId, memberId);
      } catch (err: any) {
        setError(err.message || '인원 삭제 실패');
      }
    },
    [roomId, roomService]
  );

  const deleteMembers = useCallback(
    async (memberIds: string[]) => {
      if (!roomId) return;
      try {
        await roomService.deleteMembers(roomId, memberIds);
      } catch (err: any) {
        setError(err.message || '선택 인원 삭제 실패');
      }
    },
    [roomId, roomService]
  );

  const deleteAllMembers = useCallback(
    async () => {
      if (!roomId) return;
      try {
        await roomService.deleteAllMembers(roomId);
      } catch (err: any) {
        setError(err.message || '전체 인원 삭제 실패');
      }
    },
    [roomId, roomService]
  );

  const toggleAttendance = useCallback(
    async (memberId: string) => {
      if (!roomId) return;
      try {
        await roomService.toggleAttendance(roomId, memberId);
      } catch (err: any) {
        setError(err.message || '출결 변경 실패');
      }
    },
    [roomId, roomService]
  );

  const checkIn = useCallback(
    async (memberId: string) => {
      if (!roomId) return;
      try {
        await roomService.checkIn(roomId, memberId);
      } catch (err: any) {
        setError(err.message || '출석 체크 실패');
      }
    },
    [roomId, roomService]
  );

  const setDeparture = useCallback(
    async (memberId: string, type: DepartureType, reason?: string) => {
      if (!roomId) return;
      try {
        await roomService.setDeparture(roomId, memberId, type, reason);
        setError(null);
      } catch (err: any) {
        setError(err.message || '자리비움 상태 변경 실패');
        throw err;
      }
    },
    [roomId, roomService]
  );

  const resetDaily = useCallback(async () => {
    if (!roomId) return;
    try {
      await roomService.resetDaily(roomId);
    } catch (err: any) {
      setError(err.message || '초기화 실패');
    }
  }, [roomId, roomService]);

  const rawMemberList: Member[] = useMemo(() => {
    return room ? Object.values(room.members) : [];
  }, [room]);

  const summary: SummaryStats = useMemo(() => {
    return calculateSummary(rawMemberList);
  }, [rawMemberList]);

  // 정렬된 멤버 목록
  const sortedMemberList: Member[] = useMemo(() => {
    return sortMembersByShiftTime(rawMemberList);
  }, [rawMemberList]);

  // 스케줄 블록
  const scheduleBlocks = useMemo(() => {
    return buildScheduleBlocks(rawMemberList);
  }, [rawMemberList]);

  return {
    room,
    memberList: sortedMemberList,
    rawMemberList,
    scheduleBlocks,
    summary,
    isLoading,
    error,
    clearError: () => setError(null),
    sortMode,
    setSortMode,
    addMember,
    importScheduleMembers,
    setAdminMembers,
    updateMember,
    updateMemberName,
    deleteMember,
    deleteMembers,
    deleteAllMembers,
    toggleAttendance,
    checkIn,
    setDeparture,
    resetDaily,
  };
}
