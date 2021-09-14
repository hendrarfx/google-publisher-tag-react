//@flow
import EventEmitter from "events";
import type {
  ImpressionViewableEvent,
  SlotVisibilityChangedEvent,
  SlotRenderEndedEvent,
  GoogleTag,
  PubAdsService,
  GeneralSize,
  Slot,
  OutOfPageFormat,
  ViewportSizeMapping
} from "./definition";
import { loadGPTScript } from "./utils";

//This is a singleton class that will provide all function related to googletag

type GlobalConfigAds = {
  enablePersonalizeAds?: boolean,
  enableCookieOption?: boolean,
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
  loading?: boolean,
  slot?: ?Slot
};

class GooglePublisherTagManager extends EventEmitter {
  static instance: ?GooglePublisherTagManager = null;
  enablePersonalizeAds: boolean = false;
  enableCookieOption: boolean = false;
  enableLazyLoad: boolean = false;
  enableSingleRequest: boolean = true;
  globalTargetingArguments: Map<string, string | Array<string>> = new Map();
  singleRequestEnabled: boolean = true;
  registeredSlots: { [string]: GeneralSlotType } = {};
  disableInitialLoad: boolean = false;
  enableCollapseEmptyDivs: boolean = false;

  //methods
  registerEventListener: (googletag: ?GoogleTag) => void = (
    googletag: ?GoogleTag
  ) => {
    if (googletag && googletag.apiReady) {
      googletag.cmd.push(() => {
        const pubadsService: PubAdsService = googletag.pubads();

        pubadsService.addEventListener(
          "slotRenderEnded",
          (event: SlotRenderEndedEvent) => {
            const slotId = event.slot.getSlotElementId();
            this.emit("slotRenderEnded", { slotId, event });
          }
        );

        pubadsService.addEventListener(
          "impressionViewable",
          (event: ImpressionViewableEvent) => {
            const slotId = event.slot.getSlotElementId();
            this.emit("impressionViewable", { slotId, event });
          }
        );

        pubadsService.addEventListener(
          "slotVisibilityChanged",
          (event: SlotVisibilityChangedEvent) => {
            const slotId = event.slot.getSlotElementId();
            this.emit("slotVisibilityChanged", { slotId, event });
          }
        );

        pubadsService.setRequestNonPersonalizedAds(
          this.enablePersonalizeAds ? 0 : 1
        );

        pubadsService.setCookieOptions(this.enableCookieOption ? 0 : 1);
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

  //config global GPT
  printConfig: () => void = () => {
    console.log(`>> print config`, {
      enableCookieOption: this.enableCookieOption,
      enablePersonalizeAds: this.enablePersonalizeAds,
      enableLazyLoad: this.enableLazyLoad,
      enableSingleRequest: this.enableSingleRequest,
      disableInitialLoad: this.disableInitialLoad,
      globalTargetingArguments: this.globalTargetingArguments,
      enableCollapseEmptyDivs: this.enableCollapseEmptyDivs
    });
  };

  setConfig: (config: GlobalConfigAds) => void = (config: GlobalConfigAds) => {
    this.enableCookieOption = !!config.enableCookieOption;
    this.enablePersonalizeAds = !!config.enablePersonalizeAds;
    this.enableLazyLoad = !!config.enableCookieOption;
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
    console.log(">> gpt manager >> register slot");
    if (!this.registeredSlots[slot.slotId]) {
      this.registeredSlots[slot.slotId] = {
        ...slot,
        loading: false
      };

      this.emit("registerSlot", { slotId: slot.slotId });
    }
  };

  unregisterSlot: (slotId: string) => void = (slotId: string) => {
    this.destroyGPTSlots([slotId]);
    delete this.registeredSlots[slotId];
  };

  unregisterAllSlot: () => void = () => {
    const slotWillBeDestroyed = Object.keys(this.registeredSlots);
    this.destroyGPTSlots(slotWillBeDestroyed);
    this.registeredSlots = {};
  };

  destroyGPTSlots: (slotIds: Array<string>) => Promise<mixed> = (
    slotIds: Array<string>
  ) => {
    return new Promise(resolve => {
      if (window.googletag && slotIds.length > 0) {
        window.googletag.cmd.push(() => {
          window.googletag.destroySlots(slotIds);
          resolve(slotIds);
        });
      }
    });
  };

  //Load Advertisement
  loadAds: (adsToLoad: Array<GeneralSlotType>) => Promise<mixed> = (
    adsToLoad: Array<GeneralSlotType>
  ) => {
    return new Promise(resolve => {
      const googletag: ?GoogleTag = window.googletag;
      if (googletag && googletag.apiReady && adsToLoad.length > 0) {
        googletag.cmd.push(() => {
          adsToLoad.forEach(ads => {
            const slot = this.registeredSlots[ads.slotId];
            const definedSlot = slot.isOutOfPageSlot
              ? googletag.defineOutOfPageSlot(slot.adUnit, slot.slotId)
              : googletag.defineSlot(slot.adUnit, slot.size, slot.slotId);
            if (definedSlot) {
              slot.targetingArguments &&
                slot.targetingArguments.forEach((key, value) => {
                  definedSlot.setTargeting(`${value}`, key);
                });

              if (slot.sizeMapping && slot.sizeMapping.length > 0) {
                let sizeMappingBuilder = googletag.sizeMapping();
                slot.sizeMapping?.forEach(value => {
                  sizeMappingBuilder = sizeMappingBuilder.addSize(
                    value.viewport,
                    value.sizes
                  );
                });
                definedSlot.defineSizeMapping(sizeMappingBuilder.build());
              }
              slot.slot = definedSlot;
              this.registeredSlots[slot.slotId].slot = definedSlot;
            }
          });
        });

        this.configurePubAdsServiceOptions(googletag);

        googletag.cmd.push(() => {
          googletag.enableServices();
          adsToLoad.forEach(slot => {
            googletag.display(slot.slotId);
          });
          resolve();
        });
      }
    });
  };

  //targeting argument setter
  configurePubAdsServiceOptions: (googletag: GoogleTag) => void = (
    googletag: GoogleTag
  ) => {
    googletag.cmd.push(() => {
      const pubadsService = googletag.pubads();

      //configure initial load
      this.disableInitialLoad && pubadsService.disableInitialLoad();

      //configure global targeting argument
      this.globalTargetingArguments.forEach((key, value) => {
        pubadsService.setTargeting(value, key);
      });

      //confugure ads sense targeting argument
      //do something

      //configure cookie option
      pubadsService.setCookieOptions(this.enableCookieOption ? 0 : 1);

      //configure SRA
      this.enableSingleRequest && pubadsService.enableSingleRequest();

      //collapse div when ads is empty
      pubadsService.collapseEmptyDivs(this.enableCollapseEmptyDivs);
    });
  };

  //
  // subscribe & unsub listener method
  //

  subscribeRegisterSlotListener: (
    event: (object: { slotId: string }) => void
  ) => void = (event: (object: { slotId: string }) => void) => {
    this.on("registerSlot", event);
  };

  unSubscribeRegisterSlotListener: (
    event: (object: { slotId: string }) => void
  ) => void = (event: (object: { slotId: string }) => void) => {
    this.on("registerSlot", event);
  };

  unSubscribeSlotRenderEndedListener: (event: () => void) => void = (
    event: () => void
  ) => {
    this.removeListener("slotRenderEnded", event);
  };

  subscribeSlotVisibilityChangedListener: (event: () => void) => void = (
    event: () => void
  ) => {
    this.on("slotVisibilityChanged", event);
  };

  unSubscribeSlotVisibilityChangedListener: (event: () => void) => void = (
    event: () => void
  ) => {
    this.removeListener("slotVisibilityChanged", event);
  };

  subscribeSlotIsViewableListener: (event: () => void) => void = (
    event: () => void
  ) => {
    this.on("slotVisibilityChanged", event);
  };

  unSubscribeSlotIsViewableListener: (event: () => void) => void = (
    event: () => void
  ) => {
    this.removeListener("slotVisibilityChanged", event);
  };
}

export const useGPTManagerInstance = (): GooglePublisherTagManager =>
  Object.assign(new GooglePublisherTagManager().setMaxListeners(0));

export default GooglePublisherTagManager;
