import React, { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createBottomTabNavigator,
  type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import {
  StackActions,
  useNavigation,
  type NavigationAction,
  type NavigationState,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackHeaderProps,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ClothScanner } from '../components/ClothScanner';
import { IconButton } from '../components/IconButton';
import { Tap } from '../components/Tap';
import { COLORS, FONT, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { useLayout } from '../layout/useLayout';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { BackupScreen } from '../screens/BackupScreen';
import { DeleteDataScreen } from '../screens/DeleteDataScreen';
import { BillDetailScreen } from '../screens/BillDetailScreen';
import { BillListScreen } from '../screens/BillListScreen';
import { ClothDetailScreen } from '../screens/ClothDetailScreen';
import { ClothFormScreen } from '../screens/ClothFormScreen';
import { ClothListScreen } from '../screens/ClothListScreen';
import { CollectPaymentScreen } from '../screens/CollectPaymentScreen';
import { NewBillScreen } from '../screens/NewBillScreen';
import { PatternCategoryScreen } from '../screens/PatternCategoryScreen';
import { PatternItemFormScreen } from '../screens/PatternItemFormScreen';
import { PatternItemScreen } from '../screens/PatternItemScreen';
import { PatternsScreen } from '../screens/PatternsScreen';
import { PrintBillScreen } from '../screens/PrintBillScreen';
import { PrinterSettingsScreen } from '../screens/PrinterSettingsScreen';
import { RateMasterScreen } from '../screens/RateMasterScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ShowroomScreen } from '../screens/ShowroomScreen';
import { ShowroomSetupScreen } from '../screens/ShowroomSetupScreen';
import { NavRail, type TabDefinition } from './NavRail';
import { TabIcon, type IconName } from './TabIcon';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// The tabs are the app's front door, so they carry the shop's logo; every
// page opened from them names itself and has a back arrow.
const BrandHeader: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [scanning, setScanning] = useState(false);
  return (
    <>
      <AppHeader
        title=""
        brand
        right={
          <View style={styles.scan}>
            <IconButton
              icon="qr-code-outline"
              label={t("Scan a cloth's QR")}
              color={COLORS.textPrimary}
              onPress={() => setScanning(true)}
            />
          </View>
        }
      />
      {/* A scanned cloth's page opens over whichever tab the scan was made
          from. */}
      <ClothScanner
        visible={scanning}
        onClose={() => setScanning(false)}
        onScanned={(cloth) => {
          setScanning(false);
          navigation.navigate('ClothDetail', { clothId: cloth.id });
        }}
      />
    </>
  );
};
const brandHeader = () => <BrandHeader />;
const settingsHeader = () => <AppHeader title={t('Settings')} />;

const stackHeader = ({
  navigation,
  options,
  route,
  back,
}: NativeStackHeaderProps) => (
  <AppHeader
    title={options.title ?? route.name}
    onBack={back ? navigation.goBack : undefined}
    right={options.headerRight?.({ canGoBack: !!back })}
  />
);

const tabIcon =
  (active: IconName, idle: IconName) =>
  ({ focused, color }: { focused: boolean; color: string }) => (
    <TabIcon focused={focused} name={focused ? active : idle} color={color} />
  );

// Tabs press like every other control: a dip and a selection tick, not the
// stock ripple flooding the whole bar segment. Web-only props are dropped.
const TabButton = ({
  href: _href,
  pressColor: _pressColor,
  pressOpacity: _pressOpacity,
  hoverEffect: _hoverEffect,
  style,
  children,
  ...rest
}: BottomTabBarButtonProps) => (
  <Tap
    {...rest}
    style={style as StyleProp<ViewStyle>}
    haptic="select"
    throttle={false}
    activeOpacity={1}
  >
    {children}
  </Tap>
);

const TABS: readonly TabDefinition[] = [
  { name: 'Bills', active: 'receipt', idle: 'receipt-outline' },
  { name: 'Cloths', active: 'layers', idle: 'layers-outline' },
  { name: 'Patterns', active: 'albums', idle: 'albums-outline' },
  { name: 'Settings', active: 'settings', idle: 'settings-outline' },
];

const SCREENS: Record<keyof TabParamList, React.ComponentType<any>> = {
  Bills: BillListScreen,
  Cloths: ClothListScreen,
  Patterns: PatternsScreen,
  Settings: SettingsScreen,
};

// The bar's own height, above whatever the system's navigation bar takes:
// room for the icon's pill and its label. Left to itself the bar is 49 tall,
// which cuts the label off.
const TAB_BAR_HEIGHT = 62;
const noTabBar = () => null;

const HomeTabs: React.FC = () => {
  const { isTablet } = useLayout();
  const insets = useSafeAreaInsets();
  const barInset = Math.max(insets.bottom, 8);
  return (
    <Tab.Navigator
      // On a tablet the tabs are in the rail, beside every page (see AppFrame).
      tabBar={isTablet ? noTabBar : undefined}
      screenOptions={{
        header: brandHeader,
        tabBarButton: TabButton,
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + barInset,
          paddingTop: 6,
          paddingBottom: barInset,
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
      }}
    >
      {TABS.map(({ name, active, idle }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={SCREENS[name]}
          options={{
            title: t(name),
            tabBarIcon: tabIcon(active, idle),
            // The page shows the logo full-size itself; the header just names it.
            ...(name === 'Settings' ? { header: settingsHeader } : null),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

/** The tab the root stack's pages belong to, from the state of Home's tabs. */
function currentTab(state: NavigationState): keyof TabParamList {
  const home = state.routes.find((route) => route.name === 'Home');
  const tabs = home?.state;
  const name = tabs?.routes[tabs.index ?? 0]?.name;
  return (name as keyof TabParamList | undefined) ?? 'Bills';
}

/**
 * What every page stands in. The side insets go here, once, so no page has to
 * think about a camera cutout with the device on its side. On a tablet the
 * navigation rail stands here too, beside the whole stack, so it stays on every
 * page; going to a tab from a page above returns through Home, so a form with
 * unsaved changes still asks first.
 */
const AppFrame: React.FC<{
  state: NavigationState;
  navigation: { dispatch: (action: NavigationAction) => void };
  children: React.ReactNode;
}> = ({ state, navigation, children }) => {
  const { isTablet } = useLayout();
  const insets = useSafeAreaInsets();
  // The showroom is for a customer: edge to edge, and no way to the other pages.
  const showroom = state.routes[state.index]?.name === 'Showroom';
  return (
    <View
      style={[
        styles.frame,
        !showroom && {
          paddingLeft: insets.left,
          paddingRight: isTablet ? 0 : insets.right,
        },
      ]}
    >
      <View style={styles.frameMain}>{children}</View>
      {isTablet && !showroom ? (
        <NavRail
          tabs={TABS}
          current={currentTab(state)}
          onSelect={(screen) =>
            navigation.dispatch(StackActions.popTo('Home', { screen }))
          }
        />
      ) : null}
    </View>
  );
};

export const RootNavigator: React.FC = () => (
  <Stack.Navigator
    layout={({ children, state, navigation }) => (
      <AppFrame state={state} navigation={navigation}>
        {children}
      </AppFrame>
    )}
    screenOptions={{ header: stackHeader, animation: 'slide_from_right' }}
  >
    <Stack.Screen
      name="Home"
      component={HomeTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="NewBill"
      component={NewBillScreen}
      options={({ route }) => ({
        title:
          route.params?.billId === undefined ? t('New bill') : t('Edit bill'),
      })}
    />
    <Stack.Screen
      name="BillDetail"
      component={BillDetailScreen}
      options={({ route }) => ({
        title: t('Bill No. {0}', route.params.billId),
      })}
    />
    <Stack.Screen
      name="CollectPayment"
      component={CollectPaymentScreen}
      options={{ title: t('Collect payment') }}
    />
    <Stack.Screen
      name="PrintBill"
      component={PrintBillScreen}
      options={{ title: t('Print bill') }}
    />
    <Stack.Screen
      name="ClothForm"
      component={ClothFormScreen}
      options={({ route }) => ({
        title:
          route.params?.clothId === undefined
            ? t('Add cloth')
            : t('Edit cloth'),
      })}
    />
    <Stack.Screen
      name="ClothDetail"
      component={ClothDetailScreen}
      options={{ title: t('Cloth') }}
    />
    <Stack.Screen
      name="PatternCategory"
      component={PatternCategoryScreen}
      options={{ title: t('Category') }}
    />
    <Stack.Screen
      name="PatternItem"
      component={PatternItemScreen}
      options={{ title: t('Design') }}
    />
    <Stack.Screen
      name="PatternItemForm"
      component={PatternItemFormScreen}
      options={({ route }) => ({
        title:
          route.params.itemId === undefined
            ? t('New design')
            : t('Edit design'),
      })}
    />
    <Stack.Screen
      name="ShowroomSetup"
      component={ShowroomSetupScreen}
      options={{ title: t('Showroom') }}
    />
    <Stack.Screen
      name="Showroom"
      component={ShowroomScreen}
      options={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'fade',
      }}
    />
    <Stack.Screen
      name="RateMaster"
      component={RateMasterScreen}
      options={{ title: t('Rate Master') }}
    />
    <Stack.Screen
      name="Analytics"
      component={AnalyticsScreen}
      options={{ title: t('Analytics') }}
    />
    <Stack.Screen
      name="Backup"
      component={BackupScreen}
      options={{ title: t('Backup & Restore') }}
    />
    <Stack.Screen
      name="DeleteData"
      component={DeleteDataScreen}
      options={{ title: t('Delete all data') }}
    />
    <Stack.Screen
      name="PrinterSettings"
      component={PrinterSettingsScreen}
      options={{ title: t('Bluetooth Printer') }}
    />
  </Stack.Navigator>
);

const styles = themedStyles(() => ({
  frame: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
  },
  frameMain: { flex: 1, minWidth: 0 },
  // Past the content's edge, so the icon itself rather than its hit area lines up.
  scan: { marginRight: -8 },
  tabLabel: {
    ...TYPE.caption,
    fontFamily: FONT.semibold,
    fontSize: 11.5,
    marginTop: 3,
  },
}));
