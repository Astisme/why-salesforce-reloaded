"use strict";

let setupTabUl; // This is on Salesforce Setup
let href = globalThis.location.href;
let minifiedURL;
let _expandedURL;
const setupLightning = "/lightning/setup/";
/**
 * tabForCurrentTabs = {
 *      tabTitle: "string", // this is the label for the URL
 *      url: "string", // this is the URL in its minified version
 * }
 */
const currentTabs = [];

const buttonId = `${prefix}-button`;
const starId = `${prefix}-star`;
const slashedStarId = `${prefix}-slashed-star`;
let wasOnSavedTab;
let isCurrentlyOnSavedTab;
let fromHrefUpdate;

{
	const script = document.createElement("script");
	script.src = chrome.runtime.getURL("salesforce/lightning-navigation.js");
	(document.head || document.documentElement).appendChild(script);
}

/**
 * Sends a message to the background script with the current URL.
 *
 * @param {Object} message - The message object to send.
 * @param {Function} callback - The callback function to execute after sending the message.
 */
function sendMessage(message, callback) {
	chrome.runtime.sendMessage({ message, url: location.href }, callback);
}

/**
 * Retrieves saved tab data from storage.
 *
 * @param {Function} callback - The callback function to handle the retrieved data.
 */
function getStorage(callback) {
	sendMessage({ what: "get" }, callback);
}

/**
 * Reloads the saved tabs and shows a success toast message when storage is set.
 */
function afterSet() {
	reloadTabs();
	showToast(`"Again, Why Salesforce" tabs saved.`);
}

/**
 * Saves the current tabs to storage.
 *
 * @param {Array} tabs - The array of tabs to save.
 */
function setStorage(tabs) {
	tabs = tabs ?? currentTabs;
	sendMessage({ what: "set", tabs }, afterSet);
}

/**
 * Minifies a URL by the domain and removing Salesforce-specific parts.
 *
 * @param {string} url - The URL to minify.
 * @returns {Promise} A promise containing the minified URL.
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
	return chrome.runtime.sendMessage({ message: { what: "minify", url } });
}

/**
 * Calculates the estimated time (in milliseconds) it takes to read a given message.
 *
 * @param {string} message - The message to calculate the reading time for.
 * @returns {number} - The estimated reading time in milliseconds.
 */
function calculateReadingTime(message) {
	const words = message.split(/\s+/).filter((word) => word.length > 0);
	const wordsPerMinute = 200; // Average reading speed
	const readingTimeMinutes = words.length / wordsPerMinute;
	const readingTimeSeconds = Math.ceil(readingTimeMinutes * 60);
	return (readingTimeSeconds + 2) * 1000;
}
/**
 * Displays a toast message in the UI.
 *
 * @param {string} message - The message to display in the toast.
 * @param {boolean} [isSuccess=true] - Whether the toast message is a success (default is true).
 * @param {boolean} [isWarning=false] - Whether the toast message is a warning (default is false).
 */
function showToast(message, isSuccess = true, isWarning = false) {
	const hanger = document.getElementsByClassName(
		"oneConsoleTabset navexConsoleTabset",
	)[0];
	const toastElement = _generateSldsToastMessage(
		message,
		isSuccess,
		isWarning,
	);
	hanger.appendChild(toastElement);
	setTimeout(() => {
		hanger.removeChild(document.getElementById(toastElement.id));
	}, calculateReadingTime(message));
}

/**
 * Initializes the default tabs and saves them to storage.
 *
 * @returns {Array} - The list of initialized tabs.
 */
function initTabs() {
	const tabs = [
		{ tabTitle: "⚡", url: "/lightning" },
		{ tabTitle: "Flows", url: "/lightning/app/standard__FlowsApp" },
		{ tabTitle: "Users", url: "ManageUsers/home" },
	];
	setStorage(tabs);
	return tabs;
}

/**
 * Retrieves the favourite button with the specified Id from the page.
 *
 * @param {string} favouriteId - the Id of the favourite button to find.
 * @param {HTMLElement} [button=null] - the HTMLElement of the button which is parent of the favouriteId.
 */
