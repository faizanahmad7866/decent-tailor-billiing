import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TabParamList = {
  Bills: undefined;
  Cloths: undefined;
  Patterns: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Home: NavigatorScreenParams<TabParamList> | undefined;
  /**
   * No id: making a new bill. An id: changing that one. A `designId` starts a new
   * bill made from that design — its cloths and its stitching on it — which,
   * once created, goes straight to the printer.
   */
  NewBill:
    | {
        billId?: number;
        designId?: number;
      }
    | undefined;
  BillDetail: { billId: number };
  CollectPayment: { billId: number };
  /** `autoPrint`: print as soon as the printer is ready — for a bill just made. */
  PrintBill: { billId: number; autoPrint?: boolean };
  /** No id: adding a new cloth. An id: editing that one. */
  ClothForm: { clothId?: number } | undefined;
  /** `justAdded`: opened right after the cloth was saved, to print its QR. */
  ClothDetail: { clothId: number; justAdded?: boolean };
  /** A category of the pattern catalogue, with its designs. */
  PatternCategory: { categoryId: number };
  /** One design, shown full: photos, video, price. */
  PatternItem: { itemId: number };
  /** An itemId changes that design; otherwise a new one goes in `categoryId`. */
  PatternItemForm: { itemId?: number; categoryId?: number };
  /** Before the showroom: what to show, prices, and the PIN that leaves it. */
  ShowroomSetup: undefined;
  /** The designs of these categories, full screen, for a customer to look through. */
  Showroom: {
    categoryIds: number[];
    showPrice: boolean;
    /** Greet the customer aloud as it opens. */
    voice: boolean;
    pin: string;
  };
  RateMaster: undefined;
  /** Settings → Analytics: which cloth sold how much. */
  Analytics: undefined;
  Backup: undefined;
  /** Settings → Delete all data. */
  DeleteData: undefined;
  PrinterSettings: undefined;
};

export type RootScreenProps<Name extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Name>;

/** A tab's screen, which can also push any screen of the root stack. */
export type TabScreenProps<Name extends keyof TabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList, Name>,
    NativeStackScreenProps<RootStackParamList>
  >;
