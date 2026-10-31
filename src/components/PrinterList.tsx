import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import type { Link } from '../hooks/usePrinter';
import { t } from '../i18n/t';
import type { SavedPrinter } from '../storage/printerStore';
import {
  openBluetoothSettings,
  pairedPrinters,
  searchForPrinters,
  toPrinterError,
  type BluetoothDevice,
  type PrintProblem,
} from '../print/bluetoothPrint';
import { Button } from './Button';
import { PrintProblemNotice } from './PrintProblemNotice';
import { Section } from './Section';
import { Tap } from './Tap';

// Before Android 12 a search finds nothing while Location is switched off.
const LOCATION_HINT =
  Platform.OS === 'android' && (Platform.Version as number) < 31;

interface PrinterListProps {
  /** The printer in use now, ticked in the list. */
  selected: SavedPrinter | null;
  /** How the connection to the selected printer stands. */
  link: Link;
  onSelect: (device: BluetoothDevice) => void;
  /** While connecting or printing: the choice can't change under it. */
  disabled?: boolean;
  /** Start searching nearby as soon as the list opens. */
  autoSearch?: boolean;
  /** Called with the paired devices each time they are read. */
  onPairedLoaded?: (devices: BluetoothDevice[]) => void;
}

/**
 * Every way to reach the shop's printer, as a printer's own app offers it:
 * the devices already paired with this phone, and a search for printers
 * nearby — paired or not, classic Bluetooth or BLE. Picking one that isn't
 * paired pairs it there and then, through Android's own prompt.
 */
