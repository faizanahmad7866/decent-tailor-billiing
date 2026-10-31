import React from 'react';
import { Text, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { charsFor, LINE_CHARS, QR_MODULE_DOTS } from '../print/escpos';
import type { ReceiptPart } from '../print/receiptText';
import { QrCode } from './QrCode';

// The printer's font: 12 dots a character, 24 dots tall plus a 6-dot gap,
// on a 384-dot line. Monospace characters are 0.6 of their size wide.
const CHAR_WIDTH_EM = 0.6;
const LINE_HEIGHT = 30 / 24;
const PRINT_WIDTH_DOTS = 384;
const QR_MODULES = 41;

interface ReceiptPreviewProps {
  parts: ReceiptPart[];
  /** Width of the printed area on screen. */
  width: number;
}

/**
 * The receipt as it comes out of the printer: the same lines, in a fixed-
 * width font sized so a line of 32 characters spans the paper, and the QR
 * at the size the printer draws it.
 */
export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  parts,
  width,
}) => {
  const fontSize = width / LINE_CHARS / CHAR_WIDTH_EM;
  const lineHeight = fontSize * LINE_HEIGHT;
  const qrSize = (width * QR_MODULES * QR_MODULE_DOTS) / PRINT_WIDTH_DOTS;

  return (
    <View style={[styles.paper, { width }]}>
      {parts.map((part, index) => {
        if (part.kind === 'qr') {
          return (
            <View key={index} style={styles.qr}>
              <QrCode text={part.data} size={qrSize} />
            </View>
          );
        }
        const { line } = part;
        const scale = LINE_CHARS / charsFor(line);
        const tall = line.big || line.tall;
        return (
          // Double height doubles the line on paper; the text is stretched
          // to match, and double width comes from the bigger font.
          <View
            key={index}
            style={{ height: tall ? lineHeight * 2 : lineHeight }}
          >
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[
                styles.line,
                {
                  fontSize: fontSize * scale,
                  lineHeight: lineHeight * scale,
                  textAlign: line.align === 'left' ? 'left' : 'center',
                },
                line.bold && styles.bold,
                line.tall && !line.big && styles.tall,
              ]}
            >
              {line.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = themedStyles(() => ({
  paper: { backgroundColor: COLORS.qrLight },
  // The phone's own fixed-width font: the printer's font is fixed-width,
  // and Inter isn't, so columns would not line up in it.
  line: { fontFamily: 'monospace', color: COLORS.qrDark },
  // A system font: picked by weight, not by name as Inter is.
  bold: { fontWeight: 'bold' },
  tall: { transform: [{ scaleY: 2 }], transformOrigin: 'top' },
  qr: { alignItems: 'center' },
}));
