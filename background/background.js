"use strict";
import "./context-menus.js"; // initiate context-menu loop
import {
	https,
	lightningForceCom,
	mySalesforceCom,
	mySalesforceSetupCom,
	salesforceIdPattern,
	whyKey,
} from "./constants.js";
import {
	bg_expandURL,
	bg_minifyURL,
	bg_notify,
	exportHandler,
} from "./utils.js";

/**
 * Adds the key to the items object and invokes the provided callback.
 *
 * @param {Object} items - The items to which the key should be added.
 * @param {function} callback - The callback to execute after adding the key.
 */
function bg_addKey(items, callback) {
	items.key = whyKey;
	callback(items);
}

/**
 * Retrieves stored data from the browser's storage and invokes the provided callback.
 *
 * @param {function} callback - The callback to invoke with the retrieved data.
 */
export function bg_getStorage(callback) {
	browser.storage.sync.get(
		[whyKey],
		(items) => bg_addKey(items, callback),
	);
}

/**
 * Stores the provided tabs data in the browser's storage and invokes the callback.
 *
 * @param {Array} tabs - The tabs to store.
 * @param {function} callback - The callback to execute after storing the data.
 */
function bg_setStorage(tabs, callback) {
	const set = {};
	set[whyKey] = tabs;
	browser.storage.sync.set(set, () => callback(null));
}

/**
 * Extracts the Org name from the url passed as input.
 *
 * @param {string} url - The URL from which the Org name has to be extracted.
 * @returns string | undefined - The Org name OR nothing if an error occurs
 */
function bg_extractOrgName(url) {
	if (url == null) {
		return null;
	}
	let host = new URL(
		url.startsWith(https) ? url : `${https}${url}`,
	).host;

	if (host.endsWith(lightningForceCom)) {
		host = host.slice(0, host.indexOf(lightningForceCom));
	}

	if (host.endsWith(mySalesforceSetupCom)) {
		host = host.slice(0, host.indexOf(mySalesforceSetupCom));
	}

	if (host.endsWith(mySalesforceCom)) {
		host = host.slice(0, host.indexOf(mySalesforceCom));
	}

	return host;
}

/**
 * Checks if a given URL contains a valid Salesforce ID.
 *
 * A Salesforce ID is either 15 or 18 alphanumeric characters, typically found
 * in URL paths or query parameters. The function also handles encoded URLs
 * (e.g., `%2F` becomes `/`) by decoding them before matching.
 *
 * @param {string} url - The URL to check for a Salesforce ID.
 * @returns {boolean} - Returns `true` if the URL contains a Salesforce ID, otherwise `false`.
 */
function bg_containsSalesforceId(url) {
	return salesforceIdPattern.test(decodeURIComponent(url));
}

/**
 * Listens for incoming messages and processes requests to get, set, or bg_notify about storage changes.
 * Also handles theme updates and tab-related messages.
 *
 * @param {Object} request - The incoming message request.
 * @param {Object} _ - The sender object (unused).
 * @param {function} sendResponse - The function to send a response back.
 * @returns {boolean} Whether the message was handled asynchronously.
 */
browser.runtime.onMessage.addListener((request, _, sendResponse) => {
	const message = request.message;
	if (message == null || message.what == null) {
		console.error({ error: "Invalid message", message, request });
		sendResponse(null);
		return false;
	}
	let captured = true;

	switch (message.what) {
		case "get":
			bg_getStorage(sendResponse);
			break;
		case "set":
			bg_setStorage(message.tabs, sendResponse);
			break;
		case "saved":
		case "add":
		case "theme":
		case "error":
		case "warning":
			sendResponse(null);
			setTimeout(() => bg_notify(message), 250); // delay the notification to prevent accidental removal (for "add")
			return false; // we won't call sendResponse
		case "minify":
			sendResponse(bg_minifyURL(message.url));
			return false; // we won't call sendResponse
		case "extract-org":
			sendResponse(bg_extractOrgName(message.url));
			return false; // we won't call sendResponse
		case "expand":
			sendResponse(bg_expandURL(message));
			return false; // we won't call sendResponse
		case "contains-sf-id":
			sendResponse(bg_containsSalesforceId(message.url));
			return false; // we won't call sendResponse
		case "reload":
			sendResponse(null);
			browser.tabs.query(
				{ active: true, currentWindow: true },
				(tabs) => browser.tabs.reload(tabs[0].id),
			);
			return false;
		case "export":
			exportHandler(message.tabs);
			sendResponse(null);
			return false;

		default:
			captured = ["import"].includes(message.what);
			if (!captured) {
				console.error({ "error": "Unknown message", message, request });
			}
			break;
	}

	return captured; // will call sendResponse asynchronously if true
});