export const PrinterList: React.FC<PrinterListProps> = ({
  selected,
  link,
  onSelect,
  disabled = false,
  autoSearch = false,
  onPairedLoaded,
}) => {
  const [paired, setPaired] = useState<BluetoothDevice[] | null>(null);
  const [nearby, setNearby] = useState<BluetoothDevice[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [problem, setProblem] = useState<PrintProblem | null>(null);
  const stopSearch = useRef<(() => void) | null>(null);
  // Kept in refs so a new callback or flag each render doesn't re-read
  // the list.
  const pairedLoaded = useRef(onPairedLoaded);
  pairedLoaded.current = onPairedLoaded;
  const searchOnOpen = useRef(autoSearch);

  const search = useCallback(async () => {
    stopSearch.current?.();
    setNearby([]);
    setSearching(true);
    try {
      stopSearch.current = await searchForPrinters(
        (device) =>
          setNearby((current) =>
            current.some((d) => d.address === device.address)
              ? current
              : [...current, device]
          ),
        () => {
          stopSearch.current = null;
          setSearching(false);
          setSearched(true);
        }
      );
    } catch (error) {
      setSearching(false);
      setProblem(toPrinterError(error).problem);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const devices = await pairedPrinters();
      setProblem(null);
      setPaired(devices);
      pairedLoaded.current?.(devices);
      if (searchOnOpen.current) {
        searchOnOpen.current = false;
        void search();
      }
    } catch (error) {
      setProblem(toPrinterError(error).problem);
    }
  }, [search]);

  // Read again on the way back from Bluetooth settings or the "turn on
  // Bluetooth" prompt; the search stops when the page closes.
  useEffect(() => {
    void load();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    return () => {
      subscription.remove();
      stopSearch.current?.();
    };
  }, [load]);

  const renderDevice = (device: BluetoothDevice): React.ReactNode => {
    const isSelected = device.address === selected?.address;
    const status = isSelected ? link : null;
    let note = device.paired ? t('Paired') : t('Tap to connect');
    if (status === 'connecting') {
      note = device.paired
        ? t('Connecting…')
        : t('Connecting — pair if asked…');
    } else if (status === 'connected') note = t('Connected · bills print here');
    else if (status === 'failed')
      note = t('Not connected — is it switched on?');
    else if (isSelected) note = t('Bills print here');

    return (
      <Tap
        key={device.address}
        onPress={() => onSelect(device)}
        disabled={disabled}
        accessibilityLabel={`${device.name || device.address}, ${note}`}
        accessibilityState={{ selected: isSelected, disabled }}
        style={[styles.device, isSelected && styles.deviceSelected]}
      >
        <View style={[styles.deviceIcon, isSelected && styles.iconSelected]}>
          <Ionicons
            name={device.isPrinter ? 'print' : 'bluetooth'}
            size={22}
            color={isSelected ? COLORS.onPrimary : COLORS.accent}
          />
        </View>
        <View style={styles.deviceText}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {device.name || t('Unnamed device')}
          </Text>
          <Text
            style={[
              styles.deviceNote,
              status === 'connected' && styles.noteConnected,
              status === 'failed' && styles.noteFailed,
            ]}
          >
            {note}
          </Text>
        </View>
        {status === 'connecting' ? (
          <ActivityIndicator color={COLORS.accent} />
        ) : (
          <Ionicons
            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={isSelected ? COLORS.accent : COLORS.borderStrong}
          />
        )}
      </Tap>
    );
  };

  if (problem) {
    return (
      <Section title={t('Bluetooth printers')}>
        <PrintProblemNotice problem={problem} printerName="" onRetry={load} />
      </Section>
    );
  }

  // A BLE printer never shows as paired, so the chosen printer gets a row of
  // its own whenever the paired list doesn't have it.
  const own =
    selected && paired && !paired.some((d) => d.address === selected.address)
      ? (nearby.find((d) => d.address === selected.address) ?? {
          ...selected,
          isPrinter: true,
          paired: false,
          kind: 'unknown' as const,
        })
      : null;
  const listed = new Set([
    ...(paired ?? []).map((d) => d.address),
    ...(own ? [own.address] : []),
  ]);
  // A dual-mode printer also shows up over BLE, under another address; the
  // paired (classic) entry is the one that prints, so its twin is left out.
  const pairedNames = new Set(
    (paired ?? []).map((d) => d.name.trim().toLowerCase())
  );
  const found = nearby
    .filter((d) => !listed.has(d.address))
    .filter(
      (d) => d.kind !== 'ble' || !pairedNames.has(d.name.trim().toLowerCase())
    )
    .sort((a, b) => Number(b.isPrinter) - Number(a.isPrinter));

  return (
    <Section title={t('Bluetooth printers')}>
      {paired === null ? (
        <ActivityIndicator color={COLORS.accent} style={styles.busy} />
      ) : (
        <>
          {own ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>{t('Your printer')}</Text>
              {renderDevice(own)}
            </View>
          ) : null}

          {paired.length ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>
                {t('Paired with this phone')}
              </Text>
              {paired.map(renderDevice)}
            </View>
          ) : null}

          {searching || searched ? (
            <View style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>
                  {searching ? t('Searching nearby…') : t('Found nearby')}
                </Text>
                {searching ? (
                  <ActivityIndicator size="small" color={COLORS.accent} />
                ) : null}
              </View>
              {found.map(renderDevice)}
              {!found.length ? (
                <Text style={styles.hint}>
                  {searching
                    ? t('Switch the printer on and keep it near the phone.')
                    : LOCATION_HINT
                      ? t(
                          'No new printer found. Check it is on and not connected to another phone, and that Location is on.'
                        )
                      : t(
                          'No new printer found. Check it is on and not connected to another phone.'
                        )}
                </Text>
              ) : null}
            </View>
          ) : null}

          {!paired.length && !own && !searching && !searched ? (
            <Text style={styles.hint}>
              {t('No printer paired with this phone yet. Search to find it.')}
            </Text>
          ) : null}
        </>
      )}

      <Button
        label={searching ? t('Stop searching') : t('Search for printers')}
        icon={searching ? 'stop-circle-outline' : 'search'}
        variant={searching ? 'secondary' : 'tonal'}
        onPress={() => {
          if (searching) stopSearch.current?.();
          else void search();
        }}
        disabled={disabled}
      />
      <Tap
        onPress={() => void openBluetoothSettings()}
        accessibilityLabel={t('Open Bluetooth settings')}
        style={styles.settingsLink}
      >
        <Ionicons name="settings-outline" size={16} color={COLORS.accent} />
        <Text style={styles.settingsLinkText}>
          {t('Open Bluetooth settings')}
        </Text>
      </Tap>
    </Section>
  );
};

const styles = themedStyles(() => ({
  busy: { marginVertical: 24 },
  group: { gap: 10 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupTitle: { ...TYPE.overline, color: COLORS.textSecondary },
  hint: { ...TYPE.body, lineHeight: 21, color: COLORS.textSecondary },
  device: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  deviceSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryTint,
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryTint,
  },
  iconSelected: { backgroundColor: COLORS.primary },
  deviceText: { flex: 1, gap: 2 },
  deviceName: { ...TYPE.bodyStrong, fontSize: 16, color: COLORS.textPrimary },
  deviceNote: { ...TYPE.caption, color: COLORS.textMuted },
  noteConnected: { color: COLORS.success },
  noteFailed: { color: COLORS.warning },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  settingsLinkText: { ...TYPE.label, color: COLORS.accent },
}));
