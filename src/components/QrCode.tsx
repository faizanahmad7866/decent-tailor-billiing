import React, { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { COLORS } from '../constants/theme';
import { qrSvgPath } from '../print/upiQr';

interface QrCodeProps {
  text: string;
  size: number;
}

/**
 * A QR code: black modules on white, square, drawn to fill `size`. The same
 * geometry the printed bill uses, so screen and paper carry the same code.
 */
export const QrCode: React.FC<QrCodeProps> = ({ text, size }) => {
  const { size: units, path } = useMemo(() => qrSvgPath(text), [text]);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${units} ${units}`}>
      <Rect width={units} height={units} fill={COLORS.qrLight} />
      <Path d={path} fill={COLORS.qrDark} />
    </Svg>
  );
};
