import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  cancelAnimation,
  Easing,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { DesignSlide } from '../components/pattern/DesignSlide';
import { OfferSlide } from '../components/pattern/OfferSlide';
import { PhotoViewer } from '../components/pattern/PhotoViewer';
import { ShowroomExitSheet } from '../components/pattern/ShowroomExitSheet';
import { ShowroomIntro } from '../components/pattern/ShowroomIntro';
import { Tap } from '../components/Tap';
import { FONT, SHOWROOM } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { isHindiText, shownCategory } from '../i18n/names';
import { t } from '../i18n/t';
import type { RootScreenProps } from '../navigation/types';
import { patternRepo, type ShowroomDesign } from '../repositories/patternRepo';
import { loadOffers } from '../storage/offerStore';
import {
  liveOffers,
  OFFER_SLIDE_MS,
  slidesWithOffers,
  type ShowroomSlide,
} from '../utils/offers';
import {
  showroomCategories,
  showroomSlideMs,
  showroomSlides,
} from '../utils/showroom';
import { spokenOffer } from '../voice/spokenOffer';
import { useShowroomVoice } from '../voice/useShowroomVoice';

const logo = require('../../assets/brand/logo-gold.png');
const logoSource = Image.resolveAssetSource(logo);
const LOGO_HEIGHT = 36;
// Long enough that a customer resting a thumb on it does not get the PIN box.
const EXIT_HOLD_MS = 2000;
// How long one slide takes to glide to the next: slow, like a camera, not a swipe.
const GLIDE_MS = 1100;
// Back to the first slide through black, not a long run back past every slide.
const BLACK_MS = 400;
const NOT_GLIDING = -1;
// Room around an offer's poster: the logo and the tabs above, the time left below.
const TOP_BAR = 72;
const BOTTOM_BAR = 34;

type Slide = ShowroomSlide<ShowroomDesign>;

const twoDigits = (value: number): string => String(value).padStart(2, '0');

/**
 * The designs for a customer to look through, on their own: full screen in midnight
 * and gold, one
 * after another, with the tabs, the header and everything about money out of reach.
 * It opens on the shop's name. Any offers running come between the designs. A finger
 * moves them along, a tab narrows them to one category, and a tap opens that design's
 * photos in 3D, holding the slideshow until it is closed. The way out is the back
 * button, or holding the logo where there is no back button, and then the PIN. The
 * screen stays awake meanwhile. Android's own Home button is beyond an app; Screen
 * pinning, in the phone's settings, is what stops that one.
 */
