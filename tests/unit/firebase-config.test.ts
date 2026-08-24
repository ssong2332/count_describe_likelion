import { describe, it, expect } from 'vitest';
import { sanitizeConfigValue } from '../../src/services/firebase-config';

describe('sanitizeConfigValue — 배포 환경변수 값 정제', () => {
  // 정상 케이스
  it('따옴표가 없는 정상 값은 그대로 반환한다', () => {
    expect(
      sanitizeConfigValue('https://countlikelion-default-rtdb.asia-southeast1.firebasedatabase.app')
    ).toBe('https://countlikelion-default-rtdb.asia-southeast1.firebasedatabase.app');
  });

  // 재현 케이스 — Vercel 대시보드에 큰따옴표째 저장된 값
  it('앞뒤를 감싼 큰따옴표를 제거한다 (프로덕션 동기화 장애 재현)', () => {
    expect(
      sanitizeConfigValue('"https://countlikelion-default-rtdb.asia-southeast1.firebasedatabase.app"')
    ).toBe('https://countlikelion-default-rtdb.asia-southeast1.firebasedatabase.app');
  });

  // 경계 케이스
  it('앞뒤를 감싼 작은따옴표를 제거한다', () => {
    expect(sanitizeConfigValue("'countlikelion'")).toBe('countlikelion');
  });

  it('앞뒤 공백과 개행을 제거한다', () => {
    expect(sanitizeConfigValue('  countlikelion.firebaseapp.com \n')).toBe(
      'countlikelion.firebaseapp.com'
    );
  });

  it('공백으로 감싸인 따옴표 값도 처리한다', () => {
    expect(sanitizeConfigValue(' "1:159250604563:web:61fbd232f2a4e9eb7d15e6" ')).toBe(
      '1:159250604563:web:61fbd232f2a4e9eb7d15e6'
    );
  });

  // 예외 케이스
  it('undefined/빈 문자열은 undefined를 반환해 다음 폴백으로 넘긴다', () => {
    expect(sanitizeConfigValue(undefined)).toBeUndefined();
    expect(sanitizeConfigValue('')).toBeUndefined();
    expect(sanitizeConfigValue('   ')).toBeUndefined();
    expect(sanitizeConfigValue('""')).toBeUndefined();
  });

  it('값 내부의 따옴표는 보존한다 (한쪽만 있는 경우 제거하지 않음)', () => {
    expect(sanitizeConfigValue('abc"def')).toBe('abc"def');
    expect(sanitizeConfigValue('"unbalanced')).toBe('"unbalanced');
  });

  it('URL 끝의 슬래시를 제거해 REST 경로 이중 슬래시를 막는다', () => {
    expect(sanitizeConfigValue('"https://example.firebasedatabase.app/"')).toBe(
      'https://example.firebasedatabase.app'
    );
  });
});
