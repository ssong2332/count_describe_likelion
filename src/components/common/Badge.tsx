import React from 'react';
import { DepartureType } from '../../domain/types';

interface BadgeProps {
  type: DepartureType | 'present' | 'absent';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  type,
  label,
  size = 'md',
  active = false,
}) => {
  const getBadgeStyle = () => {
    switch (type) {
      case 'present':
        return {
          bg: '#ecfdf5',
          color: '#059669',
          border: '1px solid #a7f3d0',
          defaultLabel: '출석',
        };
      case 'absent':
        return {
          bg: '#f1f5f9',
          color: '#64748b',
          border: '1px solid #e2e8f0',
          defaultLabel: '미출석',
        };
      case 'toilet':
        return {
          bg: '#f0f9ff',
          color: '#0284c7',
          border: '1px solid #bae6fd',
          defaultLabel: '화장실',
        };
      case 'smoking':
        return {
          bg: '#fffbeb',
          color: '#d97706',
          border: '1px solid #fde68a',
          defaultLabel: '흡연',
        };
      case 'etc':
        return {
          bg: '#faf5ff',
          color: '#9333ea',
          border: '1px solid #e9d5ff',
          defaultLabel: '기타',
        };
      default:
        return {
          bg: '#f8fafc',
          color: '#334155',
          border: '1px solid #e2e8f0',
          defaultLabel: '자리있음',
        };
    }
  };

  const styleConfig = getBadgeStyle();
  const displayLabel = label || styleConfig.defaultLabel;

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '11px', borderRadius: '6px' },
    md: { padding: '4px 10px', fontSize: '12px', borderRadius: '8px' },
    lg: { padding: '6px 14px', fontSize: '14px', borderRadius: '10px' },
  }[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 700,
        backgroundColor: styleConfig.bg,
        color: styleConfig.color,
        border: styleConfig.border,
        boxShadow: active ? `0 1px 4px ${styleConfig.color}30` : 'none',
        transition: 'all 0.2s ease',
        ...sizeStyles,
      }}
    >
      {active && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: styleConfig.color,
            animation: 'pulse 1.5s infinite',
          }}
        />
      )}
      {displayLabel}
    </span>
  );
};
