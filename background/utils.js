"use strict";
import {
	commonMainDomain,
	commonSetupDomain,
	https,
	setupLightning,
	whyKey,
} from "./constants.js";
import { bg_getStorage } from "./background.js";

/**
 * Sends the same message back to other parts of the extension.
 *
 * @param {JSONObject} message - the message to be sent
 * @param {int} count = 0 - how many times the function has been called
 */
export function bg_notify(message, count = 0) {
	browser.tabs.query(
		{ active: true, currentWindow: true },
		(tabs) => {
			if (tabs && tabs[0]) {
				browser.tabs.sendMessage(tabs[0].id, message);
			} else if (count < 5) {
				setTimeout(() => bg_notify(count + 1), 500);
			}
		},
	);
}

/**
 * Minifies a URL by the domain and removing Salesforce-specific parts.
 *
 * @param {string} url - The URL to minify.
 * @returns {string} The minified URL.
 *
 * These links would all collapse into "SetupOneHome/home".
 * https://myorgdomain.sandbox.my.salesforce-setup.com/lightning/setup/SetupOneHome/home/
 * https://myorgdomain.sandbox.my.salesforce-setup.com/lightning/setup/SetupOneHome/home
 * https://myorgdomain.my.salesforce-setup.com/lightning/setup/SetupOneHome/home/
 * https://myorgdomain.my.salesforce-setup.com/lightning/setup/SetupOneHome/home
 * /lightning/setup/SetupOneHome/home/
 * /lightning/setup/SetupOneHome/home
 * lightning/setup/SetupOneHome/home/
 * lightning/setup/SetupOneHome/home
 * /SetupOneHome/home/
 * /SetupOneHome/home
 * SetupOneHome/home/
 * SetupOneHome/home
 */
export function bg_minifyURL(url) {
	if (url == null || url == "") {
		return null;
	}

	// remove org-specific url
	if (url.includes(commonMainDomain)) {
		url = url.slice(
			url.indexOf(commonMainDomain) +
				commonMainDomain.length,
		);
	} else if (url.includes(commonSetupDomain)) {
		url = url.slice(
			url.indexOf(commonSetupDomain) +
				commonSetupDomain.length,
		);
	}

	if (url.includes(setupLightning)) {
		url = url.slice(
			url.indexOf(setupLightning) +
				setupLightning.length,
		);
	}

	if (url.endsWith("/")) {
		url = url.slice(0, url.length - 1);
	}

	if (url.length === 0) {
		url = "/";
	}

	return url;
}

/**
 * Expands a URL by adding the domain and the Salesforce setup parts.
 * This function undoes what bg_minifyURL did to a URL.
 *
 * @param {string} url - The URL to expand.
 * @returns {string} The expanded URL.
 *
 * These links would all collapse into "https://myorgdomain.sandbox.my.salesforce-setup.com/lightning/setup/SetupOneHome/home/".
 * https://myorgdomain.sandbox.my.salesforce-setup.com/lightning/setup/SetupOneHome/home/
 * https://myorgdomain.sandbox.my.salesforce-setup.com/lightning/setup/SetupOneHome/home
 * https://myorgdomain.my.salesforce-setup.com/lightning/setup/SetupOneHome/home/
 * https://myorgdomain.my.salesforce-setup.com/lightning/setup/SetupOneHome/home
 * lightning/setup/SetupOneHome/home/
 * lightning/setup/SetupOneHome/home
 * SetupOneHome/home/
 * SetupOneHome/home
 */
export function bg_expandURL(message) {
	if (message == null || message.url == null || message.baseUrl == null) {
		return null;
	}
	const { url, baseUrl } = message;
	if (url == null || url === "" || url.startsWith(https)) {
		return url;
	}
	const isSetupLink = !url.startsWith("/") && url.length > 0;
	return `${baseUrl}${isSetupLink ? setupLightning : ""}${url}`;
}

/**
 * Handles the export functionality by downloading the current tabs as a JSON file.
 */
function _exportHandler(bg_currentTabs) {
	// Convert JSON string to Blob
	const blob = new Blob([JSON.stringify(bg_currentTabs[whyKey], null, 4)], {
		type: "application/json",
	});

	// Create a download link
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "again-why-salesforce.json";

	// Append the link to the body and trigger the download
	document.body.appendChild(link);
	link.click();

	// Cleanup
	document.body.removeChild(link);
}

/**
 * Exposes a function wrapper for the actual exportHandler due to the need for getting the currently saved tabs.
 *
 * @param [Array] bg_currentTabs - the currently saved tabs. if null, the tabs are retrieved automatically
 */
export function exportHandler(bg_currentTabs = null) {
	if (bg_currentTabs == null) {
		return bg_getStorage(_exportHandler);
	}
	const tabs = {};
	tabs[whyKey] = bg_currentTabs;
	_exportHandler(tabs);
}