function getFavouriteButton(favouriteId, button = null) {
	return button?.querySelector(`#${favouriteId}`) ??
		button?.querySelector(`.${favouriteId}`) ??
		document.getElementById(favouriteId) ??
		document.querySelector(`.${favouriteId}`);
}
/**
 * Toggles the visibility of the favourite button based on whether the tab is saved.
 *
 * @param {HTMLElement} button - The favourite button element.
 * @param {boolean} isSaved - Optional flag indicating whether the tab is saved.
 */
function toggleFavouriteButton(isSaved, button) {
	// will use the class identifier if there was an error with the image (and was removed)
	const star = getFavouriteButton(starId, button);
	const slashedStar = getFavouriteButton(slashedStarId, button);

	if (isSaved == null) {
		star.classList.toggle("hidden");
		slashedStar.classList.toggle("hidden");
		return;
	}

	if (isSaved) {
		star.classList.add("hidden");
		slashedStar.classList.remove("hidden");
	} else {
		star.classList.remove("hidden");
		slashedStar.classList.add("hidden");
	}
}

function removeTab(url, title) {
	const filteredTabs = currentTabs.filter((tabdef) =>
		tabdef.url !== url && (title == null || tabdef.tabTitle !== title)
	);
	currentTabs.length = 0;
	currentTabs.push(...filteredTabs);
}
/**
 * Adds or removes the current tab from the saved tabs list based on the button's state.
 *
 * @param {HTMLElement} parent - The parent element of the favourite button.
 */
function actionFavourite(parent) {
	minifyURL(href)
		.then((url) => {
			minifiedURL = url;

			if (isCurrentlyOnSavedTab) {
				removeTab(url);
			} else {
				const tabTitle =
					parent.querySelector(".breadcrumbDetail").innerText;
				currentTabs.push({ tabTitle, url });
			}

			toggleFavouriteButton();
			setStorage();
		});
}

/**
 * Checks if the current URL is saved and updates the favourite button accordingly.
 */
function checkUpdateFavouriteButton() {
	// check if the current page is being imported
	minifyURL(href)
		.then((miniURL) => {
			minifiedURL = miniURL;
			const isOnFavouriteTab = currentTabs.some((current) =>
				current.url === miniURL
			);
			toggleFavouriteButton(isOnFavouriteTab);
		});
}

/**
 * Displays the favourite button in the UI if applicable.
 *
 * @param {number} [count=0] - The number of retry attempts to find headers.
 */
function showFavouriteButton(count = 0) {
	if (count > 5) {
		console.error("Again, Why Salesforce - failed to find headers.");
		return setTimeout(() => showFavouriteButton(), 5000);
	}

	// Do not add favourite button on Home and Object Manager
	const standardTabs = ["SetupOneHome/home", "ObjectManager/home"];
	if (standardTabs.includes(minifiedURL)) {
		return;
	}

	// there's possibly 2 headers: one for Setup home and one for Object Manager
	const headers = Array.from(
		document.querySelectorAll("div.overflow.uiBlock > div.bRight"),
	);
	if (headers == null || headers.length < 1) {
		return setTimeout(() => showFavouriteButton(count + 1), 500);
	}

	// ensure we have clean data
	if (wasOnSavedTab == null && isCurrentlyOnSavedTab == null) {
		isOnSavedTab();
	}

	for (const header of headers) {
		if (header.querySelector(`#${buttonId}`) != null) {
			// already inserted my button, check if I should switch it
			checkUpdateFavouriteButton();
			continue;
		}
		header.appendChild(_generateFavouriteButton());
		const button = header.querySelector(`#${buttonId}`); // need to repeat this bit of code because I'm inserting it at the previous line
		toggleFavouriteButton(isCurrentlyOnSavedTab, button); // init correctly
		button.addEventListener(
			"click",
			() => actionFavourite(header.parentNode),
		);
	}
}

/**
 * Initializes and sets up the storage for the tabs with default data or from the stored data.
 *
 * @param {Array<Object>} items - The items retrieved from storage. If no data is found, the default tabs will be initialized.
 * @param {string} items.key - The key used to fetch the stored data.
 * @param {Array<Object>} items[key] - The array of tab data retrieved from storage or the default tabs.
 */
