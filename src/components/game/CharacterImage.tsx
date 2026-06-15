import React, { useState, useEffect } from 'react';
import { View, Text, Image, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { getInitials, getColorForName } from '../../lib/avatar';

interface CharacterImageProps {
  name: string;
  imageUrl: string | null | undefined;
  style?: StyleProp<ImageStyle & ViewStyle>;
  className?: string;
  blurRadius?: number;
  initialsFontSize?: number;
  resizeMode?: 'cover' | 'contain';
}

export function CharacterImage({
  name,
  imageUrl,
  style,
  className,
  blurRadius,
  initialsFontSize = 28,
  resizeMode = 'cover',
}: CharacterImageProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => { setImgError(false); }, [imageUrl]);

  if (imageUrl && !imgError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={style}
        className={className}
        blurRadius={blurRadius}
        resizeMode={resizeMode}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <View
      style={[
        { backgroundColor: getColorForName(name), alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
      className={className}
    >
      <Text style={{ color: 'white', fontWeight: '700', fontSize: initialsFontSize }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
