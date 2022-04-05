//@flow
import EventEmitter from "events";
import type {
  ImpressionViewableEvent,
  SlotVisibilityChangedEvent,
  SlotRenderEndedEvent,
  SlotRequestedEvent,
  SlotResponseReceivedEvent,
  SlotOnloadEvent,
  ImpressionViewableEventCallbackType,
  SlotOnloadEventCallbackType,
  SlotRenderEndedEventCallbackType,
  SlotRequestedEventCallbackType,
  SlotResponseReceivedCallbackType,
  SlotVisibilityChangedEventCallbackType,
  GoogleTag,
  PubAdsService,
  GeneralSize,
  Slot,
  OutOfPageFormat,
  ViewportSizeMapping,
  TargetingArgumentsType
} from "./definition";
import { loadGPTScript } from "./utils";
import { all } from "lodash/fp";

type GlobalConfigAds = {
  enablePersonalizeAds?: boolean,
  enableLazyLoad?: boolean,
  enableSingleRequest?: boolean,
  targetingArguments?: TargetingArgumentsType,
  disableInitialLoad?: boolean,
  enableCollapseEmptyDivs?: boolean
};

type GeneralSlotType = {
  slotId: string,
  networkId: string,
  adUnit: string,
  size?: GeneralSize,
  isOutOfPageSlot?: boolean,
  outOfPageFormat?: string | OutOfPageFormat,
  sizeMapping?: Array<ViewportSizeMapping>,
  adSenseAttributes?: TargetingArgumentsType,
  targetingArguments?: TargetingArgumentsType,
  shouldRefresh?: boolean,
  loaded?: boolean,
  slot?: Slot,
  disableInitialLoad?: boolean
};

type GeneralRegisterSlotListener = (object: { slotId: string }) => void;

//This is a singleton class that will provide all function related to googletag
class GooglePublisherTagManager {
  static instance: ?GooglePublisherTagManager = null;
  emitter: EventEmitter = new EventEmitter();
  enablePersonalizeAds: boolean = false;
  enableLazyLoad: boolean = false;
  enableSingleRequest: boolean = true;
  globalTargetingArguments: TargetingArgumentsType = new Map();
  singleRequestEnabled: boolean = true;
  disableInitialLoad: boolean = false;
  enableCollapseEmptyDivs: boolean = false;
  disablePublisherConsole: boolean = false;
  registeredSlotsList: Map<string, GeneralSlotType> = new Map();

  constructor() {
    this.emitter = new EventEmitter().setMaxListeners(1);
  }

  static createInstance: () => GooglePublisherTagManager = () =>
    new GooglePublisherTagManager();

  static getInstance: () => GooglePublisherTagManager = () => {
    if (!GooglePublisherTagManager.instance) {
      GooglePublisherTagManager.instance = GooglePublisherTagManager.createInstance();
    }
    return GooglePublisherTagManager.instance;
  };

  //methods

  getGoogletag: () => ?GoogleTag = (): ?GoogleTag =>
    typeof window !== "undefined" && window ? window.googletag : null;

  registerEventListener: (googletag: ?GoogleTag) => void = (
    googletag: ?GoogleTag
  ) => {
    if (googletag && googletag.apiReady) {
      googletag.cmd.push(() => {
        const pubadsService: PubAdsService = googletag.pubads();

        pubadsService.addEventListener(
          "impressionViewable",
          (event: ImpressionViewableEvent) => {
            this.emitter.emit("impressionViewableListener", event);
          }
        );

        pubadsService.addEventListener(
          "slotOnload",
          (event: SlotOnloadEvent) => {
            this.emitter.emit("slotOnloadListener", event);
          }
        );

        pubadsService.addEventListener(
          "slotRenderEnded",
          (event: SlotRenderEndedEvent) => {
            this.emitter.emit("slotRenderEndedListener", event);
          }
        );

        pubadsService.addEventListener(
          "slotRequested",
          (event: SlotRequestedEvent) => {
            this.emitter.emit("slotRequestedListener", event);
          }
        );

        pubadsService.addEventListener(
          "slotResponseReceived",
          (event: SlotResponseReceivedEvent) => {
            this.emitter.emit("slotResponseReceivedListener", event);
          }
        );

        pubadsService.addEventListener(
          "slotVisibilityChanged",
          (event: SlotVisibilityChangedEvent) => {
            this.emitter.emit("slotVisibilityChangedListener", event);
          }
        );
      });
    }
  };

