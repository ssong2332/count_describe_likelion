import { describe, it, expect } from 'vitest';
import { formatPhoneNumber } from '../../src/domain/phone-format';

describe('formatPhoneNumber — 입력하는 대로 하이픈을 넣는다', () => {
  // 정상 케이스 — 요청받은 11자리
  it('11자리 휴대폰 번호를 3-4-4로 끊는다', () => {
    expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678');
  });

  it('이미 하이픈이 있어도 같은 결과를 낸다 (재입력·붙여넣기)', () => {
    expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678');
  });

  it('공백이나 점이 섞여 있어도 숫자만 남겨 정리한다', () => {
    expect(formatPhoneNumber('010 1234 5678')).toBe('010-1234-5678');
    expect(formatPhoneNumber('010.1234.5678')).toBe('010-1234-5678');
  });

  // 타이핑 도중 (한 글자씩 들어올 때)
  it('입력 중에는 들어온 만큼만 끊어 보여준다', () => {
    expect(formatPhoneNumber('0')).toBe('0');
    expect(formatPhoneNumber('010')).toBe('010');
    expect(formatPhoneNumber('0101')).toBe('010-1');
    expect(formatPhoneNumber('0101234')).toBe('010-1234');
    expect(formatPhoneNumber('01012345')).toBe('010-1234-5');
  });

  // 경계 케이스 — 다른 번호 체계
  it('10자리 번호는 3-3-4로 끊는다', () => {
    expect(formatPhoneNumber('0111234567')).toBe('011-123-4567');
    expect(formatPhoneNumber('0311234567')).toBe('031-123-4567');
  });

  it('02 지역번호는 앞을 2자리로 끊는다', () => {
    expect(formatPhoneNumber('0212345678')).toBe('02-1234-5678');
    expect(formatPhoneNumber('021234567')).toBe('02-123-4567');
  });

  it('11자리를 넘겨 입력하면 11자리에서 자른다', () => {
    expect(formatPhoneNumber('010123456789999')).toBe('010-1234-5678');
  });

  // 예외 케이스
  it('빈 값과 숫자가 하나도 없는 값은 빈 문자열이 된다', () => {
    expect(formatPhoneNumber('')).toBe('');
    expect(formatPhoneNumber('---')).toBe('');
    expect(formatPhoneNumber('없음')).toBe('');
    expect(formatPhoneNumber(undefined)).toBe('');
  });

  it('지우는 중에도 하이픈이 되살아나지 않는다', () => {
    // '010-1234-5' 에서 마지막 글자를 지우면 '010-1234-' 가 들어온다
    expect(formatPhoneNumber('010-1234-')).toBe('010-1234');
    // '010-1' 에서 지우면 '010-' 가 들어온다
    expect(formatPhoneNumber('010-')).toBe('010');
  });
});
