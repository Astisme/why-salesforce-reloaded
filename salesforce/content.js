// deno-lint-ignore-file no-window
"use strict";

let setupTabUl; // This is on Salesforce Setup
const setupLightning = "/lightning/setup/";
let href = window.location.href;
const baseUrl = href.slice(0, href.indexOf(setupLightning));
const currentTabs = [];

const prefix = "again-why-salesforce";
const buttonId = `${prefix}-button`;
const starId = `${prefix}-star`;
const slashedStarId = `${prefix}-slashed-star`;
const toastId = `${prefix}-toast`;
const importId = `${prefix}-import`;
const closeModalId = `${prefix}-closeModal`;
let wasOnSavedTab;
let isCurrentlyOnSavedTab;
let fromHrefUpdate;

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
	sendMessage({ what: "set", tabs }, afterSet);
}

/**
 * Cleans up and normalizes the given URL.
 *
 * @param {string} url - The URL to clean up.
 * @param {boolean} [nochange=null] - Optional parameter to control URL transformation behavior. If false, the URL returned will contain the entire Salesforce Setup link.
 * @returns {string} - The cleaned-up URL.
 */
function cleanupUrl(url, nochange = null) {
	const asis = nochange == null ? url.startsWith("http") : nochange;
	if (url.startsWith("/lightning") || url.startsWith("/_ui/common")) { // normalized setup pages won't get here
		return `${baseUrl}${url}`;
	}

	if (url.startsWith("/")) {
		url = url.slice(1);
	}
	if (url.endsWith("/")) {
		url = url.slice(0, url.length - 1);
	}
	if (url.includes(setupLightning)) {
		url = url.slice(url.indexOf(setupLightning) + setupLightning.length);
	}

	return asis ? url : `${baseUrl}${setupLightning}${url}`;
}

/**
 * Generates the HTML for a tab row.
 *
 * @param {Object} row - The tab data object containing title and URL.
 * @param {string} row.tabTitle - The title of the tab.
 * @param {string} row.url - The URL of the tab.
 * @returns {HTMLElement} - The generated list item element representing the tab.
 */
function generateRowTemplate(row) {
	let { tabTitle, url } = row;
	url = cleanupUrl(url);

	const li = document.createElement("li");
	li.setAttribute("role", "presentation");
	li.classList.add(
		"oneConsoleTabItem",
		"tabItem",
		"slds-context-bar__item",
		"borderRight",
		"navexConsoleTabItem",
		prefix,
	);
	li.setAttribute("data-aura-class", "navexConsoleTabItem");

	const a = document.createElement("a");
	a.setAttribute("data-draggable", "true");
	a.setAttribute("role", "tab");
	a.setAttribute("tabindex", "-1");
	a.setAttribute("title", tabTitle);
	a.setAttribute("aria-selected", "false");
	a.setAttribute("href", url);
	a.classList.add("tabHeader", "slds-context-bar__label-action");
	a.style.zIndex = 0;

	const span = document.createElement("span");
	span.classList.add("title", "slds-truncate");
	span.textContent = tabTitle;

	a.appendChild(span);
	li.appendChild(a);

	// Highlight the tab related to the current page
	if (href === url) {
		li.classList.add("slds-is-active");
	}

	return li;
}

/**
 * Generates the HTML for a toast message.
 *
 * @param {string} message - The message to display in the toast.
 * @param {boolean} isSuccess - Indicates whether the message is a success or error.
 * @returns {string} - The generated HTML for the toast message.
 */
