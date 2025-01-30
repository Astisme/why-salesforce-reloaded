const isChrome = navigator.userAgent.includes("Chrome");
const browserObj = isChrome ? chrome : browser;
const whyKey = "againWhySalesforce";
const commonSetupDomain = "my.salesforce-setup.com";
const commonMainDomain = "lightning.force.com";
const setupLightning = "/lightning/setup/";

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
function bg_getStorage(callback) {
	browserObj.storage.sync.get(
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
	browserObj.storage.sync.set(set, () => callback(null));
}

/**
 * Sends the same message back to other parts of the extension.
 *
 * @param {JSONObject} message - the message to be sent
 * @param {int} count = 0 - how many times the function has been called
 */
function bg_notify(message, count = 0) {
	browserObj.tabs.query(
		{ active: true, currentWindow: true },
		(tabs) => {
			if (tabs && tabs[0]) {
				browserObj.tabs.sendMessage(tabs[0].id, message);
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
function bg_minifyURL(url) {
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
 * Extracts the Org name from the url passed as input.
 *
 * @param {string} url - The URL from which the Org name has to be extracted.
 * @returns string | undefined - The Org name OR nothing if an error occurs
 */
function bg_extractOrgName(url) {
	if (url == null) {
		return null;
	}
	const https = "https://";
	let host = new URL(
		url.startsWith(https) ? url : `${https}${url}`,
	).host;

	const lightningForceCom = ".lightning.force.com";
	if (host.endsWith(lightningForceCom)) {
		host = host.slice(0, host.indexOf(lightningForceCom));
	}

	const mySalesforceSetupCom = ".my.salesforce-setup.com";
	if (host.endsWith(mySalesforceSetupCom)) {
		host = host.slice(0, host.indexOf(mySalesforceSetupCom));
	}

	const mySalesforceCom = ".my.salesforce.com";
	if (host.endsWith(mySalesforceCom)) {
		host = host.slice(0, host.indexOf(mySalesforceCom));
	}

	return host;
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
function bg_expandURL(message) {
	if (message == null || message.url == null || message.baseUrl == null) {
		return null;
	}
	const { url, baseUrl } = message;
	if (url == null || url === "" || url.startsWith("https")) {
		return url;
	}
	const isSetupLink = !url.startsWith("/") && url.length > 0;
	return `${baseUrl}${isSetupLink ? setupLightning : ""}${url}`;
}

const salesforceIdPattern =
	/(?:^|\/|=)([a-zA-Z0-9]{15}|[a-zA-Z0-9]{18})(?:$|\/|\?|&)/;
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

const menuItems = [
	{
		id: "open-other-org",
		title: "Open in another Org",
		contexts: ["link", "page", "frame"],
	},

	{ id: "move", title: "Move tab", contexts: ["link"] },
	{
		id: "move-first",
		title: "Make first",
		contexts: ["link"],
		parentId: "move",
	},
	{
		id: "move-left",
		title: "Move left",
		contexts: ["link"],
		parentId: "move",
	},
	{
		id: "move-right",
		title: "Move right",
		contexts: ["link"],
		parentId: "move",
	},
	{
		id: "move-last",
		title: "Make last",
		contexts: ["link"],
		parentId: "move",
	},

	{ id: "remove", title: "Remove tab(s)", contexts: ["link"] },
	{
		id: "remove-tab",
		title: "Remove this tab",
		contexts: ["link"],
		parentId: "remove",
	},
	{
		id: "remove-other-tabs",
		title: "Remove other tabs",
		contexts: ["link"],
		parentId: "remove",
	},
	{
		id: "remove-left-tabs",
		title: "Remove tabs to the left",
		contexts: ["link"],
		parentId: "remove",
	},
	{
		id: "remove-right-tabs",
		title: "Remove tabs to the right",
		contexts: ["link"],
		parentId: "remove",
	},
	{
		id: "empty-tabs",
		title: "Remove ALL tabs",
		contexts: ["link"],
		parentId: "remove",
	},

	{ id: "page-save-tab", title: "Save as tab", contexts: ["page", "frame"] },
	{ id: "page-remove-tab", title: "Remove tab", contexts: ["page", "frame"] },
];

const framePatterns = [
	`https://*.my.salesforce-setup.com/*`,
	`https://*.lightning.force.com/*`,
	`https://*.my.salesforce.com/*`,
];
// add `/setup/lightning/` to the framePatterns
const contextMenuPatterns = framePatterns.map((item) =>
	`${item.substring(0, item.length - 2)}${setupLightning}*`
);
const contextMenuPatternsRegex = contextMenuPatterns.map((item) =>
	item.replaceAll("\*", ".*")
);

/**
 * - Updates `documentUrlPatterns` for each menu item:
 *   - Uses `framePatterns` if the item context includes "frame".
 *   - Uses `contextMenuPatterns` otherwise.
 */
menuItems.forEach((item) => {
	item.documentUrlPatterns = item.contexts.includes("frame")
		? framePatterns
		: contextMenuPatterns;
});

let areMenuItemsVisible = false;

/**
 * Creates context menu items dynamically based on the provided menu definitions.
 *
 * - Iterates through `menuItems` and creates each item using `browserObj.contextMenus.create`.
 */
function bg_createMenuItems() {
	if (areMenuItemsVisible) return;
	areMenuItemsVisible = true;
	menuItems.forEach((item) => {
		browserObj.contextMenus.create(item);
	});
}

/**
 * Removes all existing context menu items.
 */
function bg_removeMenuItems(callback) {
	if (!areMenuItemsVisible && callback == null) return;
	areMenuItemsVisible = false;
	browserObj.contextMenus.removeAll(callback);
}

/**
 * Checks the current active tab's URL and conditionally adds or removes context menus.
 *
 * - Queries the currently active tab in the current browser window.
 * - If the tab exists and its URL matches any regex in `contextMenuPatternsRegex`, calls `bg_createMenuItems`.
 * - If no match is found, calls `bg_removeMenuItems` to clean up context menus.
 */
function bg_checkAddRemoveContextMenus() {
	browserObj.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs && tabs[0]) {
			const url = tabs[0].url;
			if (url == null) return;
			if (contextMenuPatternsRegex.some((cmp) => url.match(cmp))) {
				bg_removeMenuItems(bg_createMenuItems);
				bg_notify({ what: "focused" });
			} else bg_removeMenuItems();
		}
	});
}

// when the extension is installed / updated
browserObj.runtime.onInstalled.addListener(() =>
	bg_checkAddRemoveContextMenus()
);
/* TODO add tutorial on install and link to current changes on update
if (details.reason == "install") {
}
else if (details.reason == "update") {
}
    */

// when the browser starts
browserObj.runtime.onStartup.addListener(() => bg_checkAddRemoveContextMenus());

/*
// TODO update uninstall url
browserObj.runtime.setUninstallURL("https://www.duckduckgo.com/", () => {
    bg_removeMenuItems()
});
*/

// when the tab changes
browserObj.tabs.onHighlighted.addListener((_) => {
	bg_checkAddRemoveContextMenus();
});

// when window changes
browserObj.windows.onFocusChanged.addListener((_) => {
	bg_checkAddRemoveContextMenus();
});

// create persistent menuItems
bg_checkAddRemoveContextMenus();

/**
 * Listener for context menu item clicks, processes actions based on the clicked menu item.
 *
 * - Listens to `browserObj.contextMenus.onClicked` events.
 * - Creates a `message` object with details based on the menu item ID.
 *   - Common fields: `what` (menuItemId), `tabUrl`, `url`, and `tabTitle` (if applicable).
 *   - Special cases:
 *     - "open-other-org": Adds `pageTabUrl`, `pageUrl`, `linkTabUrl`, `linkUrl`, and `linkTabTitle`.
 *     - "page-save-tab" and "page-remove-tab": Focuses on `pageUrl`.
 * - Calls `bg_notify(message)` to handle further processing or communication.
 */
browserObj.contextMenus.onClicked.addListener((info, _) => {
	const message = { what: info.menuItemId };
	switch (info.menuItemId) {
		case "open-other-org":
			message.pageTabUrl = bg_minifyURL(info.pageUrl);
			message.pageUrl = bg_expandURL(info.pageUrl);
			message.linkTabUrl = bg_minifyURL(info.linkUrl);
			message.linkUrl = bg_expandURL(info.linkUrl);
			message.linkTabTitle = info.linkText;
			break;
		case "page-save-tab":
		case "page-remove-tab":
			message.tabUrl = bg_minifyURL(info.pageUrl);
			message.url = bg_expandURL(info.pageUrl);
			break;
		default:
			message.tabUrl = bg_minifyURL(info.linkUrl);
			message.url = bg_expandURL(info.linkUrl);
			message.tabTitle = info.linkText;
			break;
	}
	bg_notify(message);
});

/**
 * Listens for incoming messages and processes requests to get, set, or bg_notify about storage changes.
 * Also handles theme updates and tab-related messages.
 *
 * @param {Object} request - The incoming message request.
 * @param {Object} _ - The sender object (unused).
 * @param {function} sendResponse - The function to send a response back.
 * @returns {boolean} Whether the message was handled asynchronously.
 */
browserObj.runtime.onMessage.addListener((request, _, sendResponse) => {
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
			browserObj.tabs.query(
				{ active: true, currentWindow: true },
				(tabs) => browserObj.tabs.reload(tabs[0].id),
			);
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