function init(items) {
	//call inittabs if we did not find data inside storage
	const rowObj = (items == null || items[items.key] == null)
		? initTabs()
		: items[items.key];

	currentTabs.length = 0;
	if (rowObj.length !== 0) {
		rowObj.forEach((row) =>
			_generateRowTemplate(row)
				.then((r) => setupTabUl.appendChild(r))
		);
		currentTabs.push(...rowObj);
	}
	isOnSavedTab();
	showFavouriteButton();
}

/**
 * Determines if the current tab is a saved tab or not based on the URL.
 *
 * @param {boolean} [isFromHrefUpdate=false] - A flag to determine if the check is due to a URL update.
 * @returns {boolean} - True if the current tab is a saved tab, otherwise false.
 */
function isOnSavedTab(isFromHrefUpdate = false, callback) {
	if (fromHrefUpdate && !isFromHrefUpdate) {
		fromHrefUpdate = false;
		return;
	}
	fromHrefUpdate = isFromHrefUpdate;

	return minifyURL(href)
		.then((loc) => {
			minifiedURL = loc;

			wasOnSavedTab = isCurrentlyOnSavedTab;
			isCurrentlyOnSavedTab = currentTabs.some((tabdef) =>
				tabdef.url.includes(loc)
			);

			isFromHrefUpdate && callback(isCurrentlyOnSavedTab);
		});
}

/**
 * If the user has moved to or from a saved tab, they'll be reloaded to update the highlighted one.
 * otherwise, the favourite button is shown
 */
function afterHrefUpdate(isCurrentlyOnSavedTab) {
	if (isCurrentlyOnSavedTab || wasOnSavedTab) reloadTabs();
	else showFavouriteButton();
}
/**
 * Handles the update of the current URL, reloading tabs if necessary.
 */
function onHrefUpdate() {
	const newRef = globalThis.location.href;
	if (newRef === href) {
		return;
	}
	href = newRef;
	isOnSavedTab(true, afterHrefUpdate);
}

/**
 * Delays the loading of setup tabs until the relevant DOM elements are available.
 *
 * @param {number} [count=0] - A counter to limit the number of retry attempts.
 */
function delayLoadSetupTabs(count = 0) {
	if (count > 5) {
		console.error("Why Salesforce - failed to find setup tab.");
		return setTimeout(delayLoadSetupTabs(), 5000);
	}

	setupTabUl = document.getElementsByClassName("tabBarItems slds-grid")[0];
	if (setupTabUl == null) {
		return setTimeout(() => delayLoadSetupTabs(count + 1), 500);
	}

	// Start observing changes to the DOM to then check for URL change
	// when URL changes, show the favourite button
	new MutationObserver(() => setTimeout(onHrefUpdate, 500))
		.observe(document.querySelector(".tabsetBody"), {
			childList: true,
			subtree: true,
		});

	// Add overflow scroll behavior only if not already present
	if (!setupTabUl.style.overflowX.includes("auto")) {
		setupTabUl.setAttribute(
			"style",
			`overflow-x: auto; overflow-y: hidden; scrollbar-width: none; ${
				setupTabUl.getAttribute("style") ?? ""
			}`,
		);
	}

	// Listen to mouse wheel to easily move left & right
	if (!setupTabUl.dataset.wheelListenerApplied) {
		setupTabUl.addEventListener("wheel", (e) => {
			e.preventDefault();
			setupTabUl.scrollLeft += e.deltaY;
		});

		setupTabUl.dataset.wheelListenerApplied = true;
	}
	// initialize
	reloadTabs();
}

/**
 * Reloads the tabs by clearing the current list and fetching the updated data from storage.
 */
function reloadTabs() {
	while (setupTabUl.childElementCount > 3) { // hidden li + Home + Object Manager
		setupTabUl.removeChild(setupTabUl.lastChild);
		currentTabs.pop();
	}
	getStorage(init);
}

/**
 * Displays the import modal for uploading tab data.
 */
function showFileImport() {
	if (setupTabUl.querySelector(`#${importId}`) != null) {
		return;
	}

	setupTabUl.appendChild(_generateSldsImport());
}

/**
 * Handles the imported tab data and updates the storage with the newly imported tabs.
 * If the user wants to skip the duplicated urls, they won't be imported; otherwise, if duplicates are detected, the user will be warned about it.
 * If the page where the user is at this moment gets imported, the favourite img is switched to the unfavourite one.
 *
 * @param {Object} message - The message containing the imported tab data.
 * @param {Array<Object>} message.imported - The array of imported tab data.
 */
