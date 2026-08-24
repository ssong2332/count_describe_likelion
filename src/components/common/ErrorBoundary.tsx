import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * 렌더/이펙트에서 예외가 나면 React는 트리 전체를 언마운트한다.
 * 경계가 없으면 화면이 통째로 비어(어두운 배경이라 검은 화면으로 보인다)
 * 새로고침해야만 복구된다. 여기서 잡아 원인을 그대로 보여준다.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] 화면 렌더 실패:', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="error-boundary">
        <div className="error-boundary__icon">⚠️</div>
        <h2 className="error-boundary__title">화면을 표시하지 못했습니다</h2>
        <p className="error-boundary__desc">
          아래 오류가 발생했습니다. 현황 데이터는 클라우드에 그대로 있으니 새로고침하면 이어서 사용할
          수 있습니다.
        </p>
        <pre className="error-boundary__detail">{error.message}</pre>
        <button
          type="button"
          className="error-boundary__button"
          onClick={() => window.location.reload()}
        >
          새로고침
        </button>
      </div>
    );
  }
}
