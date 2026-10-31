import React from 'react';
import { Modal, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, OFFER } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import type { Offer } from '../../utils/offers';
import { IconButton } from '../IconButton';
import { OfferSlide } from './OfferSlide';

interface OfferPreviewProps {
  offer: Offer | null;
  onClose: () => void;
}

/** An offer full screen as a customer will see it, before the showroom opens. */
export const OfferPreview: React.FC<OfferPreviewProps> = ({
  offer,
  onClose,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={offer !== null}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.page}>
        {offer ? (
          <OfferSlide offer={offer} width={width} height={height} active />
        ) : null}
        <View style={[styles.close, { top: insets.top + 24 }]}>
          <IconButton
            icon="close"
            label={t('Close')}
            color={COLORS.textOnDark}
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: OFFER.ground },
  close: { position: 'absolute', right: 24 },
}));
