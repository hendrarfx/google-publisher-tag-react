//@flow
import React from "react";
import GooglePublisherTagProvider from "../src/GooglePublisherTagProvider";
import AdsSlot from "../src/AdsSlot";
import type { SingleSize, MultiSize } from "../src/definition";

const size: MultiSize = [
  [100, 200],
  [20, 200]
];

const App = (): React$Element<"div"> => {
  return (
    <div id="apps">
      <GooglePublisherTagProvider
        networkId="test1234"
        disableInitialLoad
        enableCollapseEmptyDivs
        enableCookieOption
        enablePersonalizeAds
        enableLazyLoad
        enableSingleRequest
        targetingArguments={
          new Map([
            ["key-1", "ampas"],
            ["key-2", ["jancok", "sapi"]]
          ])
        }
        adSenseAttributes={
          new Map([
            ["ad-sense-key-1", "ampas"],
            ["ad-sense-key-2", ["jancok", "sapi"]]
          ])
        }
        sizeMapping={[
          {
            viewport: [320, 100],
            sizes: size
          },
          { viewport: [900, 768], sizes: size }
        ]}
        //   enableLoadSDKScriptByPromise
      >
        <div>
          <h1>Test Advertisement</h1>
          <div style={{ flex: 1, flexDirection: "column" }}>
            <AdsSlot adUnit="/test/adunit" sizes={[320, 200]} />
            <AdsSlot adUnit="/test/adunit" sizes={[320, 200]} />
            <AdsSlot adUnit="/test/adunit" sizes={[320, 200]} />
          </div>
        </div>
      </GooglePublisherTagProvider>
    </div>
  );
};

export default App;