  loadSDK: (
    enableLoadSDKScriptByPromise: boolean,
    enableLoadLimitedAdsSDK: boolean
  ) => void = (
    enableLoadSDKScriptByPromise: boolean,
    enableLoadLimitedAdsSDK: boolean
  ) => {
    if (typeof window !== "undefined" && window && window.googletag) {
      const { googletag } = window;
      this.registerEventListener(googletag);
    } else if (enableLoadSDKScriptByPromise) {
      loadGPTScript(enableLoadLimitedAdsSDK).then(googletag => {
        this.registerEventListener(googletag);
      });
    }
  };

  setConfig: (config: GlobalConfigAds) => void = (config: GlobalConfigAds) => {
    this.enablePersonalizeAds = !!config.enablePersonalizeAds;
    this.enableLazyLoad = !!config.enableLazyLoad;
    this.enableSingleRequest = !!config.enableSingleRequest;
    this.disableInitialLoad = !!config.disableInitialLoad;
    this.enableCollapseEmptyDivs = !!config.enableCollapseEmptyDivs;
    !!config.targetingArguments &&
      (this.globalTargetingArguments = config.targetingArguments);
  };

  //
  //register and unreg slot
  //
  registerSlot: (slot: GeneralSlotType) => void = (slot: GeneralSlotType) => {
    if (!this.registeredSlotsList.has(slot.slotId)) {
      this.registeredSlotsList.set(slot.slotId, slot);
      if (typeof window !== "undefined" && window) {
        window.listAds = this.registeredSlotsList;
      }
      this.emitter.emit("registerSlotListener", { slotId: slot.slotId });
    }
  };

  unregisterSlot: (slotId: string, slot: Slot) => void = (
    slotId: string,
    slot: Slot
  ) => {
    this.destroyGPTSlots([slot]);
    this.registeredSlotsList.delete(slotId);
  };

  unregisterAllSlot: () => void = () => {
    const allSlots: Slot[] = [];

    this.registeredSlotsList.forEach(ads => {
      ads.slot && allSlots.push(ads.slot);
    });

    this.destroyGPTSlots(allSlots);
    this.registeredSlotsList.clear();
  };

  destroyGPTSlots: (slots: Array<Slot>) => Promise<mixed> = (
    slots: Array<Slot>
  ) => {
    const googletag = this.getGoogletag();

    return new Promise((resolve, reject) => {
      if (googletag && googletag.apiReady && slots.length > 0) {
        googletag.cmd.push(() => {
          googletag.destroySlots(slots);
          resolve(slots);
        });
      } else {
        reject();
      }
    });
  };

  //Load Advertisement
  definePageLevelSettings: (pubadsService: PubAdsService) => void = (
    pubadsService: PubAdsService
  ) => {
    //configure initial load
    this.disableInitialLoad && pubadsService.disableInitialLoad();

    //configure personalized ads
    pubadsService.setRequestNonPersonalizedAds(
      this.enablePersonalizeAds ? 0 : 1
    );

    //configure global targeting argument
    this.globalTargetingArguments.size > 0 &&
      this.globalTargetingArguments.forEach((value, key) => {
        const val = Array.isArray(value) ? value : `${value}`;
        pubadsService.setTargeting(key, val);
      });

    this.enableLazyLoad &&
      pubadsService.enableLazyLoad({
        fetchMarginPercent: 500, // Fetch slots within 5 viewports.
        renderMarginPercent: 200, // Render slots within 2 viewports.
        mobileScaling: 2.0 // Double the above values on mobile.
      });

    //collapse div when ads is empty
    this.enableCollapseEmptyDivs &&
      pubadsService.collapseEmptyDivs(this.enableCollapseEmptyDivs);
  };

