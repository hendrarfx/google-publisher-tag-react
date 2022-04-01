//@flow

import { type GoogleTag } from "./definition";

const STANDARD_GPT_SRC = "securepubads.g.doubleclick.net";

const LIMITED_GPT_SRC = "pagead2.googlesyndication.com";

export const loadGPTScript = (
  enableLoadLimitedAdsSDK: boolean
): Promise<?GoogleTag> =>
  new Promise((resolve, reject) => {
    const { window } = global;
    if (window) {
      window.googletag = window.googletag || {};
      window.googletag.cmd = window.googletag.cmd || [];

      const scriptTag = document.createElement("script");
      scriptTag.src = `${document.location.protocol}//${
        enableLoadLimitedAdsSDK ? LIMITED_GPT_SRC : STANDARD_GPT_SRC
      }/tag/js/gpt.js`;
      scriptTag.async = true;
      scriptTag.type = "text/javascript";
      scriptTag.onerror = function onError(errs) {
        reject(errs);
      };
      scriptTag.onload = function onload() {
        resolve(window.googletag);
      };
      document.getElementsByTagName("head")[0].appendChild(scriptTag);
    }
  });
