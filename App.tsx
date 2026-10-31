import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  NavigationContainer,
  type NavigationState,
} from '@react-navigation/native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { EmptyState } from './src/components/EmptyState';
import { COLORS } from './src/constants/theme';
import { themedStyles } from './src/constants/themedStyles';
import { migrateDatabase } from './src/db/database';
import { t } from './src/i18n/t';
import { navigationTheme } from './src/navigation/navigationTheme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppSettings } from './src/settings/appSettings';

// The splash (app.json) stays up until the database is ready, so the first
// thing the tailor sees is the catalog, never a blank frame.
SplashScreen.preventAutoHideAsync();

type Startup = 'starting' | 'ready' | 'failed';

export default function App(): React.JSX.Element {
  const { darkMode, language } = useAppSettings();
  // Where the tailor is, so that redrawing for a new language or dark mode comes
  // back to the same page.
  const navigationState = useRef<NavigationState | undefined>(undefined);
  const [startup, setStartup] = useState<Startup>('starting');
  // Why the database wouldn't open, shown small under the plain sentence so a
  // failure can be told apart without digging through logs.
  const [startupError, setStartupError] = useState<string | null>(null);
  // A font that fails to load is not worth stopping the app for: text falls
  // back to the phone's own font, so only `fontsReady` gates the first screen.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const fontsReady = fontsLoaded || fontError !== null;

  const start = useCallback(() => {
    setStartup('starting');
    migrateDatabase().then(
      () => setStartup('ready'),
      (error: unknown) => {
        setStartupError(error instanceof Error ? error.message : String(error));
        setStartup('failed');
      }
    );
  }, []);

  useEffect(start, [start]);

  useEffect(() => {
    if (startup !== 'starting' && fontsReady) SplashScreen.hideAsync();
  }, [startup, fontsReady]);

  return (
    <SafeAreaProvider
      initialMetrics={initialWindowMetrics}
      style={{ backgroundColor: COLORS.background }}
    >
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      {startup === 'ready' && fontsReady ? (
        <NavigationContainer
          // Words and style sheets are read as a screen draws, so a change of
          // language or dark mode draws every screen afresh.
          key={`${language}-${darkMode}`}
          theme={navigationTheme(darkMode)}
          initialState={navigationState.current}
          onStateChange={(state) => {
            navigationState.current = state;
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      ) : startup === 'failed' ? (
        <View style={styles.failed}>
          <EmptyState
            icon="alert-circle-outline"
            title={t("DT Billing couldn't start")}
            message={t(
              "The app's data couldn't be opened. Your data is safe — try again.{0}",
              startupError ? `\n\n${startupError}` : ''
            )}
            action={{ label: t('Try again'), onPress: start }}
          />
        </View>
      ) : null}
    </SafeAreaProvider>
  );
}

const styles = themedStyles(() => ({
  failed: { flex: 1, backgroundColor: COLORS.background },
}));