  loadAds: () => Promise<mixed> = () =>
    new Promise(resolve => {
      const googletag: ?GoogleTag = this.getGoogletag();

      if (
        googletag &&
        googletag.apiReady &&
        this.registeredSlotsList.size > 0
      ) {
        googletag.cmd.push(() => {
          const pubadsService = googletag.pubads();

          //disable publsiher console
          this.disablePublisherConsole && googletag.disablePublisherConsole();

          this.definePageLevelSettings(pubadsService);
          this.enableCollapseEmptyDivs &&
            pubadsService.collapseEmptyDivs(this.enableCollapseEmptyDivs);

          this.registeredSlotsList.forEach(ads => {
            if (!ads.loaded) {
              const adUnit = `${ads.networkId}/${ads.adUnit}`;

              const definedSlot = ads.isOutOfPageSlot
                ? googletag.defineOutOfPageSlot(adUnit, ads.slotId)
                : ads.size
                ? googletag.defineSlot(adUnit, ads.size, ads.slotId)
                : null;

              if (definedSlot) {
                ads.targetingArguments &&
                  ads.targetingArguments.forEach((value, key) => {
                    definedSlot.setTargeting(
                      key,
                      Array.isArray(value) ? value : `${value}`
                    );
                  });

                if (
                  !ads.isOutOfPageSlot &&
                  ads.sizeMapping &&
                  ads.sizeMapping.length > 0
                ) {
                  let sizeMappingBuilder = googletag.sizeMapping();
                  ads.sizeMapping?.forEach(value => {
                    sizeMappingBuilder = sizeMappingBuilder.addSize(
                      value.viewport,
                      value.sizes
                    );
                  });
                  definedSlot.defineSizeMapping(sizeMappingBuilder.build());
                }

                definedSlot.addService(pubadsService);
                ads.slot = definedSlot;
              }
            }
          });
          //configure SRA
          this.enableSingleRequest && pubadsService.enableSingleRequest();
        });

        googletag.enableServices();
        //enabling service and display ads
        if (!this.disableInitialLoad) {
          googletag.cmd.push(() => {
            this.registeredSlotsList.forEach(slot => {
              if (!slot.loaded) {
                googletag.display(slot.slotId);
                slot.loaded = true;
              }
            });
          });
        }
        resolve();
      }
    }).catch(error => {
      //console.log('error', error);
    });

  displayRegisteredAds: () => void = () => {
    const googletag: ?GoogleTag =
      typeof window !== "undefined" && window ? window.googletag : null;
    if (googletag && googletag.apiReady) {
      const filteredSlot = [];

      googletag.cmd.push(() => {
        this.registeredSlotsList.forEach(slot => {
          if (!slot.loaded && slot.slot) {
            filteredSlot.push(slot.slot);
            googletag.display(slot.slotId);
            slot.loaded = true;
          }
        });
      });
      googletag.pubads().refresh(filteredSlot);
    }
  };

  displaySingleSlot: (slotId: string) => void = (slotId: string) => {
    const googletag: ?GoogleTag =
      typeof window !== "undefined" && window ? window.googletag : null;
    if (googletag && googletag.apiReady) {
      const filteredSlot: Slot[] = [];

      googletag.cmd.push(() => {
        const slots: ?GeneralSlotType =
          this.registeredSlotsList.get(slotId) || null;

        if (slots && slots.slot) {
          filteredSlot.push(slots.slot);
          googletag.display(slots.slotId);
          slots.loaded = true;
        }
      });

      googletag.pubads().refresh(filteredSlot);
    }
  };

  refreshSingleSlot: (
    slotId: string,
    targetingArguments?: TargetingArgumentsType
  ) => void = (slotId, targetingArguments) => {
    const googletag: ?GoogleTag =
      typeof window !== "undefined" && window ? window.googletag : null;
    const slot = this.registeredSlotsList.get(slotId);
    if (slot && googletag && googletag.apiReady) {
      const definedSlot: ?Slot = slot.slot;
      if (definedSlot) {
        slot.targetingArguments = targetingArguments;
        if (targetingArguments && targetingArguments.size > 0) {
          definedSlot.clearTargeting();
          targetingArguments &&
            // eslint-disable-next-line sonarjs/no-identical-functions
            targetingArguments.forEach((value, key) => {
              definedSlot.setTargeting(
                key,
                Array.isArray(value) ? value : `${value}`
              );
            });
        }

        googletag.pubads().refresh([definedSlot]);
      }
    }
  };

