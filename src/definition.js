//@flow
//this type is defined based on https://developers.google.com/publisher-tag/reference

export type SingleSizeArray = [number, number];
export type NamedSize = "fluid" | ["fluid"];
export type SingleSize = SingleSizeArray | NamedSize;
export type MultiSize = SingleSize[];
export type GeneralSize = SingleSize | MultiSize;
export type SizeMapping = [SingleSizeArray, GeneralSize];
export type SizeMappingArray = SizeMapping[];

export type OutOfPageFormat =
  | "REWARDED"
  | "TOP_ANCHOR"
  | "BOTTOM_ANCHOR"
  | "INTERSTITIAL";

// eslint-disable-next-line no-unused-vars
const OutOfPageFormatMapping: { [OutOfPageFormat]: number } = {
  REWARDED: 4,
  TOP_ANCHOR: 2,
  BOTTOM_ANCHOR: 3,
  INTERSTITIAL: 5
};

type CommandArray = {
  push: (() => void) => number
};

type Record<T, V> = {
  [T]: V
};

type Size = {
  getWidth: () => number,
  getHieght: () => number
};

type SizeMappingBuilder = {
  addSize: (
    viewportSize: SingleSizeArray,
    slotSize: GeneralSize
  ) => SizeMappingBuilder,
  build: () => SizeMappingArray
};

type SlotId = {
  getAdUnitPath: () => string,
  getDomId: () => string,
  getId: () => string,
  getName: () => string
};

type ResponseInformation = {
  advertiserId: number,
  campaignId: number,
  creativeId: ?number,
  creativeTemplateId: ?number,
  lineItemId: ?number
};

type SafeFrameConfig = {
  allowOverlayExpansion?: ?boolean,
  allowPushExpansion?: ?boolean,
  sandbox?: ?boolean,
  useUniqueDomain?: ?boolean
};

// eslint-disable-next-line no-unused-vars
type EventEnum =
  | "ImpressionViewableEvent"
  | "SlotOnloadEvent "
  | "SlotRenderEndedEvent"
  | "SlotRequestedEvent"
  | "SlotResponseReceived"
  | "SlotVisibilityChangedEvent";

type Event = {
  serviceName: string,
  slot: Slot
};

export type ImpressionViewableEvent = Event;

export type SlotOnloadEvent = Event;

export type SlotRenderEndedEvent = Event & {
  advertiserId: ?number,
  campaignId: ?number,
  creativeId: ?number,
  isEmpty: boolean,
  lineItemId: ?number,
  size: number[] | string,
  sourceAgnosticCreativeId: ?number,
  sourceAgnosticLineItemId: ?number
};

export type SlotRequestedEvent = Event;

export type SlotResponseReceivedEvent = Event;

export type SlotVisibilityChangedEvent = Event & {
  inViewPercentage: number
};

declare class Service {
  addEventListener(
    eventType: "impressionViewable",
    listener: (event: ImpressionViewableEvent) => void
  ): Service;
  addEventListener(
    eventType: "slotOnload",
    listener: (event: SlotOnloadEvent) => void
  ): Service;
  addEventListener(
    eventType: "slotRenderEnded",
    listener: (event: SlotRenderEndedEvent) => void
  ): Service;
  addEventListener(
    eventType: "slotRequested",
    listener: (event: SlotRequestedEvent) => void
  ): Service;
  addEventListener(
    eventType: "slotResponseReceived",
    listener: (event: SlotResponseReceivedEvent) => void
  ): Service;
  addEventListener(
    eventType: "slotVisibilityChanged",
    listener: (event: SlotVisibilityChangedEvent) => void
  ): Service;
  getSlots(): Slot[];