function generateSldsToastMessage(message, isSuccess) {
	const toastType = isSuccess ? "success" : "error";
	return `<div id="${toastId}" class="toastContainer slds-notify_container slds-is-relative" data-aura-rendered-by="7381:0">
                <div role="alertdialog" aria-describedby="toastDescription7382:0" data-key="${toastType}" class="slds-theme--${toastType} slds-notify--toast slds-notify slds-notify--toast forceToastMessage" data-aura-rendered-by="7384:0" data-aura-class="forceToastMessage" aria-label="${toastType}">
                    <lightning-icon icon-name="utility:${toastType}" class="slds-icon-utility-${toastType} toastIcon slds-m-right--small slds-no-flex slds-align-top slds-icon_container" data-data-rendering-service-uid="1478" data-aura-rendered-by="7386:0">
                        <span style="--sds-c-icon-color-background: var(--slds-c-icon-color-background, transparent)" part="boundary">
                            <lightning-primitive-icon size="small" variant="inverse">
                                <svg class="slds-icon slds-icon_small" focusable="false" data-key="${toastType}" aria-hidden="true" viewBox="0 0 520 520" part="icon">
                                    <g>
                                        ${
		isSuccess
			? '<path d="M260 20a240 240 0 100 480 240 240 0 100-480zm134 180L241 355c-6 6-16 6-22 0l-84-85c-6-6-6-16 0-22l22-22c6-6 16-6 22 0l44 45a10 10 0 0015 0l112-116c6-6 16-6 22 0l22 22c7 6 7 16 0 23z"></path>'
			: '<path d="M260 20C128 20 20 128 20 260s108 240 240 240 240-108 240-240S392 20 260 20zM80 260a180 180 0 01284-147L113 364a176 176 0 01-33-104zm180 180c-39 0-75-12-104-33l251-251a180 180 0 01-147 284z" lwc-1te30te6nf1=""></path>'
	}
                                    </g>
                                </svg>
                            </lightning-primitive-icon>
                            <span class="slds-assistive-text">${toastType}</span>
                        </span>
                    </lightning-icon>
                    <div class="toastContent slds-notify__content" data-aura-rendered-by="7387:0">
                        <div class="slds-align-middle slds-hyphenate" data-aura-rendered-by="7388:0">
                            <!--render facet: 7389:0-->
                            <div id="toastDescription7382:0" data-aura-rendered-by="7390:0">
                                <span class="toastMessage slds-text-heading--small forceActionsText" data-aura-rendered-by="7395:0" data-aura-class="forceActionsText">${message}</span>
                            </div>
                        </div>
                    </div>
                    <!--render facet: 7398:0-->
                </div>
            </div>`;
}

/**
 * Displays a toast message in the UI.
 *
 * @param {string} message - The message to display in the toast.
 * @param {boolean} [isSuccess=true] - Whether the toast message is a success (default is true).
 */
function showToast(message, isSuccess = true) {
	const hanger = document.getElementsByClassName(
		"oneConsoleTabset navexConsoleTabset",
	)[0];
	hanger.insertAdjacentHTML(
		"beforeend",
		generateSldsToastMessage(message, isSuccess),
	);
	setTimeout(() => {
		hanger.removeChild(document.getElementById(toastId));
	}, 4000);
}

/**
 * Initializes the default tabs and saves them to storage.
 *
 * @returns {Array} - The list of initialized tabs.
 */
function initTabs() {
	const tabs = [
		{ tabTitle: "⚡", url: "/lightning" },
		{ tabTitle: "Flows", url: "Flows/home" },
		{ tabTitle: "Users", url: "ManageUsers/home" },
	];
	setStorage(tabs);
	return tabs;
}

/**
 * Generates the HTML for the favourite button.
 *
 * @returns {string} - The generated HTML for the favourite button.
 */
function generateFavouriteButton() {
	const assetDir = chrome.runtime.getURL("assets");
	const star = chrome.runtime.getURL("assets/svgs/star.svg");
	const slashedStar = chrome.runtime.getURL("assets/svgs/slashed-star.svg");
	return `<button aria-live="off" type="button" id="${buttonId}" class="slds-button slds-button--neutral uiButton" aria-label="" data-aura-rendered-by="3:829;a" data-aura-class="uiButton">
                <span dir="ltr" class=" label bBody" data-aura-rendered-by="6:829;a">
                    <!--⭐-->
                    <!--
                    <img id="${starId}" src="${assetDir}/star.svg" alt="Save as Tab">
                    <img id="${slashedStarId}" class="hidden" src="${assetDir}/slashed-star.svg" alt="Remove Tab">
                    -->
                    <img id="${starId}" src="${star}" alt="Save as Tab">
                    <img id="${slashedStarId}" class="hidden" src="${slashedStar}" alt="Remove Tab">
                    <style type="text/css">
                        .hidden {
                            display: none;
                        }
                    </style>
                </span>
            </button>`;
}

/**
 * Toggles the visibility of the favourite button based on whether the tab is saved.
 *
 * @param {HTMLElement} button - The favourite button element.
 * @param {boolean} isSaved - Optional flag indicating whether the tab is saved.
 */
