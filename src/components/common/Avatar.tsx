import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Colors, Fonts } from '../../constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle | ImageStyle;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 48, style }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style as ImageStyle]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  placeholder: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  initial: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});
