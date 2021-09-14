//@flow
import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  GeneralSize,
  SlotRenderEndedEvent,
  SlotRequestedEvent,
  SlotResponseReceived,
  SlotVisibilityChangedEvent,
  ViewportSizeMapping
} from "./definition";
import { useGooglePublisherTagProviderContext } from "./GooglePublisherTagProvider";
import { useGPTManagerInstance } from "./GooglePublisherTagManager";

type Props = {
  dfpNetworkId?: string,
  adUnit: string,
  sizes: GeneralSize,
  isOutOfPageSlot?: boolean,
  sizeMapping?: Array<ViewportSizeMapping>,
  adSenseAttributes?: Map<string, string | Array<string>>,
  targetingArguments?: Map<string, string | Array<string>>,
  onSlotRender?: (event: SlotRenderEndedEvent) => void,
  onSlotRegister?: (event: SlotRequestedEvent) => void,
  onSlotIsViewable?: (event: SlotResponseReceived) => void,
  onSlotVisibilityChanged?: (event: SlotVisibilityChangedEvent) => void,
  shouldRefresh?: boolean,
  slotId?: string,
  className?: string
};

const style = {
  width: "200px",
  height: "200px",
  padding: "20px",
  border: "thin solid black",
  background: "#ccc",
  marginBottom: "16px"
};

const AdsSlot = (props: Props): React$Element<"div"> => {
  const [slotId, setSlotId] = React.useState<string>("");

  const providerContext = useGooglePublisherTagProviderContext();
  const gptManager = useGPTManagerInstance();

  React.useEffect(() => {
    const uuid = `${uuidv4()}`;
    setSlotId(uuid);
    providerContext.subscribeNewSlot(uuid);
    gptManager.registerSlot({
      slotId: uuid,
      networkId: providerContext.networkId,
      adUnit: props.adUnit,
      size: props.sizes,
      isOutOfPageSlot: props.isOutOfPageSlot,
      sizeMapping: props.sizeMapping,
      targetingArguments: props.targetingArguments,
      shouldRefresh: false
    });
  }, []);

  return <div style={style}>{`slot id: ${slotId}`}</div>;
};

export default (React.memo<Props>(AdsSlot): React$AbstractComponent<
  Props,
  mixed
>);