export const ShowroomScreen: React.FC<RootScreenProps<'Showroom'>> = ({
  navigation,
  route,
}) => {
  useKeepAwake();
  const { categoryIds, showPrice, voice, pin } = route.params;
  const { announce } = useShowroomVoice(voice);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const list = useAnimatedRef<FlatList<Slide>>();
  const [designs, setDesigns] = useState<ShowroomDesign[] | null>(null);
  // Read once: what runs today is settled when the showroom opens.
  const [offers] = useState(() => liveOffers(loadOffers()));
  const [introDone, setIntroDone] = useState(false);
  // The one category the customer narrowed it to; null is all of those chosen.
  const [only, setOnly] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  // A horizontal list does not hand its height down to its pages, so it is measured.
  const [slideHeight, setSlideHeight] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [viewing, setViewing] = useState<ShowroomDesign | null>(null);
  const [leaving, setLeaving] = useState(false);

  const scrollX = useSharedValue(0);
  const glide = useSharedValue(NOT_GLIDING);
  const black = useSharedValue(0);
  const progress = useSharedValue(0);
  const blackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  // A list scrolls itself only quickly, so the slow glide is driven from here.
  useAnimatedReaction(
    () => glide.value,
    (x) => {
      if (x !== NOT_GLIDING) scrollTo(list, x, 0, false);
    }
  );

  useEffect(() => {
    let active = true;
    patternRepo.listShowroomDesigns().then(
      (loaded) => {
        if (active) setDesigns(loaded);
      },
      () => {
        if (!active) return;
        Alert.alert(
          t("Couldn't open the catalogue"),
          t('Go back and try again.')
        );
        navigation.goBack();
      }
    );
    return () => {
      active = false;
    };
  }, [navigation]);

  // The back button asks for the PIN rather than leaving, so a customer who presses
  // it stays here and the tailor always has a way out. A sheet open on top has its
  // own back, which closes it.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          setLeaving(true);
          return true;
        }
      );
      return () => subscription.remove();
    }, [])
  );

  const tabs = useMemo(
    () =>
      showroomCategories(
        (designs ?? []).filter((d) => categoryIds.includes(d.categoryId))
      ),
    [designs, categoryIds]
  );
  const slides = useMemo(
    () =>
      slidesWithOffers(
        showroomSlides(designs ?? [], only === null ? categoryIds : [only]),
        offers
      ),
    [designs, categoryIds, only, offers]
  );
  const current = slides[index];
  const onOffer = current?.kind === 'offer';
  // The designs are what is counted: an offer is not one to look for.
  const designCount = slides.filter((slide) => slide.kind === 'design').length;
  const designNumber = slides
    .slice(0, index + 1)
    .filter((slide) => slide.kind === 'design').length;

  // An offer is read out as its poster comes up, once each time it does.
  const offerKey = introDone && onOffer ? current.key : null;
  useEffect(() => {
    if (offerKey && current?.kind === 'offer') {
      announce(spokenOffer(current.offer));
    }
    // Only a new poster coming up is worth saying, not anything else changing.
  }, [offerKey]);

  const paused = !introDone || dragging || viewing !== null || leaving;
  const slideMs =
    current?.kind === 'design'
      ? showroomSlideMs(current.design.images.length)
      : OFFER_SLIDE_MS;

  // The pages line up afresh after a turn of the device or a new set of slides.
  useEffect(() => {
    cancelAnimation(glide);
    glide.value = NOT_GLIDING;
    scrollX.value = index * width;
    // Only when the list is made anew, not on every change of slide.
  }, [width, only]);

  useEffect(
    () => () => {
      if (blackTimer.current) clearTimeout(blackTimer.current);
    },
    []
  );

  // The next one after a while; any change of slide starts the wait afresh, so a
  // customer who has just moved it gets the full time to look.
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (paused || slides.length < 2) return;
    progress.value = withTiming(1, {
      duration: slideMs,
      easing: Easing.linear,
    });
    const timer = setTimeout(() => {
      const next = (index + 1) % slides.length;
      if (next === 0) {
        black.value = withTiming(1, { duration: BLACK_MS });
        blackTimer.current = setTimeout(() => {
          glide.value = 0;
          setIndex(0);
          black.value = withTiming(0, { duration: BLACK_MS });
        }, BLACK_MS);
        return;
      }
      setIndex(next);
      glide.value = index * width;
      glide.value = withTiming(next * width, {
        duration: GLIDE_MS,
        easing: Easing.inOut(Easing.cubic),
      });
    }, slideMs);
    return () => clearTimeout(timer);
    // The shared values never change; they are not what this waits on.
  }, [index, paused, slides.length, slideMs, width]);

  const chooseTab = (id: number | null): void => {
    setOnly(id);
    setIndex(0);
  };

  const onDragStart = (): void => {
    cancelAnimation(glide);
    glide.value = NOT_GLIDING;
    setDragging(true);
  };

  const onSettled = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.min(Math.max(page, 0), Math.max(slides.length - 1, 0)));
  };

  const leave = (): void => {
    setLeaving(false);
    navigation.goBack();
  };

  const blackStyle = useAnimatedStyle(() => ({ opacity: black.value }));
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  const renderSlide = ({
    item: slide,
    index: position,
  }: {
    item: Slide;
    index: number;
  }): React.JSX.Element => {
    // Held still only as to the next slide: a finger on it must not clear its words.
    const active = introDone && slide.key === current?.key;
    if (slide.kind === 'offer') {
      return (
        <View
          style={[
            styles.offer,
            { width, height: slideHeight, paddingTop: insets.top + TOP_BAR },
          ]}
        >
          <OfferSlide
            offer={slide.offer}
            width={width}
            height={
              slideHeight - insets.top - insets.bottom - TOP_BAR - BOTTOM_BAR
            }
            active={active}
          />
        </View>
      );
    }
    return (
      <DesignSlide
        design={slide.design}
        position={position}
        scrollX={scrollX}
        width={width}
        height={slideHeight}
        bottomInset={insets.bottom}
        active={active}
        showPrice={showPrice}
        onOpen={() => setViewing(slide.design)}
      />
    );
  };

  return (
    <View style={styles.page}>
      <StatusBar hidden />

      <Animated.FlatList
        ref={list}
        // A new key for a new width (the device turned) or a new set of slides, so
        // the pages line up again without a jump through the old ones.
        key={`${width}-${only}`}
        data={slides}
        style={styles.slides}
        onLayout={(event) => setSlideHeight(event.nativeEvent.layout.height)}
        extraData={`${index}-${slideHeight}-${paused}`}
        keyExtractor={(slide) => slide.key}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={slides.length ? index : undefined}
        getItemLayout={(_, at) => ({
          length: width,
          offset: width * at,
          index: at,
        })}
        windowSize={3}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={onDragStart}
        onScrollEndDrag={() => setDragging(false)}
        onMomentumScrollEnd={onSettled}
      />

      <View pointerEvents="box-none" style={styles.top}>
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
        >
          <Defs>
            <LinearGradient id="showroomTop" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={SHOWROOM.ground} stopOpacity={0.9} />
              <Stop offset="1" stopColor={SHOWROOM.ground} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#showroomTop)" />
        </Svg>
        <View style={[styles.bar, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onLongPress={() => setLeaving(true)}
            delayLongPress={EXIT_HOLD_MS}
            accessibilityLabel={t('Leave showroom')}
            style={styles.logoHold}
          >
            <Image
              source={logo}
              resizeMode="contain"
              style={{
                height: LOGO_HEIGHT,
                width: (LOGO_HEIGHT * logoSource.width) / logoSource.height,
              }}
            />
          </Pressable>
          {tabs.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabs}
            >
              <CategoryTab
                label={t('All')}
                selected={only === null}
                onPress={() => chooseTab(null)}
              />
              {tabs.map((tab) => (
                <CategoryTab
                  key={tab.id}
                  label={shownCategory(tab.name)}
                  selected={only === tab.id}
                  onPress={() => chooseTab(tab.id)}
                />
              ))}
            </ScrollView>
          ) : null}
        </View>
      </View>

      <View
        pointerEvents="none"
        style={[styles.bottom, { bottom: insets.bottom + 10 }]}
      >
        {!onOffer && designCount > 1 ? (
          <Text style={styles.counter}>
            {twoDigits(designNumber)}
            <Text style={styles.counterAll}> / {twoDigits(designCount)}</Text>
          </Text>
        ) : null}
        <View style={styles.track}>
          <Animated.View style={[styles.fill, progressStyle]} />
        </View>
      </View>

      <Animated.View pointerEvents="none" style={[styles.black, blackStyle]} />

      {!introDone ? <ShowroomIntro onDone={() => setIntroDone(true)} /> : null}

      <PhotoViewer
        visible={viewing !== null}
        images={viewing?.images ?? []}
        startIndex={0}
        title={viewing?.name ?? ''}
        ground={SHOWROOM.ground}
        onClose={() => setViewing(null)}
      />
      <ShowroomExitSheet
        visible={leaving}
        pin={pin}
        onUnlock={leave}
        onClose={() => setLeaving(false)}
      />
    </View>
  );
};

