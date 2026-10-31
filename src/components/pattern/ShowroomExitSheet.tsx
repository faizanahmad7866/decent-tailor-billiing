import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { haptics } from '../../utils/haptics';
import { isFullPin, PIN_LENGTH } from '../../utils/showroom';
import { Button } from '../Button';
import { TextField } from '../TextField';

interface ShowroomExitSheetProps {
  visible: boolean;
  /** The PIN that lets the tailor out. */
  pin: string;
  onUnlock: () => void;
  onClose: () => void;
}

/**
 * Asks for the PIN before leaving showroom mode. The fourth digit decides, with
 * nothing more to press: a wrong PIN clears, ready to try again.
 */
export const ShowroomExitSheet: React.FC<ShowroomExitSheetProps> = ({
  visible,
  pin,
  onUnlock,
  onClose,
}) => {
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTyped('');
    setWrong(false);
  }, [visible]);

  const onType = (text: string): void => {
    setTyped(text);
    setWrong(false);
    if (!isFullPin(text)) return;
    if (text === pin) {
      onUnlock();
      return;
    }
    haptics.error();
    setTyped('');
    setWrong(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('Close')}
        />
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('Leave showroom')}
          </Text>
          <TextField
            label={t('Enter the PIN')}
            value={typed}
            onChangeText={onType}
            digits={PIN_LENGTH}
            secureTextEntry
            autoFocus
            error={wrong ? t('Wrong PIN. Try again.') : undefined}
          />
          <Button label={t('Cancel')} variant="secondary" onPress={onClose} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = themedStyles(() => ({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.backdrop,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    gap: 16,
    padding: 20,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  title: { ...TYPE.title, color: COLORS.textPrimary },
}));
