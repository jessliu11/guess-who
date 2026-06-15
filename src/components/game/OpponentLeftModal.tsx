import React from 'react';
import { View, Text, Modal } from 'react-native';
import { UserX } from 'lucide-react-native';
import { Button } from '../ui/Button';

interface OpponentLeftModalProps {
  visible: boolean;
  onHome: () => void;
}

export function OpponentLeftModal({ visible, onHome }: OpponentLeftModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onHome}>
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-white rounded-3xl p-8 w-full items-center border border-gray-200">
          <View className="w-16 h-16 rounded-2xl bg-gray-100 items-center justify-center mb-3">
            <UserX size={32} color="#6B7280" strokeWidth={1.5} />
          </View>
          <Text className="text-navy text-3xl font-bold mb-1">Opponent Left</Text>
          <Text className="text-gray-400 text-sm mb-6 text-center">
            Your opponent left the game.
          </Text>

          <View className="w-full">
            <Button title="Back to Home" onPress={onHome} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
