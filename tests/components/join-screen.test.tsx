// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JoinScreen } from '../../src/components/join/JoinScreen';

describe('JoinScreen Component', () => {
  it('should render join screen with default admin mode and empty room code input', () => {
    const handleJoinSuccess = vi.fn();
    render(<JoinScreen onJoinSuccess={handleJoinSuccess} />);

    expect(screen.getByText('현황판 출결 시스템')).toBeDefined();
    expect(screen.getByText('관리자 모드')).toBeDefined();
    expect(screen.getByText('사용자 (본인 제어)')).toBeDefined();

    const roomInput = screen.getByPlaceholderText('룸 코드를 입력하세요') as HTMLInputElement;
    expect(roomInput.value).toBe(''); // 하드코딩 제거 확인
  });

  it('should switch between admin and user mode when clicked', () => {
    const handleJoinSuccess = vi.fn();
    render(<JoinScreen onJoinSuccess={handleJoinSuccess} />);

    const userModeBtn = screen.getByText('사용자 (본인 제어)');
    fireEvent.click(userModeBtn);

    expect(screen.getByText('인원 조회')).toBeDefined();
  });
});
