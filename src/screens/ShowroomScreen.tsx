import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOut,
  FadeOutRight,
} from 'react-native-reanimated';
import { PhotoViewer } from '../components/pattern/PhotoViewer';
import {
  AttractView,
  type AttractSlide,
} from '../components/showroom/AttractView';
import { BrowseView } from '../components/showroom/BrowseView';
import { DesignDetail } from '../components/showroom/DesignDetail';
import { PicksPanel } from '../components/showroom/PicksPanel';
import { ShowroomExitSheet } from '../components/showroom/ShowroomExitSheet';
import { ShowroomIntro } from '../components/showroom/ShowroomIntro';
import { StillThere } from '../components/showroom/StillThere';
import { useShowroomFonts } from '../components/showroom/useShowroomFonts';
import { SHOWROOM } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import type { RootScreenProps } from '../navigation/types';
import { patternRepo, type ShowroomDesign } from '../repositories/patternRepo';
import { loadOffers } from '../storage/offerStore';
import { liveOffers, slidesWithOffers } from '../utils/offers';
import { showroomCategories, showroomSlides } from '../utils/showroom';
import {
  isPicked,
  moreLikeThis,
  togglePick,
  updatePick,
  sortDesigns,
  type DesignPick,
  type DesignSort,
} from '../utils/showroomBrowse';
import { createIdleClock, type IdleClock } from '../utils/showroomIdle';
import { spokenOffer } from '../voice/spokenOffer';
import { useShowroomVoice } from '../voice/useShowroomVoice';

/** A customer who stops touching it is asked after 80 s, and it starts over at 90. */
const IDLE = { idleMs: 90_000, warnMs: 10_000 };
const RELATED = 8;

type Stage = 'intro' | 'attract' | 'browse';

interface Viewing {
  images: string[];
  start: number;
  title: string;
}

/**
 * The showroom, a kiosk the customer uses themselves. Left alone it plays the
 * designs one after another, with the offers among them, for anyone passing.
 * Touched, it opens the collection: every design in a grid, by category and by
 * price; a design's own page, with its price laid open and its fabric to choose;
 * its photos in 3D; and "My picks", the designs kept to show the tailor. Left
 * alone again, it asks whether anyone is still looking, then starts over.
 *
 * The tabs, the header, the bills and the totals are out of reach. The back
 * button steps back through the showroom and, at its start, asks for the PIN;
 * so does holding the logo, for a device with no back button. The screen stays
 * awake meanwhile. Android's own Home button is beyond an app: Screen pinning, in
 * the phone's settings, is what stops that one.
 */
