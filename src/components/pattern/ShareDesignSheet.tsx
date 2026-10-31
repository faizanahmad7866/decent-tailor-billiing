import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { File } from 'expo-file-system';
import { COLORS, FONT, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { later, t } from '../../i18n/t';
import {
  makeDesignCatalog,
  saveDesignCatalog,
  sendDesignMessage,
  shareDesignCatalog,
} from '../../print/shareDesign';
import type { PatternItem } from '../../repositories/patternRepo';
import { haptics } from '../../utils/haptics';
import { formatRupees } from '../../utils/money';
import { formatMobile, messagingNumber } from '../../utils/phone';
import { Button } from '../Button';
import { Tap } from '../Tap';
import { TextField } from '../TextField';

type Job = 'message' | 'whatsappPdf' | 'share' | 'save';

interface ShareDesignSheetProps {
  /** The design to share; the sheet is closed while there is none. */
  item: PatternItem | null;
  visible: boolean;
  onClose: () => void;
}

const FAILURE: Record<Job, string> = {
  message: later(
    'The catalogue could not be made, or WhatsApp could not be opened. Try again.'
  ),
  whatsappPdf: later('The catalogue could not be made. Try again.'),
  share: later('The catalogue could not be made. Try again.'),
  save: later('The catalogue could not be saved. Try another folder.'),
};

/**
 * How a design's PDF catalogue reaches a customer. On WhatsApp it goes in two
 * steps, because a link can open a chat on a number but cannot carry a file:
 * first a one-line message to the number typed, which opens that chat, then
 * the PDF, shared into the same chat — now at the top of WhatsApp's list.
 * The PDF can also be shared to any app, or saved on the phone. It is made
 * once, the first time it is needed, and reused while the sheet is open.
 */
export const ShareDesignSheet: React.FC<ShareDesignSheetProps> = ({
  item,
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [mobile, setMobile] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [pdfSent, setPdfSent] = useState(false);
  const [busy, setBusy] = useState<Job | null>(null);
  const [triedMessage, setTriedMessage] = useState(false);
  // The catalogue made for this opening of the sheet.
  const pdf = useRef<Promise<File> | null>(null);

  // Each opening starts afresh: a new number, and the catalogue made again
  // so it carries any change to the design or its cloths' rates.
  useEffect(() => {
    if (!visible) return;
    pdf.current = null;
    setMobile('');
    setMessageSent(false);
    setPdfSent(false);
    setTriedMessage(false);
  }, [visible, item?.id]);

  const catalog = (design: PatternItem): Promise<File> => {
    if (!pdf.current) {
      pdf.current = makeDesignCatalog(design);
      // A failed attempt is not kept: the next tap tries again.
      pdf.current.catch(() => {
        pdf.current = null;
      });
    }
    return pdf.current;
  };

  const run = async (job: Job, work: () => Promise<void>): Promise<void> => {
    if (busy) return;
    setBusy(job);
    try {
      await work();
    } catch (error) {
      haptics.error();
      // The reason as the phone gave it, small under the message, so a
      // screenshot of a failure says what went wrong.
      const reason = error instanceof Error ? error.message : String(error);
      Alert.alert(t('Not done'), `${t(FAILURE[job])}\n\n(${reason})`);
    } finally {
      setBusy(null);
    }
  };

  const numberOk = messagingNumber(mobile) !== null;
  const numberError =
    triedMessage && !numberOk
      ? t('Enter the 10-digit mobile number')
      : undefined;

  const sendMessage = (): void => {
    setTriedMessage(true);
    if (!item || !numberOk) {
      haptics.error();
      return;
    }
    void run('message', async () => {
      // Made first, while the app is in front: Android pauses the page the
      // PDF is drawn on once WhatsApp opens over it. Ready on the way back,
      // and a PDF that can't be made is known before the customer is told
      // one is coming.
      await catalog(item);
      await sendDesignMessage(item, mobile);
      setMessageSent(true);
    });
  };

  const sendPdf = (): void => {
    if (!item) return;
    void run('whatsappPdf', async () => {
      await shareDesignCatalog(await catalog(item), item);
      setPdfSent(true);
      haptics.success();
    });
  };

  const sharePdf = (): void => {
    if (!item) return;
    void run('share', async () => {
      await shareDesignCatalog(await catalog(item), item);
    });
  };

  const savePdf = (): void => {
    if (!item) return;
    void run('save', async () => {
      const name = await saveDesignCatalog(await catalog(item), item);
      if (!name) return;
      haptics.success();
      Alert.alert(
        t('PDF saved'),
        t('{0} is saved in the folder you chose.', name)
      );
    });
  };

  const anotherNumber = (): void => {
    setMobile('');
    setMessageSent(false);
    setPdfSent(false);
    setTriedMessage(false);
  };

  const shown = formatMobile(mobile);

  return (
    <Modal
      visible={visible && item !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={busy ? undefined : onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={busy ? undefined : onClose}
          accessibilityLabel={t('Close')}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.title}>
                {t('Share design')}
              </Text>
              {item ? (
                <Text numberOfLines={1} style={styles.subtitle}>
                  {item.name} · {formatRupees(item.pricePaise)}
                </Text>
              ) : null}
              <Text style={styles.note}>
                {t(
                  "A PDF catalogue with the shop's logo and numbers, every photo, the cloth and stitching price."
                )}
              </Text>
            </View>

            <View style={styles.whatsapp}>
              <View style={styles.whatsappHead}>
                <View style={styles.whatsappIcon}>
                  <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.wayTitle}>{t('Send on WhatsApp')}</Text>
                  <Text style={styles.waySubtitle}>
                    {t("Straight to the customer's number")}
                  </Text>
                </View>
              </View>

              {pdfSent ? (
                <View style={styles.done}>
                  <Ionicons
                    name="checkmark-circle"
                    size={26}
                    color={COLORS.success}
                  />
                  <Text style={styles.doneText}>
                    {t('Sent to +91 {0}', shown)}
                  </Text>
                </View>
              ) : (
                <TextField
                  label={t("Customer's WhatsApp number · मोबाइल")}
                  placeholder="98765 43210"
                  prefix="+91 "
                  size="large"
                  value={mobile}
                  onChangeText={(text) => {
                    setMobile(text);
                    setMessageSent(false);
                  }}
                  error={numberError}
                  digits={10}
                  keyboardType="phone-pad"
                  clearable
                  editable={!busy}
                  returnKeyType="send"
                  onSubmitEditing={sendMessage}
                />
              )}

              {!pdfSent ? (
                <>
                  <Step
                    number={1}
                    done={messageSent}
                    title={
                      messageSent ? t('Message sent') : t('Send the message')
                    }
                    detail={
                      messageSent
                        ? t('Opened the chat. Now send the PDF.')
                        : t(
                            'Makes the PDF, then opens WhatsApp on this number with one line about the design.'
                          )
                    }
                  >
                    <Button
                      label={
                        busy === 'message'
                          ? t('Making the PDF…')
                          : messageSent
                            ? t('Send again')
                            : t('Send message')
                      }
                      icon="chatbubble-ellipses-outline"
                      variant={messageSent ? 'secondary' : 'primary'}
                      onPress={sendMessage}
                      loading={busy === 'message'}
                      disabled={busy !== null && busy !== 'message'}
                    />
                  </Step>
                  <Step
                    number={2}
                    done={false}
                    title={t('Send the PDF')}
                    detail={t(
                      "Pick WhatsApp, then this customer's chat — it is at the top."
                    )}
                  >
                    <Button
                      label={t('Send PDF')}
                      icon="document-text-outline"
                      onPress={sendPdf}
                      loading={busy === 'whatsappPdf'}
                      disabled={
                        !messageSent ||
                        (busy !== null && busy !== 'whatsappPdf')
                      }
                    />
                  </Step>
                </>
              ) : (
                <Button
                  label={t('Send to another number')}
                  icon="refresh"
                  variant="secondary"
                  onPress={anotherNumber}
                />
              )}
            </View>

            <View style={styles.ways}>
              <Way
                icon="share-social-outline"
                title={t('Share PDF')}
                subtitle={t('To any app — WhatsApp, Gmail, Drive')}
                busy={busy === 'share'}
                disabled={busy !== null}
                onPress={sharePdf}
              />
              <Way
                icon="download-outline"
                title={t('Download PDF')}
                subtitle={t('Save it on this phone, in a folder you choose')}
                busy={busy === 'save'}
                disabled={busy !== null}
                onPress={savePdf}
              />
            </View>

            <Button
              label={t('Close')}
              variant="secondary"
              onPress={onClose}
              disabled={busy !== null}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/** One numbered step of sending on WhatsApp. */
const Step: React.FC<{
  number: number;
  done: boolean;
  title: string;
  detail: string;
  children: React.ReactNode;
}> = ({ number, done, title, detail, children }) => (
  <View style={styles.step}>
    <View style={styles.stepHead}>
      <View style={[styles.badge, done && styles.badgeDone]}>
        {done ? (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        ) : (
          <Text style={styles.badgeText}>{number}</Text>
        )}
      </View>
      <View style={styles.flex}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDetail}>{detail}</Text>
      </View>
    </View>
    {children}
  </View>
);

/** Another way the PDF can go: a row to tap. */
const Way: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}> = ({ icon, title, subtitle, busy, disabled, onPress }) => (
  <Tap
    onPress={onPress}
    disabled={disabled}
    accessibilityLabel={title}
    style={[styles.way, disabled && !busy && styles.dimmed]}
  >
    <View style={styles.wayIcon}>
      {busy ? (
        <ActivityIndicator color={COLORS.accent} />
      ) : (
        <Ionicons name={icon} size={24} color={COLORS.accent} />
      )}
    </View>
    <View style={styles.flex}>
      <Text style={styles.wayTitle}>{title}</Text>
      <Text style={styles.waySubtitle}>
        {busy ? t('Making the PDF…') : subtitle}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
  </Tap>
);

// WhatsApp's own green, so its button is known at a glance.
const WHATSAPP_GREEN = '#25D366';

const styles = themedStyles(() => ({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.backdrop,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '94%',
    alignSelf: 'center',
    paddingTop: 10,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 6,
  },
  content: { paddingHorizontal: 20, paddingTop: 6, gap: 16 },
  header: { alignItems: 'center', gap: 4 },
  title: { ...TYPE.title, fontSize: 21, color: COLORS.textPrimary },
  subtitle: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  note: {
    ...TYPE.caption,
    lineHeight: 18,
    textAlign: 'center',
    color: COLORS.textSecondary,
    maxWidth: 340,
  },
  flex: { flex: 1 },
  whatsapp: {
    gap: 14,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  whatsappHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  whatsappIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHATSAPP_GREEN,
  },
  step: { gap: 10 },
  stepHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink,
  },
  badgeDone: { backgroundColor: COLORS.success },
  badgeText: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: COLORS.textOnDark,
  },
  stepTitle: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  stepDetail: { ...TYPE.caption, lineHeight: 17, color: COLORS.textSecondary },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.successTint,
  },
  doneText: { ...TYPE.bodyStrong, color: COLORS.success },
  ways: { gap: 10 },
  way: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
  },
  dimmed: { opacity: 0.5 },
  wayIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryTint,
  },
  wayTitle: { ...TYPE.bodyStrong, fontSize: 16, color: COLORS.textPrimary },
  waySubtitle: { ...TYPE.caption, lineHeight: 17, color: COLORS.textSecondary },
}));
