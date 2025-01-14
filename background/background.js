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
function addKey(items, callback) {
	items.key = whyKey;
	callback(items);
}

/**
 * Retrieves stored data from the browser's storage and invokes the provided callback.
 *
 * @param {function} callback - The callback to invoke with the retrieved data.
 */
function getStorage(callback) {
	browserObj.storage.sync.get([whyKey], (items) => {
		addKey(items, callback);
	});
}

/**
 * Stores the provided tabs data in the browser's storage and invokes the callback.
 *
 * @param {Array} tabs - The tabs to store.
 * @param {function} callback - The callback to execute after storing the data.
 */
function setStorage(tabs, callback) {
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
function notify(message, count = 0) {
	browserObj.tabs.query(
		{ active: true, currentWindow: true },
		(tabs) => {
			if (tabs && tabs[0]) {
				browserObj.tabs.sendMessage(tabs[0].id, message);
			} else if (count < 5) {
				setTimeout(() => notify(count + 1), 500);
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
function minifyURL(url) {
	if (url == null || url == "") {
		return "";
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
 * This function undoes what minifyURL did to a URL.
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
function expandURL(message) {
	const { url, baseUrl } = message;
	if (url == null || url === "" || url.startsWith("https")) {
		return url;
	}
	const isSetupLink = !url.startsWith("/") && url.length > 0;
	return `${baseUrl}${isSetupLink ? setupLightning : ""}${url}`;
}

/**
 * Listens for incoming messages and processes requests to get, set, or notify about storage changes.
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
			getStorage(sendResponse);
			break;
		case "set":
			setStorage(message.tabs, sendResponse);
			break;
		case "saved":
		case "add":
		case "theme":
		case "error":
			notify(message);
			sendResponse(null);
			return false; // we won't call sendResponse
		case "minify":
			sendResponse(minifyURL(message.url));
			return false; // we won't call sendResponse
		case "expand":
			sendResponse(expandURL(message));
			return false; // we won't call sendResponse

		default:
			captured = ["import"].includes(message.what);
			if (!captured) {
				console.error({ "error": "Unknown message", message, request });
			}
			break;
	}

	return captured; // will call sendResponse asynchronously if true
});
