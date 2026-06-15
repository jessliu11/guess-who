import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface PillInputProps extends TextInputProps {
  /** Lucide icon node rendered on the left side */
  icon: React.ReactNode;
  /** Show a show/hide password toggle on the right side */
  secureToggle?: boolean;
}

export function PillInput({ icon, secureToggle = false, secureTextEntry, ...props }: PillInputProps) {
  // When secureToggle is enabled, always start hidden (password masked by default)
  const [hidden, setHidden] = useState(secureToggle ? true : (secureTextEntry ?? false));
  const isSecure = secureToggle ? hidden : secureTextEntry;

  return (
    <View className="flex-row items-center bg-white border border-[#E5E0D5] rounded-full px-4 py-3.5 mb-3">
      <View className="mr-3" style={{ opacity: 0.4 }}>{icon}</View>
      <TextInput
        className="flex-1 text-base text-navy font-sans"
        placeholderTextColor="#9CA3AF"
        secureTextEntry={isSecure}
        autoCapitalize="none"
        {...props}
      />
      {secureToggle && (
        <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={8}>
          {hidden
            ? <EyeOff size={18} color="#9CA3AF" />
            : <Eye size={18} color="#9CA3AF" />
          }
        </TouchableOpacity>
      )}
    </View>
  );
}
