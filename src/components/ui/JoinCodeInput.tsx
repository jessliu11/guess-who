import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

interface JoinCodeInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}

export function JoinCodeInput({ value, onChange, length = 6 }: JoinCodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const padded = value.toUpperCase().padEnd(length, ' ');

  return (
    <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={1}>
      <View className="flex-row gap-2 justify-center">
        {Array.from({ length }).map((_, i) => {
          const char = padded[i] === ' ' ? '' : padded[i];
          const isCurrent = i === value.length;
          return (
            <View
              key={i}
              className={`w-12 h-14 rounded-xl items-center justify-center border ${
                isCurrent
                  ? 'border-primary-500 bg-surface-elevated'
                  : char
                  ? 'border-primary-700 bg-surface-elevated'
                  : 'border-slate-600 bg-surface-card'
              }`}
            >
              <Text className="text-white text-2xl font-bold">{char}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.toUpperCase().slice(0, length))}
        style={StyleSheet.absoluteFill}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={length}
        caretHidden
        className="opacity-0"
      />
    </TouchableOpacity>
  );
}
