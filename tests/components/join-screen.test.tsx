// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JoinScreen } from '../../src/components/join/JoinScreen';

describe('JoinScreen Component', () => {
  it('should render join screen with default user mode and empty room code input', () => {
    const handleJoinSuccess = vi.fn();
    render(<JoinScreen onJoinSuccess={handleJoinSuccess} />);

    expect(screen.getByText('현황판 출결 시스템')).toBeDefined();
    expect(screen.getByText('관리자 모드')).toBeDefined();
    expect(screen.getByText('사용자')).toBeDefined();

    const roomInput = screen.getByPlaceholderText('룸 코드를 입력하세요') as HTMLInputElement;
    expect(roomInput.value).toBe(''); // 하드코딩 제거 확인
  });

  it('접속 모드는 사용자가 기본값이다 (인원 조회 흐름이 바로 보인다)', () => {
    const handleJoinSuccess = vi.fn();
    render(<JoinScreen onJoinSuccess={handleJoinSuccess} />);

    // 사용자 모드에서만 나타나는 요소들
    expect(screen.getByText('인원 조회')).toBeDefined();
    // 관리자 모드 전용 입력은 아직 없어야 한다
    expect(screen.queryByPlaceholderText('4자리 이상 PIN')).toBeNull();
  });

  it("'(본인 제어)' 부가 문구는 노출하지 않는다", () => {
    const handleJoinSuccess = vi.fn();
    render(<JoinScreen onJoinSuccess={handleJoinSuccess} />);

    expect(screen.queryByText('사용자 (본인 제어)')).toBeNull();
    expect(screen.queryByText(/본인 제어/)).toBeNull();
  });

  it('should switch between admin and user mode when clicked', () => {
    const handleJoinSuccess = vi.fn();
    render(<JoinScreen onJoinSuccess={handleJoinSuccess} />);

    // 기본(사용자) → 관리자로 전환하면 PIN 입력이 나타난다
    fireEvent.click(screen.getByText('관리자 모드'));
    expect(screen.getByPlaceholderText('4자리 이상 PIN')).toBeDefined();

    // 다시 사용자로 전환하면 인원 조회 흐름으로 돌아온다
    fireEvent.click(screen.getByText('사용자'));
    expect(screen.getByText('인원 조회')).toBeDefined();
  });
});
