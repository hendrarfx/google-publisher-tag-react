//@flow
import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  GeneralSize,
  ImpressionViewableEvent,
  SlotVisibilityChangedEvent,
  SlotRenderEndedEvent,
  SlotRequestedEvent,
  SlotResponseReceivedEvent,
  SlotOnloadEvent,
  ViewportSizeMapping,
  ImpressionViewableEventCallbackType,
  SlotOnloadEventCallbackType,
  SlotRenderEndedEventCallbackType,
  SlotRequestedEventCallbackType,
  SlotResponseReceivedCallbackType,
  SlotVisibilityChangedEventCallbackType,
  Slot,
  GoogleTag,
  AdsSlotRef
} from "./definition";
import { useGooglePublisherTagProviderContext } from "./GooglePublisherTagProvider";
import { useGPTManagerInstance } from "./GooglePublisherTagManager";

type Props = {
  networkId?: string,
  adUnit: string,
  sizes?: GeneralSize,
  isOutOfPageSlot?: boolean,
  sizeMapping?: Array<ViewportSizeMapping>,
  targetingArguments?: Map<string, string | Array<string>>,
  onImpressionViewable?: ImpressionViewableEventCallbackType,
  onSlotOnload?: SlotOnloadEventCallbackType,
  onSlotRenderEnded?: SlotRenderEndedEventCallbackType,
  onSlotRequested?: SlotRequestedEventCallbackType,
  onSlotResponseReceived?: SlotResponseReceivedCallbackType,
  onSlotVisibilityChanged?: SlotVisibilityChangedEventCallbackType,
  slotId?: string,
  forwardRef?: AdsSlotRef
};

