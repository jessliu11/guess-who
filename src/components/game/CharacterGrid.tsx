import React from 'react';
import { View, FlatList } from 'react-native';
import { CharacterCard } from './CharacterCard';
import type { Character } from '../../types/game.types';

interface CharacterGridProps {
  characters: Character[];
  eliminated: string[];
  onPress?: (character: Character) => void;
  selectedId?: string;
}

export function CharacterGrid({
  characters,
  eliminated,
  onPress,
  selectedId,
}: CharacterGridProps) {
  return (
    <FlatList
      data={characters}
      numColumns={4}
      keyExtractor={(c) => c.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <CharacterCard
          character={item}
          eliminated={eliminated.includes(item.id)}
          selected={selectedId === item.id}
          onPress={onPress ? () => onPress(item) : undefined}
        />
      )}
      contentContainerStyle={{ alignItems: 'center' }}
    />
  );
}
