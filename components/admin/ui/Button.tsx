'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-400',
  secondary:
    'bg-white text-neutral-900 border border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50 disabled:bg-neutral-50 disabled:text-neutral-400',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 disabled:text-neutral-300',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  iconLeft,
  iconRight,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${className ?? ''}`}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