function toggleFavouriteButton(button, isSaved) {
	const star = button.querySelector(`#${starId}`);
	const slashedStar = button.querySelector(`#${slashedStarId}`);
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

/**
 * Adds or removes the current tab from the saved tabs list based on the button's state.
 *
 * @param {HTMLElement} parent - The parent element of the favourite button.
 */
function actionFavourite(parent) {
	const url = cleanupUrl(href);
	if (isCurrentlyOnSavedTab) {
		const filteredTabs = currentTabs.filter((tabdef) => {
			return tabdef.url !== url;
		});
		currentTabs.length = 0;
		currentTabs.push(...filteredTabs);
	} else {
		const tabTitle = parent.querySelector(".breadcrumbDetail").innerText;
		currentTabs.push({ tabTitle, url });
	}
	toggleFavouriteButton(parent.querySelector(`#${buttonId}`));
	setStorage(currentTabs);
}

/**
 * Displays the favourite button in the UI if applicable.
 *
 * @param {number} [count=0] - The number of retry attempts to find headers.
 */
function showFavouriteButton(count = 0) {
	if (count > 5) {
		console.error("Again, Why Salesforce - failed to find headers.");
		return;
	}

	// Do not add favourite button on Home and Object Manager
	const standardTabs = ["SetupOneHome/home", "ObjectManager/home"];
	if (standardTabs.includes(cleanupUrl(href))) {
		return;
	}

	// there's possibly 2 headers: one for Setup home and one for Object Manager
	const headers = Array.from(
		document.querySelectorAll("div.overflow.uiBlock > div.bRight"),
	);
	if (headers == null || headers.length < 1) {
		setTimeout(() => showFavouriteButton(count + 1), 500);
		return;
	}

	// ensure we have clean data
	if (wasOnSavedTab == null && isCurrentlyOnSavedTab == null) {
		isOnSavedTab();
	}

	for (const header of headers) {
		if (header.querySelector(`#${buttonId}`) != null) { // already inserted my button
			continue;
		}
		header.insertAdjacentHTML("beforeend", generateFavouriteButton());
		const button = header.querySelector(`#${buttonId}`);
		toggleFavouriteButton(button, isCurrentlyOnSavedTab); // init correctly
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

	rowObj.forEach((row) => setupTabUl.appendChild(generateRowTemplate(row)));
	currentTabs.length = 0;
	currentTabs.push(...rowObj);
	isOnSavedTab();
	showFavouriteButton();
}

/**
 * Determines if the current tab is a saved tab or not based on the URL.
 *
 * @param {boolean} [isFromHrefUpdate=false] - A flag to determine if the check is due to a URL update.
 * @returns {boolean} - True if the current tab is a saved tab, otherwise false.
 */
function isOnSavedTab(isFromHrefUpdate = false) {
	if (fromHrefUpdate && !isFromHrefUpdate) {
		fromHrefUpdate = false;
		return;
	}
	fromHrefUpdate = isFromHrefUpdate;
	const loc = cleanupUrl(href);
	wasOnSavedTab = isCurrentlyOnSavedTab;
	isCurrentlyOnSavedTab = currentTabs.some((tabdef) =>
		tabdef.url.includes(loc)
	);
	return isCurrentlyOnSavedTab;
}

/**
 * Handles the update of the current URL, reloading tabs if necessary.
 */
function onHrefUpdate() {
	const newRef = window.location.href;
	if (newRef === href) {
		return;
	}
	href = newRef;
	if (isOnSavedTab(true) || wasOnSavedTab) reloadTabs();
	else showFavouriteButton();
}

/**
 * Delays the loading of setup tabs until the relevant DOM elements are available.
 *
 * @param {number} [count=0] - A counter to limit the number of retry attempts.
 */
function delayLoadSetupTabs(count = 0) {
	if (count > 5) {
		console.error("Why Salesforce - failed to find setup tab.");
		return;
	}

	setupTabUl = document.getElementsByClassName("tabBarItems slds-grid")[0];
	if (setupTabUl == null) {
		setTimeout(() => delayLoadSetupTabs(count + 1), 500);
	} else {
		// Start observing changes to the DOM to then check for URL change
		// when URL changes, show the favourite button
		new MutationObserver(() => setTimeout(onHrefUpdate, 500))
			.observe(document.querySelector(".tabsetBody"), {
				childList: true,
				subtree: true,
			});
		// add overflow scroll behavior
		setupTabUl.setAttribute(
			"style",
			`overflow: scroll; ${setupTabUl.getAttribute("style") ?? ""}`,
		);
		// initialize
		getStorage(init);
	}
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
 * Generates the HTML structure for the import modal.
 *
 * @returns {string} - The HTML string for the import modal.
 */
function generateSldsImport() {
	return `<div id="${importId}" style="width: 100%;display: flex;align-items: center;justify-content: center;position: fixed;left: 0;">
                <!-- focus on div -->
                <!-- z-index of tabs on setupTabUl is == 1 so we have to move up over them -->
                <div style="position: absolute; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.5); z-index: 2;top:0;left:0;pointer-events: all;"></div>
                <!-- main content div -->
                <div style="position: absolute;background-color: lightgoldenrodyellow;top: 2rem;width: 18rem;height: 8rem;display: flex;align-items: center;justify-content: center;text-align: center;border: 1px solid lightskyblue;border-radius: 1rem;flex-direction: column;box-shadow: 1px 2px 3px black;z-index: 3;">
                    <!-- X button -->
                    <button 
                        id="${closeModalId}"
                        style="position: absolute;top: 0rem;right: 0rem;width: 1.5rem;height: 1.5rem;background: lightskyblue;border: 1px solid black;color: black;font-size: 1.2rem;cursor: pointer;border-radius: 50%;display: flex;align-items: center;justify-content: center; line-height: 1;">
                        <span style="transform: translateY(-2px) translateX(1px);">
                            &times;
                        </span>
                    </button>
                    <h4 style="font-weight: revert;font-size: initial;margin-bottom: 0.6rem;">Again, Why Salesforce: Import</h4>
                    <input accept=".json" class="slds-file-selector__input slds-assistive-text" type="file" id="input-file-166" multiple="" name="fileInput" part="input" aria-labelledby="form-label-166 file-selector-label-166">
                    <label class="slds-file-selector__body" id="file-selector-label-166" data-file-selector-label="" for="input-file-166" aria-hidden="true">
                        <span class="slds-file-selector__button slds-button slds-button_neutral" part="button">
                            <lightning-primitive-icon variant="bare">
                                <svg class="slds-button__icon slds-button__icon_left" focusable="false" data-key="upload" aria-hidden="true" viewBox="0 0 520 520" part="icon">
                                    <g>
                                        <path d="M485 310h-30c-8 0-15 8-15 15v100c0 8-7 15-15 15H95c-8 0-15-7-15-15V325c0-7-7-15-15-15H35c-8 0-15 8-15 15v135a40 40 0 0040 40h400a40 40 0 0040-40V325c0-7-7-15-15-15zM270 24c-6-6-15-6-21 0L114 159c-6 6-6 15 0 21l21 21c6 6 15 6 21 0l56-56c6-6 18-2 18 7v212c0 8 6 15 14 15h30c8 0 16-8 16-15V153c0-9 10-13 17-7l56 56c6 6 15 6 21 0l21-21c6-6 6-15 0-21z"></path>
                                    </g>
                                </svg>
                            </lightning-primitive-icon>Upload Files
                        </span>
                        <span class="slds-file-selector__text slds-medium-show">Or drop files</span>
                    </label>
                </div>
            </div>`;
}

/**
 * Displays the import modal for uploading tab data.
 */
function showFileImport() {
	setupTabUl.insertAdjacentHTML("beforeend", generateSldsImport());
	document.getElementById(closeModalId).addEventListener(
		"click",
		() => document.getElementById(importId).remove(),
	);
}

/**
 * Handles the imported tab data and updates the storage with the newly imported tabs.
 *
 * @param {Object} message - The message containing the imported tab data.
 * @param {Array<Object>} message.imported - The array of imported tab data.
 */
function importer(message) {
	const importedArray = message.imported;
	currentTabs.push(...importedArray);
	// remove file import
	setupTabUl.removeChild(setupTabUl.querySelector(`#${importId}`));
	setStorage(currentTabs);
}

/**
 * Reorders the tabs based on their new order in the DOM and saves the updated list to storage.
 */
function reorderTabs() {
	// get the list of tabs
	const tabs = [];
	Array.from(setupTabUl.children).slice(3).forEach((tab) => {
		const tabTitle = tab.querySelector("a > span").innerText;
		const url = cleanupUrl(tab.querySelector("a").href, true);
		if (tabTitle && url) {
			tabs.push({ tabTitle, url });
		}
	});
	setStorage(tabs);
}

// listen from saves from the action page
chrome.runtime.onMessage.addListener(function (message, _, sendResponse) {
	if (message == null || message.what == null) {
		return;
	}
	if (message.what === "saved") {
		sendResponse(null);
		afterSet();
	} else if (message.what === "add") {
		sendResponse(null);
		showFileImport();
	}
});

// listen to possible updates from tableDragHandler
addEventListener("message", (e) => {
	if (e.source != window) {
		return;
	}
	const what = e.data.what;
	if (what === "order") {
		reorderTabs();
	} else if (what === "import") {
		importer(e.data);
	}
    else if (what === "error") {
        showToast(e.data.message, false);
    }
	//else if(what === "saved")
});

// queries the currently active tab of the current active window
// this prevents showing the tabs when not in a setup page (like Sales or Service Console)
if (href.includes(setupLightning)) {
	delayLoadSetupTabs();
}
