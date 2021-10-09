# Google Publisher Tag Implementation for React

A React implementation of the google publisher tag SDK.

## Installation:

run the following command to install pacakage:

```bash
npm install --save gpt-ads-react
```

or

```bash
yarn add gpt-ads-react
```

## Usage
To use this package please load GPT library on the head 

```javascript
 <head>
    <meta charset="utf-8">
    <title>First GPT Implementation On React</title>
    <script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
</head>
```

Then define Provider and AdsSlot on the App component

```javascript
import React, { Component } from 'react';
import { GooglePublisherTagProvider, AdsSlot } from 'react-ads-gpt';


const App = () => {
  return <GooglePublisherTagProvider 
          networkId="network-id-from-ad-manager">
            <AdsSlot adUnit="adunit/from-ad-manager" size={[300, 250]} />
            <AdsSlot adUnit="adunit/from-ad-manager" size={[300, 250]} />
            <AdsSlot adUnit="adunit/from-ad-manager" size={[300, 250]} />
        </GooglePublisherTagProvider>
}

```
## API reference

### GooglePublisherTagProvider

| Props         | Type           | Desc  |
| ------------- |:--------------:| -----:|
| networkId     | string         | some desc |
| children     | React.node         | some desc |
| disableInitialLoad | boolean | some desc |
| enableCollapseEmptyDivs | boolean | some desc |
| enablePersonalizeAds | boolean | some desc |
| enableLazyLoad | boolean | some desc |
| enableSingleRequest | boolean | some desc |
| enableLoadLimitedAdsSDK | boolean | some desc |
| enableLoadSDKScriptByPromise | boolean | some desc |
| targetingArguments | Map<string, string Array<string>> | some desc |

### AdsSlot 
| Props | Type | Description |
| networkId |  string | some desc |
| slotId |  string | some desc |
| adUnit | string | some desc |
| sizes | GeneralSize | some desc |
| isOutOfPageSlot |  boolean | some desc |
| sizeMapping |  Array<ViewportSizeMapping> | some desc |
| targetingArguments |  Map<string, string | Array<string>> | some desc |
| onImpressionViewable |  ImpressionViewableEventCallbackType | some desc |
| onSlotOnload |  SlotOnloadEventCallbackType | some desc |
| onSlotRenderEnded |  SlotRenderEndedEventCallbackType | some desc |
| onSlotRequested |  SlotRequestedEventCallbackType | some desc |
| onSlotResponseReceived |  SlotResponseReceivedCallbackType | some desc |
| onSlotVisibilityChanged |  SlotVisibilityChangedEventCallbackType | some desc |

