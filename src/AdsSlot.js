/* eslint-disable sonarjs/cognitive-complexity */
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
  AdsSlotRef,
  TargetingArgumentsType
} from "./definition";
import { useGooglePublisherTagProviderContext } from "./GooglePublisherTagProvider";
import { useGPTManagerInstance } from "./GooglePublisherTagManager";

type Props = {
  networkId?: string,
  adUnit: string,
  sizes?: GeneralSize,
  isOutOfPageSlot?: boolean,
  sizeMapping?: Array<ViewportSizeMapping>,
  targetingArguments?: TargetingArgumentsType,
  onImpressionViewable?: ImpressionViewableEventCallbackType,
  onSlotOnload?: SlotOnloadEventCallbackType,
  onSlotRenderEnded?: SlotRenderEndedEventCallbackType,
  onSlotRequested?: SlotRequestedEventCallbackType,
  onSlotResponseReceived?: SlotResponseReceivedCallbackType,
  onSlotVisibilityChanged?: SlotVisibilityChangedEventCallbackType,
  slotId?: string,
  forwardRef?: AdsSlotRef,
  disableRenderDiv?: boolean
};

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
        gptManager.updateRegisterSlotList(slotId, "impressionViewable", event);
        onImpressionViewable && onImpressionViewable(event);
      }
    },
    [onImpressionViewable, slotId, gptManager]
  );
  const slotOnloadCallback = React.useCallback(
    (event: SlotOnloadEvent) => {
      if (event.slot.getSlotElementId() === slotId) {
        gptManager.updateRegisterSlotList(slotId, "slotOnload", event);
        onSlotOnload && onSlotOnload(event);
      }
    },
    [onSlotOnload, slotId, gptManager]
  );

  const slotRenderEndedCallback = React.useCallback(
    (event: SlotRenderEndedEvent) => {
      if (event.slot.getSlotElementId() === slotId) {
        gptManager.updateRegisterSlotList(slotId, "slotRenderEnded", event);
        setEmpty(Boolean(event.creativeId));
        onSlotRenderEnded && onSlotRenderEnded(event);
      }
    },
    [onSlotRenderEnded, slotId, gptManager]
  );

  const slotRequestedCallback = React.useCallback(
    (event: SlotRequestedEvent) => {
      if (event.slot.getSlotElementId() === slotId) {
        gptManager.updateRegisterSlotList(slotId, "slotRequested", event);
        setSlot(event.slot);
        onSlotRequested && onSlotRequested(event);
      }
    },
    [onSlotRequested, slotId, gptManager]
  );
  const slotResponseReceivedCallback = React.useCallback(
    (event: SlotResponseReceivedEvent) => {
      if (event.slot.getSlotElementId() === slotId) {
        gptManager.updateRegisterSlotList(
          slotId,
          "slotResponseReceived",
          event
        );
        onSlotResponseReceived && onSlotResponseReceived(event);
      }
    },
    [onSlotResponseReceived, slotId, gptManager]
  );
  const slotVisibilityChangedCallback = React.useCallback(
    (event: SlotVisibilityChangedEvent) => {
      if (event.slot.getSlotElementId() === slotId) {
        gptManager.updateRegisterSlotList(
          slotId,
          "slotVisibilityChanged",
          event
        );
        onSlotVisibilityChanged && onSlotVisibilityChanged(event);
      }
    },
    [onSlotVisibilityChanged, slotId, gptManager]
  );

  const refreshAds = React.useCallback(() => {
    gptManager.refreshSingleSlot(slotId, props.targetingArguments);
  }, [slotId, gptManager, props.targetingArguments]);

  const displayAds = React.useCallback(() => {
    gptManager.displaySingleSlot(slotId);
  }, [slotId, gptManager]);

  React.useEffect(() => {
    if (!subscribeSlotToProvider) {
      const uniqueId = props.slotId
        ? props.slotId
        : `${props.adUnit}-${uuidv4()}`;
      setSlotId(uniqueId);

      setSubscribeSlotToProvider(true);
    }
    if (
      providerContext.initialitationPhaseDone &&
      slotId &&
      subscribeSlotToProvider
    ) {
      const object = {
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
        loaded: false,
        event: {
          impressionViewable: null,
          slotRequested: null,
          slotOnload: null,
          slotRenderEnded: null,
          slotResponseReceived: null,
          slotVisibilityChanged: null
        }
      };
      providerContext.subscribeNewSlot(slotId, object);
      gptManager.registerSlot(object);

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
        slot &&
        subscribeSlotToProvider
      ) {
        gptManager.unregisterSlot(slotId, slot);
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

  return props.disableRenderDiv ? null : !empty ? (
    <div id={slotId} data-qa-id="adBox" ref={ref}></div>
  ) : (
    <div id={slotId} data-qa-id="adBox" />
  );
};

export default (React.forwardRef<Props, AdsSlotRef>((props, ref) => (
  // $FlowFixMe
  <AdsSlot forwardRef={ref} {...props} />
)): React$AbstractComponent<Props, AdsSlotRef>);
