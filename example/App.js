//@flow
import * as React from "react";
import GooglePublisherTagProvider from "../src/GooglePublisherTagProvider";

import AdsSlot from "../src/AdsSlot";
import type { MultiSize, AdsSlotRef } from "../src/definition";

const gptNetworkId = "175280759";

const size: MultiSize = [
  [970, 90],
  [970, 250]
];

const App = (): React$Element<"div"> => {
  const [openAds, setOpenAds] = React.useState<boolean>(false);
  const adsRef = React.useRef<?AdsSlotRef>({
    current: null
  });

  return (
    <div id="apps">
      <GooglePublisherTagProvider
        networkId={gptNetworkId}
        enableCollapseEmptyDivs
        // enablePersonalizeAds
        enableLazyLoad
        enableSingleRequest
        // disableInitialLoad={disableInitialLoad}
        //targetingArguments={new Map([["topic", ["corona"]]])}
        // disablePublisherConsole
      >
        <div>
          <h1>Test Advertisement</h1>

          <button
            onClick={() => {
              //$FlowFixMe
              if (adsRef?.current?.refreshAds) {
                //$FlowFixMe
                adsRef.current.refreshAds();
              }
            }}
          >
            <span style={{ fontSize: "20pt" }}> refresh Ads</span>
          </button>
          <div
            style={{
              flex: 1,
              flexDirection: "column",
              padding: "16px",
              background: "#efefef",
              margin: "16px"
            }}
          >
            <AdsSlot
              key="ads-1"
              adUnit="kum-testing/ui3-desktop-homepage-billboard"
              sizes={size}
              slotId="billboard-hendra"
              preRenderSize={[970, 90]}
              ref={adsRef}
            />
            <AdsSlot
              key="ads-2"
              adUnit="kum-testing/ui3-desktop-homepage-billboard"
              sizes={size}
              preRenderSize={[970, 90]}
              disableInitialLoad={true}
            />
            <AdsSlot
              key="ads-3"
              adUnit="kum-testing/ui3-desktop-channel"
              sizes={["fluid"]}
              preRenderSize={[970, 150]}
              disableInitialLoad={true}
            />
            <AdsSlot
              key="ads-4"
              adUnit="kum-testing/ui3-desktop-channel"
              sizes={["fluid"]}
              preRenderSize={[970, 150]}
              disableInitialLoad={true}
            />
            <div style={{ margin: 16 }}>
              <button
                onClick={() => {
                  setOpenAds(true);
                  // setTimeout(() => {
                  //   manager.displayRegisteredAds();
                  // }, 500);
                }}
              >
                <span style={{ fontSize: "20pt" }}> Open Next Ads</span>
              </button>
            </div>
            {openAds && (
              <React.Fragment>
                <AdsSlot
                  key="ads-5"
                  adUnit="kum-testing/ui3-desktop-channel"
                  sizes={["fluid"]}
                />
                <AdsSlot
                  key="ads-6"
                  adUnit="kum-testing/ui3-desktop-channel"
                  sizes={["fluid"]}
                />
                <AdsSlot
                  key="ads-7"
                  adUnit="kum-testing/ui3-desktop-channel"
                  sizes={["fluid"]}
                />
                <AdsSlot
                  key="ads-5"
                  adUnit="kum-testing/ui3-desktop-channel"
                  sizes={["fluid"]}
                />
                <AdsSlot
                  key="ads-6"
                  adUnit="kum-testing/ui3-desktop-channel"
                  sizes={["fluid"]}
                />
                <AdsSlot
                  key="ads-7"
                  adUnit="kum-testing/ui3-desktop-channel"
                  sizes={["fluid"]}
                />
              </React.Fragment>
            )}
          </div>
        </div>
      </GooglePublisherTagProvider>
    </div>
  );
};

export default App;