export const ShowroomScreen: React.FC<RootScreenProps<'Showroom'>> = ({
  navigation,
  route,
}) => {
  useKeepAwake();
  // Nothing is drawn until its faces are in: a name set in the phone's own font
  // and then swapped would jump. They are usually in already, from the setup page.
  const fontsReady = useShowroomFonts();
  const { categoryIds, showPrice, voice, pin } = route.params;
  const [designs, setDesigns] = useState<ShowroomDesign[] | null>(null);
  // Read once: what runs today is settled when the showroom opens.
  const [offers] = useState(() => liveOffers(loadOffers()));
  const [stage, setStage] = useState<Stage>('intro');
  const [openId, setOpenId] = useState<number | null>(null);
  const [category, setCategory] = useState<number | null>(null);
  const [sort, setSort] = useState<DesignSort>('newest');
  const [picks, setPicks] = useState<DesignPick[]>([]);
  const [picksOpen, setPicksOpen] = useState(false);
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const { announce } = useShowroomVoice(voice, stage === 'browse');

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

  const shown = useMemo(
    () => (designs ?? []).filter((d) => categoryIds.includes(d.categoryId)),
    [designs, categoryIds]
  );
  const byId = useMemo(
    () => new Map(shown.map((design) => [design.id, design])),
    [shown]
  );
  const categories = useMemo(() => showroomCategories(shown), [shown]);
  const slides = useMemo(
    () => slidesWithOffers(showroomSlides(shown, categoryIds), offers),
    [shown, categoryIds, offers]
  );
  const browsing = useMemo(
    () =>
      sortDesigns(
        category === null
          ? shown
          : shown.filter((design) => design.categoryId === category),
        sort
      ),
    [shown, category, sort]
  );
  const open = openId === null ? null : (byId.get(openId) ?? null);
  const related = useMemo(
    () => (open ? moreLikeThis(shown, open, RELATED) : []),
    [shown, open]
  );

  /** For the next customer: back to the loop, everything put away. */
  const startOver = useCallback(() => {
    setStage('attract');
    setOpenId(null);
    setCategory(null);
    setSort('newest');
    setPicks([]);
    setPicksOpen(false);
    setViewing(null);
    setSecondsLeft(null);
  }, []);

  // Counts only while a customer is exploring, and not while the 3D view (which
  // takes its own touches) or the PIN box is open.
  const idle = useRef<IdleClock | null>(null);
  useEffect(() => {
    if (stage !== 'browse' || leaving || viewing) return;
    const clock = createIdleClock(IDLE, {
      onWarn: setSecondsLeft,
      onTimeout: startOver,
    });
    idle.current = clock;
    return () => {
      clock.stop();
      idle.current = null;
    };
  }, [stage, leaving, viewing, startOver]);
  const poke = (): void => idle.current?.poke();

  // The back button steps back through the showroom, and at its start asks for
  // the PIN. A sheet open on top has its own back, which closes it.
  const now = useRef({ stage, openId, picksOpen });
  now.current = { stage, openId, picksOpen };
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          const { stage: at, openId: opened, picksOpen: listing } = now.current;
          if (listing) setPicksOpen(false);
          else if (opened !== null) setOpenId(null);
          else if (at === 'browse') setStage('attract');
          else setLeaving(true);
          return true;
        }
      );
      return () => subscription.remove();
    }, [])
  );

  // Stable, so the intro's own timing is not started again on every render.
  const introDone = useCallback(
    () => setStage((at) => (at === 'intro' ? 'attract' : at)),
    []
  );

  const onSlide = useCallback(
    (slide: AttractSlide) => {
      if (slide.kind === 'offer') announce(spokenOffer(slide.offer));
    },
    [announce]
  );

  const explore = (designId: number | null): void => {
    setStage('browse');
    setOpenId(designId);
  };

  const toggleDesign = (design: ShowroomDesign): void =>
    setPicks((kept) =>
      togglePick(kept, {
        designId: design.id,
        pricePaise: design.pricePaise,
        fabrics: [],
      })
    );

  const leave = (): void => {
    setLeaving(false);
    navigation.goBack();
  };

  return (
    <View style={styles.page} onTouchStart={poke}>
      <StatusBar hidden />

      {stage === 'attract' && designs && fontsReady ? (
        <Animated.View
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(400)}
          style={StyleSheet.absoluteFill}
        >
          <AttractView
            slides={slides}
            showPrice={showPrice}
            onSlide={onSlide}
            onExplore={explore}
            onHoldLogo={() => setLeaving(true)}
            paused={leaving}
          />
        </Animated.View>
      ) : null}

      {stage === 'browse' ? (
        <Animated.View
          entering={FadeIn.duration(450)}
          exiting={FadeOut.duration(350)}
          style={StyleSheet.absoluteFill}
        >
          <BrowseView
            designs={browsing}
            total={shown.length}
            categories={categories}
            category={category}
            onCategory={setCategory}
            sort={sort}
            onSort={setSort}
            offers={offers}
            showPrice={showPrice}
            picks={picks}
            onOpen={(design) => setOpenId(design.id)}
            onTogglePick={toggleDesign}
            onOpenPicks={() => setPicksOpen(true)}
            onHome={() => {
              setStage('attract');
              setOpenId(null);
            }}
            onHoldLogo={() => setLeaving(true)}
          />
          {open ? (
            <Animated.View
              key={open.id}
              entering={FadeInRight.duration(380)}
              exiting={FadeOutRight.duration(260)}
              style={StyleSheet.absoluteFill}
            >
              <DesignDetail
                design={open}
                related={related}
                showPrice={showPrice}
                pick={picks.find((each) => each.designId === open.id) ?? null}
                isPicked={(id) => isPicked(picks, id)}
                onTogglePick={(pick) =>
                  setPicks((kept) => togglePick(kept, pick))
                }
                onUpdatePick={(pick) =>
                  setPicks((kept) => updatePick(kept, pick))
                }
                onTogglePickOf={toggleDesign}
                onOpen={(design) => setOpenId(design.id)}
                onClose={() => setOpenId(null)}
                onView3D={(start) =>
                  setViewing({
                    images: open.images,
                    start,
                    title: open.name,
                  })
                }
              />
            </Animated.View>
          ) : null}
          {picksOpen ? (
            <PicksPanel
              picks={picks}
              designs={byId}
              showPrice={showPrice}
              onOpen={(design) => {
                setPicksOpen(false);
                setOpenId(design.id);
              }}
              onRemove={(designId) =>
                setPicks((kept) => kept.filter((p) => p.designId !== designId))
              }
              onClear={() => setPicks([])}
              onClose={() => setPicksOpen(false)}
            />
          ) : null}
        </Animated.View>
      ) : null}

      {secondsLeft !== null ? (
        <StillThere secondsLeft={secondsLeft} onStay={poke} />
      ) : null}

      {stage === 'intro' && fontsReady ? (
        <ShowroomIntro onDone={introDone} />
      ) : null}

      <PhotoViewer
        visible={viewing !== null}
        images={viewing?.images ?? []}
        startIndex={viewing?.start ?? 0}
        title={viewing?.title ?? ''}
        tone="showroom"
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

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: SHOWROOM.ground },
}));
