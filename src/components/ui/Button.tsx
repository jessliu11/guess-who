import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<string, { container: string; text: string }> = {
  primary:   { container: 'bg-primary-600 active:bg-primary-700', text: 'text-white font-semibold' },
  secondary: { container: 'bg-surface-card border border-slate-600 active:bg-surface-elevated', text: 'text-slate-100 font-semibold' },
  ghost:     { container: 'bg-transparent active:bg-white/10', text: 'text-primary-400 font-semibold' },
  danger:    { container: 'bg-red-600 active:bg-red-700', text: 'text-white font-semibold' },
};

const sizeStyles: Record<string, { container: string; text: string }> = {
  sm: { container: 'px-4 py-2 rounded-xl', text: 'text-sm' },
  md: { container: 'px-6 py-3.5 rounded-2xl', text: 'text-base' },
  lg: { container: 'px-8 py-4 rounded-2xl', text: 'text-lg' },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center ${vs.container} ${ss.container} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" className="mr-2" />
      ) : icon ? (
        <View className="mr-2">{icon}</View>
      ) : null}
      <Text className={`${vs.text} ${ss.text}`}>{title}</Text>
    </TouchableOpacity>
  );
}
