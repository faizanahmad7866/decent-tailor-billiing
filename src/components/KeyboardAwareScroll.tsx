import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';

type ScrollIntoView = (target: View | null) => void;

const ScrollIntoViewContext = createContext<ScrollIntoView | null>(null);

/**
 * Asks the surrounding KeyboardAwareScroll to bring a field into view. A
 * field outside one gets nothing back, and focusing it simply doesn't scroll.
 */
export function useScrollIntoView(): ScrollIntoView | null {
  return useContext(ScrollIntoViewContext);
}

// How far below the top of the screen a focused field comes to rest — near
// the top, so the keyboard coming up underneath can't cover it.
const REST_BELOW_TOP = 110;

/**
 * A ScrollView for a form: when a field takes focus the page scrolls to put
 * it near the top, clear of the keyboard, and keeps room under the last field
 * so even that one can be lifted. Tabbing from field to field with the
 * keyboard's Next key carries the page along with it.
 *
 * Fields ask to be scrolled to through useScrollIntoView (TextField does it
 * on focus), so no screen has to wire up each field itself.
 */
export const KeyboardAwareScroll: React.FC<ScrollViewProps> = ({
  contentContainerStyle,
  children,
  ...scrollProps
}) => {
  const scrollRef = useRef<ScrollView>(null);
  // ScrollView's innerViewRef is typed without null, but starts as one.
  const innerRef = useRef<View>(null) as React.RefObject<View>;
  const focusedField = useRef<View | null>(null);
  const keyboardUp = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollToField = useCallback((field: View): void => {
    const inner = innerRef.current;
    if (!inner) return;
    field.measureLayout(
      inner,
      (_x, y) => {
        scrollRef.current?.scrollTo({
          y: Math.max(y - REST_BELOW_TOP, 0),
          animated: true,
        });
      },
      () => {
        // The field is gone (the screen moved on): nothing to scroll to.
      }
    );
  }, []);

  useEffect(() => {
    // iOS's KeyboardAvoidingView already makes room; only Android needs it.
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardUp.current = true;
      if (Platform.OS === 'android') {
        setKeyboardHeight(event.endCoordinates.height);
      }
      // The keyboard has finished rising, so the room to scroll is there.
      if (focusedField.current) scrollToField(focusedField.current);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardUp.current = false;
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollToField]);

  const scrollIntoView = useCallback<ScrollIntoView>(
    (target) => {
      focusedField.current = target;
      // Already up (moving from one field to the next): scroll now. Not yet:
      // the keyboardDidShow above does it.
      if (target && keyboardUp.current) scrollToField(target);
    },
    [scrollToField]
  );

  const padded: StyleProp<ViewStyle> = [
    contentContainerStyle,
    keyboardHeight ? { paddingBottom: keyboardHeight + 24 } : null,
  ];

  return (
    <ScrollIntoViewContext.Provider value={scrollIntoView}>
      <ScrollView
        {...scrollProps}
        ref={scrollRef}
        innerViewRef={innerRef}
        contentContainerStyle={padded}
      >
        {children}
      </ScrollView>
    </ScrollIntoViewContext.Provider>
  );
};
