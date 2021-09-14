//@flow
import react from "react";
import * as React from "react";
import { useGPTManagerInstance } from "./GooglePublisherTagManager";
import type { ViewportSizeMapping } from "./definition";

type GooglePublisherTagContextType = {
  networkId: string,
  subscribeNewSlot: (slotId: string) => void
};

type Props = {
  networkId: string,
  children: React.Node,
  disableInitialLoad?: boolean,
  enableCollapseEmptyDivs?: boolean,
  enableCookieOption?: boolean,
  enablePersonalizeAds?: boolean,
  enableLazyLoad?: boolean,
  enableSingleRequest?: boolean,
  enableLoadLimitedAdsSDK?: boolean,
  enableLoadSDKScriptByPromise?: boolean,
  targetingArguments?: Map<string, string | Array<string>>,
  adSenseAttributes?: Map<string, string | Array<string>>,
  sizeMapping?: Array<ViewportSizeMapping>
};

const GooglePublisherTagInitialContext = {
  networkId: "12345678",
  subscribeNewSlot: () => {}
};

const GooglePublisherTagContext = React.createContext<GooglePublisherTagContextType>(
  GooglePublisherTagInitialContext
);

export const useGooglePublisherTagProviderContext = (): GooglePublisherTagContextType =>
  React.useContext(GooglePublisherTagContext);

const slots = new Set();

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
  const [
    subsbcribeListenerDone,
    setSubsbcribeListenerDone
  ] = React.useState<boolean>(false);
  const gptManager = useGPTManagerInstance();

  const setConfigToManager = React.useCallback(() => {
    gptManager.setConfig({
      enableLazyLoad: props.enableLazyLoad,
      enableCookieOption: props.enableCookieOption,
      enableSingleRequest: props.enableSingleRequest,
      enablePersonalizeAds: props.enablePersonalizeAds,
      enableCollapseEmptyDivs: props.enableCollapseEmptyDivs,
      disableInitialLoad: props.disableInitialLoad,
      targetingArguments: props.targetingArguments
    });
  }, [props, gptManager]);

  const subscribeNewSlot = React.useCallback((slotId: string) => {
    slots.add(slotId);
  }, []);

  const loadRegisteredAdsSlot = React.useCallback(
    (object: { slotId: string }) => {
      console.log(">> load register ads slot callback fired");
    },
    []
  );

  //step 1: when provider mounted, it will load gpt sdk and set config to manager
  React.useEffect(() => {
    gptManager.loadSDK(
      !!enableLoadSDKScriptByPromise,
      !!enableLoadLimitedAdsSDK
    );
    setConfigToManager();
  }, []);

  //step 2: when googletag ready, it will subscribe register listener to hear all child slot
  React.useEffect(() => {
    if (window.googletag && !subsbcribeListenerDone) {
      gptManager.subscribeRegisterSlotListener(loadRegisteredAdsSlot);
      setSubsbcribeListenerDone(true);
    }

    return () => {
      if (subsbcribeListenerDone) {
        gptManager.unSubscribeRegisterSlotListener(loadRegisteredAdsSlot);
        setSubsbcribeListenerDone(false);
      }
    };
  }, [gptManager, loadRegisteredAdsSlot, subsbcribeListenerDone]);

  return (
    <GooglePublisherTagContext.Provider
      value={{
        networkId,
        subscribeNewSlot
      }}
    >
      <React.Fragment>{children}</React.Fragment>
    </GooglePublisherTagContext.Provider>
  );
};

export default GooglePublisherTagProvider;