// eslint-disable-next-line react/display-name
const AdsSlot = (props: Props) => {
  const ref = React.useRef(null);
  const [slotId, setSlotId] = React.useState<string>("");
  const [empty, setEmpty] = React.useState<boolean>(false);
  const [slot, setSlot] = React.useState<?Slot>(null);

  const [divInjectSuccess, setDivInjectSuccess] = React.useState<boolean>(
    false
  );

  const [
    subscribeSlotToProvider,
    setSubscribeSlotToProvider
  ] = React.useState<boolean>(false);

  const {
    onImpressionViewable,
    onSlotOnload,
    onSlotRenderEnded,
    onSlotRequested,
    onSlotResponseReceived,
    onSlotVisibilityChanged
  } = props;

  const providerContext = useGooglePublisherTagProviderContext();
  const gptManager = useGPTManagerInstance();
  const impressionViewableCallback = React.useCallback(
    (event: ImpressionViewableEvent) => {
      if (event.slot.getSlotElementId() === slotId) {
        onImpressionViewable && onImpressionViewable(event);
      }
    },
    [onImpressionViewable, slotId]
  );
  const slotOnloadCallback = React.useCallback(
    (event: SlotOnloadEvent) => {
      if (event.slot.getSlotElementId() === slotId) {
        onSlotOnload && onSlotOnload(event);
      }
    },
    [onSlotOnload, slotId]
  );

  const slotRenderEndedCallback = React.useCallback(
    (event: SlotRenderEndedEvent) => {
      if (event.slot.getSlotElementId() === slotId) {
        setEmpty(Boolean(event.creativeId));
        onSlotRenderEnded && onSlotRenderEnded(event);
      }
    },
    [onSlotRenderEnded, slotId]
  );

  const slotRequestedCallback = React.useCallback(
    (event: SlotRequestedEvent) => {
      if (event.slot.getSlotElementId() === slotId) {
        setSlot(event.slot);
        onSlotRequested && onSlotRequested(event);
      }
    },
    [onSlotRequested, slotId]
  );
  const slotResponseReceivedCallback = React.useCallback(
    (event: SlotResponseReceivedEvent) => {
      if (event.slot.getSlotElementId() === slotId) {
        onSlotResponseReceived && onSlotResponseReceived(event);
      }
    },
    [onSlotResponseReceived, slotId]
  );
  const slotVisibilityChangedCallback = React.useCallback(
    (event: SlotVisibilityChangedEvent) => {
      if (event.slot.getSlotElementId() === slotId) {
        onSlotVisibilityChanged && onSlotVisibilityChanged(event);
      }
    },
    [onSlotVisibilityChanged, slotId]
  );

  const refreshAds = React.useCallback(() => {
    const window = global.window;
    const googletag: ?GoogleTag = window && window.googletag;
    if (googletag && googletag.apiReady && slot) {
      googletag.pubads().refresh([slot]);
    }
  }, [slot]);

  const displayAds = React.useCallback(() => {
    gptManager.displaySingleSlot(slotId);
  }, [slotId, gptManager]);

  React.useEffect(() => {
    if (!subscribeSlotToProvider) {
      const uuid = props.slotId ? props.slotId : `${uuidv4()}`;
      setSlotId(uuid);
      providerContext.subscribeNewSlot(uuid);
      setSubscribeSlotToProvider(true);
    }
    if (
      providerContext.initialitationPhaseDone &&
      slotId &&
      subscribeSlotToProvider
    ) {
      gptManager.registerSlot({
        slotId: props.slotId ? props.slotId : slotId,
        networkId: props.networkId
          ? props.networkId
          : providerContext.networkId,
        adUnit: props.adUnit,
        size: props.sizes,
        isOutOfPageSlot: props.isOutOfPageSlot,
        sizeMapping: props.sizeMapping,
        targetingArguments: props.targetingArguments,
        shouldRefresh: false,
        loaded: false
      });
      gptManager.subscribeImpressionViewableEventListener(
        impressionViewableCallback
      );
      gptManager.subscribeSlotOnloadEventListener(slotOnloadCallback);
      gptManager.subscribeSlotRenderEndedEventListener(slotRenderEndedCallback);
      gptManager.subscribeSlotRequestedEventListener(slotRequestedCallback);
      gptManager.subscribeSlotResponseReceivedEventListener(
        slotResponseReceivedCallback
      );
      gptManager.subscribeSlotVisibilityChangedEventListener(
        slotVisibilityChangedCallback
      );
    }
    return () => {
      if (
        providerContext.initialitationPhaseDone &&
        slotId &&
        subscribeSlotToProvider
      ) {
        gptManager.unregisterSlot(slotId);
        gptManager.unsubscribeImpressionViewableEventListener(
          impressionViewableCallback
        );
        gptManager.unsubscribeSlotOnloadEventListener(slotOnloadCallback);
        gptManager.unsubscribeSlotRenderEndedEventListener(
          slotRenderEndedCallback
        );
        gptManager.unsubscribeSlotRequestedEventListener(slotRequestedCallback);
        gptManager.unsubscribeSlotResponseReceivedEventListener(
          slotResponseReceivedCallback
        );
        gptManager.unsubscribeSlotVisibilityChangedEventListener(
          slotVisibilityChangedCallback
        );
      }
    };
  }, [
    providerContext.initialitationPhaseDone,
    slotId,
    subscribeSlotToProvider
  ]);

  React.useImperativeHandle(props.forwardRef, () => ({
    refreshAds: () => {
      refreshAds();
    },
    displaySlot: () => {
      displayAds();
    }
  }));

  React.useEffect(() => {
    if (slotId && !divInjectSuccess && ref?.current?.children) {
      setDivInjectSuccess(true);
    }
  }, [divInjectSuccess, ref, slotId]);

  return !empty ? <div id={slotId} ref={ref}></div> : <div id={slotId} />;
};

export default (React.forwardRef<Props, AdsSlotRef>((props, ref) => (
  // $FlowFixMe
  <AdsSlot forwardRef={ref} {...props} />
)): React$AbstractComponent<Props, AdsSlotRef>);
