import React from 'react';
import { View, Text, Modal, Image } from 'react-native';
import { Button } from '../ui/Button';
import type { Character, PlayerRole } from '../../types/game.types';

interface WinModalProps {
  visible: boolean;
  winner: PlayerRole | undefined;
  myRole: PlayerRole;
  opponentCharacter?: Character;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function WinModal({
  visible,
  winner,
  myRole,
  opponentCharacter,
  onPlayAgain,
  onHome,
}: WinModalProps) {
  const iWon = winner === myRole;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/70 items-center justify-center px-6">
        <View className="bg-surface-card rounded-3xl p-8 w-full items-center border border-slate-700">
          <Text className="text-5xl mb-2">{iWon ? '🏆' : '😔'}</Text>
          <Text className={`text-3xl font-bold mb-1 ${iWon ? 'text-accent' : 'text-slate-300'}`}>
            {iWon ? 'You Win!' : 'You Lose!'}
          </Text>
          <Text className="text-slate-400 text-sm mb-6">
            {iWon ? 'Great guess!' : 'Better luck next time!'}
          </Text>

          {opponentCharacter && (
            <View className="items-center mb-6">
              <Text className="text-slate-400 text-xs mb-2 uppercase tracking-wider">
                Opponent was
              </Text>
              <Image
                source={{ uri: opponentCharacter.image_url }}
                className="w-24 h-24 rounded-2xl mb-2"
                resizeMode="cover"
              />
              <Text className="text-white font-semibold text-base">
                {opponentCharacter.name}
              </Text>
            </View>
          )}

          <View className="w-full gap-3">
            <Button title="Play Again" onPress={onPlayAgain} />
            <Button title="Home" variant="secondary" onPress={onHome} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