function _importer(message) {
	if (message.override) {
		currentTabs.length = 0;
	}

	const currentUrls = new Set(currentTabs.map((current) => current.url));
	let importedArray = message.imported;
	let duplicatesArray;

	// check for duplicated entries
	if (message.skipDuplicates) {
		importedArray = importedArray.filter((imported) =>
			!currentUrls.has(imported.url)
		);
	} else {
		// check if there are duplicates to warn the user
		duplicatesArray = importedArray.filter((imported) =>
			currentUrls.has(imported.url)
		);
		if (duplicatesArray.length >= 1) {
			const duplicatedLabels = duplicatesArray.map((dup) => dup.tabTitle)
				.join(", ");
			showToast(
				`Some duplicated tabs where imported:\n${duplicatedLabels}`,
				true,
				true,
			);
		}
	}

	currentTabs.push(...importedArray);
	// remove file import
	setupTabUl.removeChild(setupTabUl.querySelector(`#${importId}`));
	setStorage();
}

/**
 * Reorders the tabs based on their new order in the DOM and saves the updated list to storage.
 */
function reorderTabs() {
	// Get the list of tabs
	const tabPromises = Array.from(setupTabUl.children)
		.slice(3)
		.map(async (tab) => {
			const tabTitle = tab.querySelector("a > span").innerText;
			const href = tab.querySelector("a").href;
			const url = await minifyURL(href);

			if (tabTitle && url) {
				return { tabTitle, url };
			}
			return null; // Return null for invalid tabs
		});

	Promise.all(tabPromises)
		.then((tabs) => setStorage(tabs.filter((tab) => tab != null)))
		.catch((err) => console.error("Error processing tabs:", err));
}

/**
 * Find tabs with the given URL and change their background-color
 */
function makeDuplicatesBold(miniURL) {
	const duplicatetabs = setupTabUl.querySelectorAll(`a[title="${miniURL}"]`);
	if (duplicatetabs == null) {
		return;
	}
	duplicatetabs.forEach((a) => a.classList.add("slds-theme--warning"));
	setTimeout(
		() =>
			duplicatetabs.forEach((a) =>
				a.classList.remove("slds-theme--warning")
			),
		4000,
	);
}

/**
 * TODO
 * Shows a modal to ask the user into which org they want to open the given URL.
 */
function showModalOpenOtherOrg(miniURL) {
	setupTabUl.appendChild(_generateOpenOtherOrgModal(miniURL));
}

/**
 * Moves a tab to the specified spot and then reloads.
 *
 * @param {string} miniURL - the minified URL of the tab to keep
 * @param {string} tabTitle - the title of the tab to keep
 * @param {boolean} [moveBefore=true] - whether the tab should be moved one space before in the array
 * @param {boolean} [fullMovement=false] - whether the tab should be moved at the begin or end of the array instead of moving it only one space
 *
 * @example
 * for this example, we'll collapse miniURL and tabTitle into a single string and simply look at tabs as strings.
 * tabs = ["a", "b", "c", "d", "e"]
 *
 * moveTab("c") || moveTab("c",true) || moveTab("c",true,false)
 * ==> tabs = ["a", "c", "b", "d", "e"]
 *
 * moveTab("c",false) || moveTab("c",false,false)
 * ==> tabs = ["a", "b", "d", "c", "e"]
 *
 * moveTab("c",true,true)
 * ==> tabs = ["c", "a", "b", "d", "e"]
 *
 * moveTab("c",false,true)
 * ==> tabs = ["a", "b", "d", "e", "c"]
 */
function moveTab(miniURL, tabTitle, moveBefore = true, fullMovement = false) {
	if (tabTitle == null) {
		tabTitle = currentTabs.find((current) =>
			current.url === miniURL
		).tabTitle;
	}
	const index = currentTabs.findIndex((tab) =>
		tab.url === miniURL && tab.tabTitle === tabTitle
	);
	if (index === -1) return;

	const [tab] = currentTabs.splice(index, 1);

	if (fullMovement) {
		moveBefore ? currentTabs.unshift(tab) : currentTabs.push(tab);
	} else {
		const newIndex = moveBefore
			? Math.max(0, index - 1)
			: Math.min(currentTabs.length, index + 1);
		currentTabs.splice(newIndex, 0, tab);
	}

	setStorage();
}

