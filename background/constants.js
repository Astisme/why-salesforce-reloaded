"use strict";
export const setupLightning = "/lightning/setup/";
export const commonSetupDomain = "my.salesforce-setup.com";
export const commonMainDomain = "lightning.force.com";
export const whyKey = "againWhySalesforce";
export const https = "https://";
export const lightningForceCom = ".lightning.force.com";
export const mySalesforceSetupCom = ".my.salesforce-setup.com";
export const mySalesforceCom = ".my.salesforce.com";
export const salesforceIdPattern = /(?:^|\/|=)([a-zA-Z0-9]{15}|[a-zA-Z0-9]{18})(?:$|\/|\?|&)/;

export const framePatterns = [
    `${https}*${mySalesforceSetupCom}/*`,
    `${https}*${lightningForceCom}/*`,
    `${https}*${mySalesforceCom}/*`,
];

// add `/setup/lightning/` to the framePatterns
export const contextMenuPatterns = framePatterns.map((item) =>
    `${item.substring(0, item.length - 2)}${setupLightning}*`
);

export const contextMenuPatternsRegex = contextMenuPatterns.map((item) =>
    item.replaceAll("\*", ".*")
);

if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}
