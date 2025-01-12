const isChrome = navigator.userAgent.includes("Chrome");
const browserObj = isChrome ? chrome : browser;
const whyKey = "againWhySalesforce";

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
	let captured = false;
	if (message.what === "get") {
		getStorage(sendResponse);
		captured = true;
	} else if (message.what === "set") {
		setStorage(message.tabs, sendResponse);
		captured = true;
	} else if (["saved", "add", "theme", "error"].includes(message.what)) {
		notify(message);
		sendResponse(null);
		return false; // we won't call sendResponse
	}
	captured = captured || ["import"].includes(message.what);
	if (!captured) {
		console.error({ "error": "Unknown message", message, request });
	}

	return captured; // will call sendResponse asynchronously if true
});