  removeEventListener(
    eventType: "impressionViewable",
    listener: (event: ImpressionViewableEvent) => void
  ): boolean;
  removeEventListener(
    eventType: "slotOnload",
    listener: (event: SlotOnloadEvent) => void
  ): boolean;
  removeEventListener(
    eventType: "slotRenderEnded",
    listener: (event: SlotRenderEndedEvent) => void
  ): boolean;
  removeEventListener(
    eventType: "slotRequested",
    listener: (event: SlotRequestedEvent) => void
  ): boolean;
  removeEventListener(
    eventType: "slotResponseReceived",
    listener: (event: SlotResponseReceivedEvent) => void
  ): boolean;
  removeEventListener(
    eventType: "slotVisibilityChanged",
    listener: (event: SlotVisibilityChangedEvent) => void
  ): boolean;
}

declare class Slot {
  addService(service: Service): Slot;
  clearCategoryExclusions(): Slot;
  clearTargeting(opt_key?: string): Slot;
  defineSizeMapping(sizeMapping: SizeMappingArray): Slot;
  get(key: string): ?string;
  getAdUnitPath(): string;
  getAttributeKeys(): string[];
  getCategoryExclusions(): string[];
  getClickUrl(): string;
  getCollapseEmptyDiv(): ?boolean;
  getContentUrl(): string;
  getDivStartsCollapsed(): ?boolean;
  getEscapedQemQueryId(): string;
  getFirstLook(): number;
  getHtml(): string;
  getName(): string;
  getOutOfPage(): boolean;
  getResponseInformation(): ?ResponseInformation;
  getServices(): Service[];
  getSizes(): Size[] | ["fluid"];
  getSlotElementId(): string;
  getSlotId(): SlotId;
  getTargeting(key: string): string[];
  getTargetingKeys(): string[];
  getTargetingMap(): Record<string, string | string[]>;
  set(key: string, value: string): Slot;
  setCategoryExclusion(categoryExclusion: string): Slot;
  setClickUrl(value: string): Slot;
  setCollapseEmptyDiv(
    collapse: boolean,
    opt_collapseBeforeAdFetch?: boolean
  ): Slot;
  setForceSafeFrame(forceSafeFrame: boolean): Slot;
  setSafeFrameConfig(config: SafeFrameConfig): Slot;
  setTargeting(key: string, value: string | string[]): Slot;
  updateTargetingFromMap(map: Record<string, string | string[]>): Slot;
}

declare class CompanionAdsService extends Service {
  setRefreshUnfilledSlots: (value: boolean) => void;
}

declare class ContentService extends Service {
  setContent: (slot: Slot, content: string) => void;
}

declare class PassbackSlot {
  display(): void;
  get(key: string): string;
  set(key: string, value: string): PassbackSlot;
  setClickUrl(url: string): PassbackSlot;
  setForceSafeFrame(forceSafeFrame: boolean): PassbackSlot;
  setTagForChildDirectedTreatment(value: number): PassbackSlot;
  setTagForUnderAgeOfConsent(value: number): PassbackSlot;
  setTargeting(key: string, value: string | string[]): PassbackSlot;
  updateTargetingFromMap(map: Record<string, string | string[]>): PassbackSlot;
}

type PrivacySettingsConfig = {
  childDirectedTreatment?: ?boolean,
  limitedAds?: ?boolean,
  restrictDataProcessing?: ?boolean,
  underAgeOfConsent?: ?boolean
};

