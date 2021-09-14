//@flow

import { type GoogleTag } from "./definition";

const STANDARD_GPT_SRC = "securepubads.g.doubleclick.net";

const LIMITED_GPT_SRC = "pagead2.googlesyndication.com";

export const loadGPTScript = (
  enableLoadLimitedAdsSDK: boolean
): Promise<?GoogleTag> => {
  return new Promise((resolve, reject) => {
    window.googletag = window.googletag || {};
    window.googletag.cmd = window.googletag.cmd || [];

    const scriptTag = document.createElement("script");
    scriptTag.src = `${document.location.protocol}//${
      enableLoadLimitedAdsSDK ? LIMITED_GPT_SRC : STANDARD_GPT_SRC
    }/tag/js/gpt.js`;
    scriptTag.async = true;
    scriptTag.type = "text/javascript";
    scriptTag.onerror = function scriptTagOnError(errs) {
      reject(errs);
    };
    scriptTag.onload = function scriptTagOnLoad() {
      resolve(window.googletag);
    };
    document.getElementsByTagName("head")[0].appendChild(scriptTag);
  });
};