  getRegisteredSlotList: () => Map<string, GeneralSlotType> = () =>
    this.registeredSlotsList;

  //
  // subscribe & unsub listener method
  //

  subscribeRegisterSlotListener: GeneralRegisterSlotListener => void = (
    event: GeneralRegisterSlotListener
  ) => {
    this.emitter.on("registerSlotListener", event);
  };

  unsubscribeRegisterSlotListener: (
    event: GeneralRegisterSlotListener
  ) => void = (event: GeneralRegisterSlotListener) => {
    this.emitter.removeListener("registerSlotListener", event);
  };

  //
  subscribeImpressionViewableEventListener: (
    event: ImpressionViewableEventCallbackType
  ) => void = (event: ImpressionViewableEventCallbackType) => {
    this.emitter.on("impressionViewableListener", event);
  };

  unsubscribeImpressionViewableEventListener: (
    event: ImpressionViewableEventCallbackType
  ) => void = (event: ImpressionViewableEventCallbackType) => {
    this.emitter.removeListener("impressionViewableListener", event);
  };

  //
  subscribeSlotOnloadEventListener: (
    event: SlotOnloadEventCallbackType
  ) => void = (event: SlotOnloadEventCallbackType) => {
    this.emitter.on("slotOnloadListener", event);
  };

  unsubscribeSlotOnloadEventListener: (
    event: SlotOnloadEventCallbackType
  ) => void = (event: SlotOnloadEventCallbackType) => {
    this.emitter.removeListener("slotOnloadListener", event);
  };

  //
  subscribeSlotRenderEndedEventListener: (
    event: SlotRenderEndedEventCallbackType
  ) => void = (event: SlotRenderEndedEventCallbackType) => {
    this.emitter.on("slotRenderEndedListener", event);
  };

  unsubscribeSlotRenderEndedEventListener: (
    event: SlotRenderEndedEventCallbackType
  ) => void = (event: SlotRenderEndedEventCallbackType) => {
    this.emitter.removeListener("slotRenderEndedListener", event);
  };

  //
  subscribeSlotRequestedEventListener: (
    event: SlotRequestedEventCallbackType
  ) => void = (event: SlotRequestedEventCallbackType) => {
    this.emitter.on("slotRequestedListener", event);
  };

  unsubscribeSlotRequestedEventListener: (
    event: SlotRequestedEventCallbackType
  ) => void = (event: SlotRequestedEventCallbackType) => {
    this.emitter.removeListener("slotRequestedListener", event);
  };

  //
  subscribeSlotResponseReceivedEventListener: (
    event: SlotResponseReceivedCallbackType
  ) => void = (event: SlotResponseReceivedCallbackType) => {
    this.emitter.on("slotResponseReceivedListener", event);
  };

  unsubscribeSlotResponseReceivedEventListener: (
    event: SlotResponseReceivedCallbackType
  ) => void = (event: SlotResponseReceivedCallbackType) => {
    this.emitter.removeListener("slotResponseReceivedListener", event);
  };

  //
  subscribeSlotVisibilityChangedEventListener: (
    event: SlotVisibilityChangedEventCallbackType
  ) => void = (event: SlotVisibilityChangedEventCallbackType) => {
    this.emitter.on("slotVisibilityChangedListener", event);
  };

  unsubscribeSlotVisibilityChangedEventListener: (
    event: SlotVisibilityChangedEventCallbackType
  ) => void = (event: SlotVisibilityChangedEventCallbackType) => {
    this.emitter.removeListener("slotVisibilityChangedListener", event);
  };
}

export const useGPTManagerInstance = (): GooglePublisherTagManager =>
  GooglePublisherTagManager.getInstance();

export default GooglePublisherTagManager;
