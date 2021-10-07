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
  ViewportSizeMapping
} from "./definition";
import { loadGPTScript } from "./utils";

type GlobalConfigAds = {
  enablePersonalizeAds?: boolean,
  enableLazyLoad?: boolean,
  enableSingleRequest?: boolean,
  targetingArguments?: Map<string, string | Array<string>>,
  disableInitialLoad?: boolean,
  enableCollapseEmptyDivs?: boolean
};

type GeneralSlotType = {
  slotId: string,
  networkId: string,
  adUnit: string,
  size: GeneralSize,
  isOutOfPageSlot?: boolean,
  outOfPageFormat?: string | OutOfPageFormat,
  sizeMapping?: Array<ViewportSizeMapping>,
  adSenseAttributes?: Map<string, string | Array<string>>,
  targetingArguments?: Map<string, string | Array<string>>,
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
  globalTargetingArguments: Map<string, string | Array<string>> = new Map();
  singleRequestEnabled: boolean = true;
  registeredSlotsList: Map<string, GeneralSlotType> = new Map();
  disableInitialLoad: boolean = false;
  enableCollapseEmptyDivs: boolean = false;
  disablePublisherConsole: boolean = false;

  constructor() {
    this.emitter = new EventEmitter().setMaxListeners(1);
  }

  static createInstance: () => GooglePublisherTagManager = () => {
    var object = new GooglePublisherTagManager();
    return object;
  };

  static getInstance: () => GooglePublisherTagManager = () => {
    if (!GooglePublisherTagManager.instance) {
      GooglePublisherTagManager.instance = GooglePublisherTagManager.createInstance();
    }
    return GooglePublisherTagManager.instance;
  };

  //methods
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
    if (!window.googletag && enableLoadSDKScriptByPromise) {
      loadGPTScript(enableLoadLimitedAdsSDK).then(googletag => {
        this.registerEventListener(googletag);
      });
    } else {
      this.registerEventListener(window.googletag);
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
      this.emitter.emit("registerSlotListener", { slotId: slot.slotId });
    }
  };

  unregisterSlot: (slotId: string) => void = (slotId: string) => {
    this.destroyGPTSlots([slotId]);
    this.registeredSlotsList.delete(slotId);
  };

  unregisterAllSlot: () => void = () => {
    this.destroyGPTSlots([...this.registeredSlotsList.keys()]);
    this.registeredSlotsList.clear();
  };

  destroyGPTSlots: (slotIds: Array<string>) => Promise<mixed> = (
    slotIds: Array<string>
  ) => {
    const googletag = window.googletag;
    return new Promise((resolve, reject) => {
      if (googletag?.apiReady && slotIds.length > 0) {
        googletag.cmd.push(() => {
          googletag.destroySlots(slotIds);
          resolve(slotIds);
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
        pubadsService.setTargeting(key, value);
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

  loadAds: () => Promise<mixed> = () => {
    return new Promise(resolve => {
      const googletag: ?GoogleTag = window.googletag;

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
                : googletag.defineSlot(adUnit, ads.size, ads.slotId);

              if (definedSlot) {
                ads.targetingArguments &&
                  ads.targetingArguments.forEach((value, key) => {
                    definedSlot.setTargeting(key, value);
                  });

                if (ads.sizeMapping && ads.sizeMapping.length > 0) {
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
      console.log("error", error);
    });
  };

  displayRegisteredAds: () => void = () => {
    const googletag: ?GoogleTag = window.googletag;
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
    const googletag: ?GoogleTag = window.googletag;
    if (googletag && googletag.apiReady) {
      const filteredSlot = [];

      googletag.cmd.push(() => {
        this.registeredSlotsList.forEach(slot => {
          if (!slot.loaded && slot.slot && slot.slotId === slotId) {
            filteredSlot.push(slot.slot);
            googletag.display(slot.slotId);
            slot.loaded = true;
          }
        });
      });
      googletag.pubads().refresh(filteredSlot);
    }
  };

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
