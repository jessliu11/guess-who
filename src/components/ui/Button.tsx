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
  secondary: { container: 'bg-white border border-gray-200 active:bg-gray-50', text: 'text-navy font-semibold' },
  ghost:     { container: 'bg-transparent active:bg-primary-50', text: 'text-primary-600 font-semibold' },
  danger:    { container: 'bg-white border border-danger active:bg-red-50', text: 'text-danger font-semibold' },
};

const sizeStyles: Record<string, { container: string; text: string }> = {
  sm: { container: 'px-4 py-2 rounded-full', text: 'text-sm' },
  md: { container: 'px-6 py-3.5 rounded-full', text: 'text-base' },
  lg: { container: 'px-8 py-4 rounded-full', text: 'text-lg' },
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
        <ActivityIndicator size="small" color="#7C3AED" className="mr-2" />
      ) : icon ? (
        <View className="mr-2">{icon}</View>
      ) : null}
      <Text className={`${vs.text} ${ss.text}`}>{title}</Text>
    </TouchableOpacity>
  );
}
