//@flow
import * as React from "react";
import { useGPTManagerInstance } from "./GooglePublisherTagManager";

type GooglePublisherTagContextType = {
  networkId: string,
  subscribeNewSlot: (slotId: string) => void,
  initialitationPhaseDone?: boolean,
  adBlockEnabled?: boolean
};

const googleAdUrl: string = `https://securepubads.g.doubleclick.net/pagead/ppub_config?ippd=${window.location}`;

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
  targetingArguments?: Map<string, string | Array<string>>,
  adSenseAttributes?: Map<string, string | Array<string>>,
  disablePublisherConsole?: boolean
};

const GooglePublisherTagInitialContext = {
  networkId: "12345678",
  subscribeNewSlot: () => {},
  initialitationPhaseDone: false
};

const GooglePublisherTagContext = React.createContext<GooglePublisherTagContextType>(
  GooglePublisherTagInitialContext
);

export const useGooglePublisherTagProviderContext = (): GooglePublisherTagContextType =>
  React.useContext(GooglePublisherTagContext);

const slots = new Set([]);

const GooglePublisherTagProvider = (
  props: Props
): React$Element<
  React$ComponentType<{
    children?: React$Node,
    value: GooglePublisherTagContextType,
    ...
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

  const subscribeNewSlot = React.useCallback((slotId: string) => {
    slots.add(slotId);
  }, []);

  const loadRegisteredAdsSlot = React.useCallback(() => {
    if (gptManager.registeredSlotsList.size >= slots.size && !adBlockEnabled) {
      gptManager.loadAds();
    }
  }, [gptManager, adBlockEnabled]);

  const detectAdBlock = React.useCallback(async () => {
    try {
      await fetch(new Request(googleAdUrl)).catch(e => {
        setAdBlockEnabled(true);
      });
    } catch (e) {
      setAdBlockEnabled(true);
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
      gptManager.registeredSlotsList.size > 0
    ) {
      // handle window.googletag is not ready but initialitation is done
      initialitationPhase();
      setTimeout(() => {
        loadRegisteredAdsSlot();
      }, 500);
    }
    return () => {
      if (initialitationDone && gptManager.registeredSlotsList.size > 0) {
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

export default GooglePublisherTagProvider;