const CategoryTab: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, selected, onPress }) => (
  <Tap
    onPress={onPress}
    haptic="select"
    throttle={false}
    accessibilityRole="tab"
    accessibilityState={{ selected }}
    accessibilityLabel={label}
    style={[styles.tab, selected && styles.tabSelected]}
  >
    <Text
      style={[
        styles.tabText,
        !isHindiText(label) && styles.tabSpaced,
        selected && styles.tabTextSelected,
      ]}
    >
      {label}
    </Text>
  </Tap>
);

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: SHOWROOM.ground },
  slides: { flex: 1 },
  offer: { backgroundColor: SHOWROOM.ground },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingBottom: 18 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 16,
  },
  logoHold: { paddingVertical: 4 },
  tabs: { gap: 4, paddingRight: 16, alignItems: 'center' },
  // A line under the word, rather than a button: the way a fashion site marks it.
  tab: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabSelected: { borderBottomColor: SHOWROOM.gold },
  tabText: {
    fontFamily: FONT.medium,
    fontSize: 13,
    textTransform: 'uppercase',
    color: SHOWROOM.textMuted,
  },
  tabSpaced: { letterSpacing: 1.2 },
  tabTextSelected: { fontFamily: FONT.semibold, color: SHOWROOM.goldBright },
  bottom: { position: 'absolute', left: 24, right: 24, gap: 8 },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: FONT.semibold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    color: SHOWROOM.goldBright,
  },
  counterAll: { fontFamily: FONT.regular, color: SHOWROOM.textMuted },
  // How long until the next: a hair of white filling from the left.
  track: { height: 1, backgroundColor: SHOWROOM.line, overflow: 'hidden' },
  fill: {
    height: 1,
    backgroundColor: SHOWROOM.goldBright,
    transformOrigin: 'left',
  },
  black: { ...StyleSheet.absoluteFill, backgroundColor: SHOWROOM.ground },
}));
