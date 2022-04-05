//@flow
import * as React from "react";
import { useGPTManagerInstance } from "./GooglePublisherTagManager";
import type { GoogleTag, TargetingArgumentsType } from "./definition";

type GooglePublisherTagContextType = {
  networkId: string,
  subscribeNewSlot: (slotId: string, object: any) => void,
  initialitationPhaseDone?: boolean,
  adBlockEnabled?: boolean
};

type Props = {
  networkId: string,
  children: React.Node,
  disableInitialLoad?: boolean,
  enableCollapseEmptyDivs?: boolean,
  enablePersonalizeAds?: boolean,
  enableLazyLoad?: boolean,
  enableSingleRequest?: boolean,
  enableLoadLimitedAdsSDK?: boolean,
  enableLoadSDKScriptByPromise?: boolean,
  targetingArguments?: TargetingArgumentsType,
  adSenseAttributes?: TargetingArgumentsType,
  disablePublisherConsole?: boolean
};

const GooglePublisherTagInitialContext = {
  networkId: "12345678",
  subscribeNewSlot: (slotId: string, object: any) => {},
  initialitationPhaseDone: false
};

const GooglePublisherTagContext = React.createContext<GooglePublisherTagContextType>(
  GooglePublisherTagInitialContext
);

export const useGooglePublisherTagProviderContext = (): GooglePublisherTagContextType =>
  React.useContext(GooglePublisherTagContext);

const slots = new Map([]);

const GooglePublisherTagProvider2 = (
  props: Props
): React$Element<
  React$ComponentType<{
    children?: React$Node,
    value: GooglePublisherTagContextType
  }>
> => {
  const {
    children,
    networkId,
    enableLoadSDKScriptByPromise,
    enableLoadLimitedAdsSDK
  } = props;

  const [initialitationDone, setInitialitationDone] = React.useState<boolean>(
    false
  );
  const [adBlockEnabled, setAdBlockEnabled] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const gptManager = useGPTManagerInstance();

  const setConfigToManager = React.useCallback(() => {
    gptManager.setConfig({
      enableLazyLoad: props.enableLazyLoad,
      enableSingleRequest: props.enableSingleRequest,
      enablePersonalizeAds: props.enablePersonalizeAds,
      enableCollapseEmptyDivs: props.enableCollapseEmptyDivs,
      disableInitialLoad: props.disableInitialLoad,
      targetingArguments: props.targetingArguments,
      disablePublisherConsole: props.disablePublisherConsole
    });
  }, [props, gptManager]);

  const subscribeNewSlot = React.useCallback((slotId: string, object: any) => {
    slots.set(slotId, object);
  }, []);

  const loadRegisteredAdsSlot = React.useCallback(() => {
    const registeredSlotList = gptManager.getRegisteredSlotList();

    if (registeredSlotList.size >= slots.size && !adBlockEnabled && !loading) {
      setLoading(true);
      gptManager.loadAds().then(() => {
        setLoading(false);
      });
    } else if (registeredSlotList.size !== slots.size) {
      //for some unknown reason, slot is not registered , although subscribe is success. To prevent that, slot must registeref again to manager
      slots.forEach(slot => {
        gptManager.registerSlot(slot);
      });
    }
  }, [gptManager, adBlockEnabled, loading]);

  const detectAdBlock = React.useCallback(async () => {
    try {
      const googletag: ?GoogleTag = gptManager.getGoogletag();
      setAdBlockEnabled(!!googletag?.apiReady);
      return googletag ? googletag.apiReady : true;
    } catch (e) {
      return true;
    }
  }, []);

  const initialitationPhase = React.useCallback(() => {
    setConfigToManager();
    gptManager.loadSDK(
      !!enableLoadSDKScriptByPromise,
      !!enableLoadLimitedAdsSDK
    );
    gptManager.subscribeRegisterSlotListener(loadRegisteredAdsSlot);
    setInitialitationDone(true);
  }, []);

  //step 1: when provider mounted, it will load gpt sdk and set config to manager
  React.useEffect(() => {
    if (!initialitationDone) {
      detectAdBlock();
      initialitationPhase();
    } else if (
      window &&
      initialitationDone &&
      !window.googletag.apiReady &&
      gptManager.getRegisteredSlotList().size > 0
    ) {
      // handle window.googletag is not ready but initialitation is done
      initialitationPhase();
      setTimeout(() => {
        loadRegisteredAdsSlot();
      }, 500);
    }
    return () => {
      if (initialitationDone && gptManager.getRegisteredSlotList().size > 0) {
        gptManager.unregisterAllSlot();
      }
    };
  }, [initialitationDone]);

  return (
    <GooglePublisherTagContext.Provider
      value={{
        networkId,
        subscribeNewSlot,
        initialitationPhaseDone: initialitationDone,
        adBlockEnabled
      }}
    >
      <React.Fragment>{children}</React.Fragment>
    </GooglePublisherTagContext.Provider>
  );
};

export default GooglePublisherTagProvider2;
