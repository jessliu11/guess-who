import React from 'react';
import { View, Text, Modal } from 'react-native';
import { Trophy, Frown } from 'lucide-react-native';
import { Button } from '../ui/Button';
import { CharacterImage } from './CharacterImage';
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
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-white rounded-3xl p-8 w-full items-center border border-gray-200">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: iWon ? '#FEF3C7' : '#F3F4F6' }}
          >
            {iWon
              ? <Trophy size={32} color="#D97706" strokeWidth={1.5} />
              : <Frown size={32} color="#9CA3AF" strokeWidth={1.5} />
            }
          </View>
          <Text className={`text-3xl font-bold mb-6 ${iWon ? 'text-accent' : 'text-gray-500'}`}>
            {iWon ? 'Great Guess!' : 'Better Luck Next Time!'}
          </Text>

          {opponentCharacter && (
            <View className="items-center mb-6">
              <Text className="text-gray-400 text-xs mb-2 uppercase tracking-wider">
                Opponent was
              </Text>
              <CharacterImage
                name={opponentCharacter.name}
                imageUrl={opponentCharacter.image_url}
                className="w-24 h-24 rounded-2xl mb-2"
                initialsFontSize={36}
              />
              <Text className="text-navy font-semibold text-base">
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