/**
 * Removes the other saved tabs and then reloads.
 *
 * @param {string} miniURL - the minified URL of the tab to keep
 * @param {string} tabTitle - the title of the tab to keep
 * @param {boolean || null} [removeBefore=null] - special value to change the behaviour of the function. When not passed, the specified tab will be the only one kept. When true, only the tabs before it will be removed. When false, only the tabs after it will be removed.
 *
 * @example
 * for this example, we'll collapse miniURL and tabTitle into a single string and simply look at tabs as strings.
 * tabs = ["a", "b", "c"]
 *
 * removeOtherTabs("b") || removeOtherTabs("b",null) ==> tabs = ["b"]
 * removeOtherTabs("b",true) ==> tabs = ["b", "c"]
 * removeOtherTabs("b",false) ==> tabs = ["a", "b"]
 */
function removeOtherTabs(miniURL, tabTitle, removeBefore = null) {
	if (tabTitle == null) {
		tabTitle = currentTabs.find((current) =>
			current.url === miniURL
		).tabTitle;
	}
	if (removeBefore == null) {
		return setStorage([{ tabTitle, url: miniURL }]);
	}
	const index = currentTabs.findIndex((tab) =>
		tab.url === miniURL && tab.tabTitle === tabTitle
	);
	if (index === -1) return;

	setStorage(
		removeBefore
			? currentTabs.slice(index)
			: currentTabs.slice(0, index + 1),
	);
}

/**
 * Performs the specified action for the current page, adding or removing from the tab list.
 *
 * @param {boolean} [save=true] - whether the current page should be added or removed as tab
 */
function pageActionTab(save = true) {
	const favourite = getFavouriteButton(save ? starId : slashedStarId);
	if (!favourite.classList.contains("hidden")) favourite.click();
	else {
		const message = save
			? "Cannot save:\nThis page has already been saved!"
			: "Cannot remove:\nCannot remove a page that has not been saved before";
		showToast(message, true, true);
	}
}

// listen from saves from the action / background page
chrome.runtime.onMessage.addListener(function (message, _, sendResponse) {
	if (message == null || message.what == null) {
		return;
	}
	sendResponse(null);
	switch (message.what) {
		case "saved":
			afterSet();
			break;
		case "add":
			showFileImport();
			break;
		case "warning":
			showToast(message.message, false, true);
			if (message.action === "make-bold") {
				makeDuplicatesBold(message.url);
			}
			break;
		case "open-other-org":
			showModalOpenOtherOrg(message.tabUrl);
			break;
		case "move-first":
			moveTab(message.tabUrl, message.tabTitle, true, true);
			break;
		case "move-left":
			moveTab(message.tabUrl, message.tabTitle, true, false);
			break;
		case "move-right":
			moveTab(message.tabUrl, message.tabTitle, false, false);
			break;
		case "move-last":
			moveTab(message.tabUrl, message.tabTitle, false, true);
			break;
		case "remove-tab":
			removeTab(message.tabUrl, message.tabTitle);
			setStorage();
			break;
		case "remove-other-tabs":
			removeOtherTabs(message.tabUrl, message.tabTitle);
			break;
		case "remove-left-tabs":
			removeOtherTabs(message.tabUrl, message.tabTitle, true);
			break;
		case "remove-right-tabs":
			removeOtherTabs(message.tabUrl, message.tabTitle, false);
			break;
		case "page-save-tab":
			pageActionTab(true);
			break;
		case "page-remove-tab":
			pageActionTab(false);
			break;

		default:
			break;
	}
});

// listen to possible updates from other modules
addEventListener("message", (e) => {
	if (e.source != window) {
		return;
	}
	const what = e.data.what;
	if (what === "order") {
		reorderTabs();
	}
	//else if(what === "saved")
});

// queries the currently active tab of the current active window
// this prevents showing the tabs when not in a setup page (like Sales or Service Console)
if (href.includes(setupLightning)) {
	delayLoadSetupTabs();
}