declare class PubAdsService extends Service {
  clear(opt_slots?: Slot[]): boolean;
  clearCategoryExclusions(): PubAdsService;
  clearTagForChildDirectedTreatment(): PubAdsService;
  clearTargeting(opt_key?: string): PubAdsService;
  collapseEmptyDivs(opt_collapseBeforeAdFetch?: boolean): boolean;
  defineOutOfPagePassback(adUnitPath: string): PassbackSlot;
  definePassback(adUnitPath: string, size: GeneralSize): PassbackSlot;
  disableInitialLoad(): void;
  display(
    adUnitPath: string,
    size: GeneralSize,
    opt_div?: string | Element,
    opt_clickUrl?: string
  ): void;
  enableAsyncRendering(): boolean;
  enableLazyLoad(opt_config?: {
    fetchMarginPercent?: number,
    renderMarginPercent?: number,
    mobileScaling?: number
  }): void;
  enableSingleRequest(): boolean;
  enableSyncRendering(): boolean;
  enableVideoAds(): void;
  get(key: string): string | null;
  getAttributeKeys(): string[];
  getCorrelator(): string;
  getImaContent(): Record<"vid" | "cmsid", string>;
  getName(): string;
  getSlotIdMap(): Record<string, Slot>;
  getSlots(): Slot[];
  getTagSessionCorrelator(): number;
  getVersion(): string;
  getVideoContent(): Record<"vid" | "cmsid", string>;
  getTargeting(key: string): string[];
  getTargetingKeys(): string[];
  isInitialLoadDisabled(): boolean;
  isSRA(): boolean;
  markAsAmp(): void;
  refresh(
    opt_slots?: Slot[],
    opt_options?: { changeCorrelator: boolean }
  ): void;
  set(key: string, value: string): PubAdsService;
  setCategoryExclusion(categoryExclusion: string): PubAdsService;
  setCentering(centerAds: boolean): void;
  setForceSafeFrame(forceSafeFrame: boolean): PubAdsService;
  setImaContent(imaContentId: string, imaCmsId: string): void;
  setLocation(address: string): PubAdsService;
  setPrivacySettings(privacySettings: PrivacySettingsConfig): PubAdsService;
  setPublisherProvidedId(ppid: string): PubAdsService;
  setRequestNonPersonalizedAds(nonPersonalizedAds: number): PubAdsService;
  setSafeFrameConfig(config: SafeFrameConfig): PubAdsService;
  setTagForChildDirectedTreatment(childDirectedTreatment: 0 | 1): PubAdsService;
  setTagForUnderAgeOfConsent(underAgeOfConsent: 2 | 0 | 1): PubAdsService;
  setTargeting(key: string, value: string | string[]): PubAdsService;
  setVideoContent(videoContentId: string, videoCmsId: string): void;
  updateCorrelator(): PubAdsService;
}

export type GoogleTag = {
  apiReady: ?boolean,
  cmd: Array<() => void> | CommandArray,
  pubadsReady?: ?boolean,
  companionAds: CompanionAdsService,
  content: ContentService,
  defineOutOfPageSlot: (
    adUnitPath: string,
    opt_div?: string | OutOfPageFormat
  ) => ?Slot,
  defineSlot: (
    adUnitPath: string,
    size: GeneralSize,
    opt_div?: string
  ) => ?Slot,
  defineUnit: (
    adUnitPath: string,
    size: GeneralSize,
    opt_div?: string
  ) => ?Slot,
  destroySlots: (opt_slots?: Slot[]) => boolean,
  disablePublisherConsole: () => void,
  display: (divOrSlot: string | Element | Slot) => void,
  enableServices: () => void,
  getVersion: () => string,
  openConsole: (opt_div?: string) => void,
  pubads: () => PubAdsService,
  setAdIframeTitle: (title: string) => void,
  sizeMapping: () => SizeMappingBuilder
};

export type ViewportSizeMapping = {
  viewport: SingleSizeArray,
  sizes: GeneralSize
};

export type ImpressionViewableEventCallbackType = (
  event: ImpressionViewableEvent
) => void;
export type SlotOnloadEventCallbackType = (event: SlotOnloadEvent) => void;
export type SlotRenderEndedEventCallbackType = (
  event: SlotRenderEndedEvent
) => void;
export type SlotRequestedEventCallbackType = (
  event: SlotRequestedEvent
) => void;
export type SlotResponseReceivedCallbackType = (
  event: SlotResponseReceivedEvent
) => void;
export type SlotVisibilityChangedEventCallbackType = (
  event: SlotVisibilityChangedEvent
) => void;

export { PubAdsService, Slot };

export type AdsSlotRef = {
  current: null | { refreshAds: () => void, displaySlot: () => void }
};

export type TargetingArgumentsType = Map<
  string,
  string | Array<string> | number
>;
