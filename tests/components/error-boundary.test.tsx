// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../src/components/common/ErrorBoundary';

function Boom(): JSX.Element {
  throw new Error('Illegal constructor');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary — 검은 화면 대신 원인을 보여준다', () => {
  it('정상 자식은 그대로 렌더한다', () => {
    render(
      <ErrorBoundary>
        <div>정상 화면</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('정상 화면')).toBeDefined();
  });

  it('자식이 터져도 빈 화면이 아니라 안내를 렌더한다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/화면을 표시하지 못했습니다/)).toBeDefined();
  });

  it('실제 오류 메시지를 노출해 원인 추적이 가능하다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Illegal constructor/)).toBeDefined();
  });

  it('복구 수단으로 새로고침 버튼을 제공한다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /새로고침/ })).toBeDefined();
  });
});
