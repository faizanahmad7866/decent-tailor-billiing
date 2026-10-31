import React from 'react';
import { TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD, COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { IconButton } from './IconButton';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChangeText,
  placeholder,
}) => (
  <View style={styles.box}>
    <Ionicons name="search" size={20} color={COLORS.textMuted} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      accessibilityLabel={placeholder}
      selectionColor={COLORS.primaryTintStrong}
      cursorColor={COLORS.accent}
      autoCorrect={false}
      returnKeyType="search"
      style={styles.input}
    />
    {value ? (
      <IconButton
        icon="close-circle"
        label={t('Clear search')}
        color={COLORS.textMuted}
        onPress={() => onChangeText('')}
      />
    ) : null}
  </View>
);

const styles = themedStyles(() => ({
  box: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    gap: 10,
    ...CARD,
  },
  input: {
    flex: 1,
    height: '100%',
    ...TYPE.body,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
}));
