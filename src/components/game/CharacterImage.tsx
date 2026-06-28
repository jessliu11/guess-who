import React, { useState, useEffect } from 'react';
import { View, Text, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { getInitials, getColorForName } from '../../lib/avatar';

// Supabase Storage supports imgproxy transforms via query params.
// Serving a capped resolution dramatically reduces payload size on the wire
// (a 4 MB original becomes ~30 KB at 400 px) without any visible quality loss
// at the sizes characters are displayed in the app.
function supabaseThumb(url: string): string {
  if (!url.includes('/storage/v1/object/public/')) return url;
  return `${url}?width=400&height=400&resize=cover&quality=80`;
}

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
    const resolvedUrl = supabaseThumb(imageUrl);
    return (
      <Image
        source={{ uri: resolvedUrl }}
        style={style}
        className={className}
        blurRadius={blurRadius}
        contentFit={resizeMode}
        cachePolicy="memory-disk"
        recyclingKey={resolvedUrl}
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
