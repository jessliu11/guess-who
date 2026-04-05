import React from 'react';
import { ScrollView, ScrollViewProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SafeScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  padded?: boolean;
}

export function SafeScrollView({ children, padded = true, className, ...props }: SafeScrollViewProps) {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className={`flex-1 ${padded ? 'px-4' : ''} ${className ?? ''}`}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        {...props}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
