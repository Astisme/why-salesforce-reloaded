"use strict";

let setupTabUl; // This is on Salesforce Setup
let href = globalThis.location.href;
let minifiedURL;
let _expandedURL;
const baseUrl = globalThis.origin; // https://www.myorgdomain.my.salesforce-setup.com
const setupLightning = "/lightning/setup/";
const currentTabs = [];

const prefix = "again-why-salesforce";
const buttonId = `${prefix}-button`;
const starId = `${prefix}-star`;
const slashedStarId = `${prefix}-slashed-star`;
const toastId = `${prefix}-toast`;
const importId = `${prefix}-import`;
const closeModalId = `${prefix}-closeModal`;
const overrideId = `${prefix}-override`;
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
function expandURL(url) {
	return chrome.runtime.sendMessage({
		message: { what: "expand", url, baseUrl },
	});
}

/**
 * Picks a link target between _blank and _top based on whether the user is click CTRL or the meta key.
 *
 * @param {Event} e - the click event
 * @returns {String} "_blank" | "_top"
 */
function getLinkTarget(e) {
	return (e.ctrlKey || e.metaKey) ? "_blank" : "_top";
}
/**
 * Handles the redirection to another Salesforce page without requiring a full reload.
 *
 * @param {Event} e - the click event
 */
function handleLightningLinkClick(e) {
	e.preventDefault(); // Prevent the default link behavior (href navigation)
	const url = e.currentTarget.href;
	const aTarget = e.currentTarget.target;
	const target = aTarget || getLinkTarget(e);
	// open link into new page when requested or if the user is clicking the favourite tab one more time
	if (target === "_blank" || url === href) {
		open(url, target);
	} else {
		postMessage({
			what: "lightningNavigation",
			navigationType: "url",
			url,
			fallbackURL: url,
		}, "*");
	}
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
	const { tabTitle, url } = row;
	const miniURLpromise = minifyURL(url);
	const expURLpromise = expandURL(url);

	return Promise.all([miniURLpromise, expURLpromise])
		.then(([miniURL, expURL]) => {
			minifiedURL = miniURL;
			_expandedURL = expURL;

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
			a.setAttribute("title", miniURL);
			a.setAttribute("aria-selected", "false");
			a.setAttribute("href", expURL);
			a.classList.add("tabHeader", "slds-context-bar__label-action");
			a.style.zIndex = 0;
			if (expURL.includes(setupLightning)) {
				a.addEventListener("click", handleLightningLinkClick);
			}

			const span = document.createElement("span");
			span.classList.add("title", "slds-truncate");
			span.textContent = tabTitle;

			a.appendChild(span);
			li.appendChild(a);

			// Highlight the tab related to the current page
			if (href === expURL) {
				li.classList.add("slds-is-active");
			}

			return li;
		});
}

/**
 * Generates the Element for a toast message.
 *
 * @param {string} message - The message to display in the toast.
 * @param {boolean} isSuccess - Indicates whether the message is a success or error.
 * @returns {HTMLElement} - The generated element for the toast message.
 */
function generateSldsToastMessage(message, isSuccess) {
	const toastType = isSuccess ? "success" : "error";

	const toastContainer = document.createElement("div");
	toastContainer.id = toastId;
	toastContainer.classList.add(
		"toastContainer",
		"slds-notify_container",
		"slds-is-relative",
	);
	toastContainer.setAttribute("data-aura-rendered-by", "7381:0");

	const toast = document.createElement("div");
	toast.setAttribute("role", "alertdialog");
	toast.setAttribute("aria-describedby", "toastDescription7382:0");
	toast.setAttribute("aria-label", toastType);
	toast.setAttribute("data-key", toastType);
	toast.classList.add(
		`slds-theme--${toastType}`,
		"slds-notify--toast",
		"slds-notify",
		"slds-notify--toast",
		"forceToastMessage",
	);
	toast.setAttribute("data-aura-rendered-by", "7384:0");
	toast.setAttribute("data-aura-class", "forceToastMessage");

	const iconContainer = document.createElement("lightning-icon");
	iconContainer.setAttribute("icon-name", `utility:${toastType}`);
	iconContainer.classList.add(
		`slds-icon-utility-${toastType}`,
		"toastIcon",
		"slds-m-right--small",
		"slds-no-flex",
		"slds-align-top",
		"slds-icon_container",
	);
	iconContainer.setAttribute("data-data-rendering-service-uid", "1478");
	iconContainer.setAttribute("data-aura-rendered-by", "7386:0");

	const boundarySpan = document.createElement("span");
	boundarySpan.style.cssText =
		"--sds-c-icon-color-background: var(--slds-c-icon-color-background, transparent)";
	boundarySpan.setAttribute("part", "boundary");

	const primitiveIcon = document.createElement("lightning-primitive-icon");
	primitiveIcon.setAttribute("size", "small");
	primitiveIcon.setAttribute("variant", "inverse");

	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.classList.add("slds-icon", "slds-icon_small");
	svg.setAttribute("focusable", "false");
	svg.setAttribute("data-key", toastType);
	svg.setAttribute("aria-hidden", "true");
	svg.setAttribute("viewBox", "0 0 520 520");
	svg.setAttribute("part", "icon");

	const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path.setAttribute(
		"d",
		isSuccess
			? "M260 20a240 240 0 100 480 240 240 0 100-480zm134 180L241 355c-6 6-16 6-22 0l-84-85c-6-6-6-16 0-22l22-22c6-6 16-6 22 0l44 45a10 10 0 0015 0l112-116c6-6 16-6 22 0l22 22c7 6 7 16 0 23z"
			: "M260 20C128 20 20 128 20 260s108 240 240 240 240-108 240-240S392 20 260 20zM80 260a180 180 0 01284-147L113 364a176 176 0 01-33-104zm180 180c-39 0-75-12-104-33l251-251a180 180 0 01-147 284z",
	);

	// Assemble icon
	g.appendChild(path);
	svg.appendChild(g);
	primitiveIcon.appendChild(svg);
	boundarySpan.appendChild(primitiveIcon);
	iconContainer.appendChild(boundarySpan);

	const assistiveText = document.createElement("span");
	assistiveText.classList.add("slds-assistive-text");
	assistiveText.textContent = toastType;
	iconContainer.appendChild(assistiveText);

	const toastContent = document.createElement("div");
	toastContent.classList.add("toastContent", "slds-notify__content");
	toastContent.setAttribute("data-aura-rendered-by", "7387:0");

	const contentInner = document.createElement("div");
	contentInner.classList.add("slds-align-middle", "slds-hyphenate");
	contentInner.setAttribute("data-aura-rendered-by", "7388:0");

	const descriptionDiv = document.createElement("div");
	descriptionDiv.id = "toastDescription7382:0";
	descriptionDiv.setAttribute("data-aura-rendered-by", "7390:0");

	const messageSpan = document.createElement("span");
	messageSpan.classList.add(
		"toastMessage",
		"slds-text-heading--small",
		"forceActionsText",
	);
	messageSpan.setAttribute("data-aura-rendered-by", "7395:0");
	messageSpan.setAttribute("data-aura-class", "forceActionsText");
	messageSpan.textContent = message;

	// Assemble the message
	descriptionDiv.appendChild(messageSpan);
	contentInner.appendChild(descriptionDiv);
	toastContent.appendChild(contentInner);

	// Assemble the toast
	toast.appendChild(iconContainer);
	toast.appendChild(toastContent);
	toastContainer.appendChild(toast);

	return toastContainer;
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
	const toastElement = generateSldsToastMessage(message, isSuccess);
	hanger.appendChild(toastElement);
	setTimeout(() => {
		hanger.removeChild(document.getElementById(toastElement.id));
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
		{ tabTitle: "Flows", url: "/lightning/app/standard__FlowsApp" },
		{ tabTitle: "Users", url: "ManageUsers/home" },
	];
	setStorage(tabs);
	return tabs;
}

/**
 * Generates the element for the favourite button.
 *
 * @returns {Element} - The generated element for the favourite button.
 */
function generateFavouriteButton() {
	const star = chrome.runtime.getURL("assets/svgs/star.svg");
	const slashedStar = chrome.runtime.getURL("assets/svgs/slashed-star.svg");

	const button = document.createElement("button");
	button.setAttribute("id", buttonId);
	button.classList.add("slds-button", "slds-button--neutral", "uiButton");
	button.setAttribute("type", "button");
	button.setAttribute("aria-live", "off");
	button.setAttribute("aria-label", "");
	button.setAttribute("data-aura-rendered-by", "3:829;a");
	button.setAttribute("data-aura-class", "uiButton");

	const span = document.createElement("span");
	span.classList.add("label", "bBody");
	span.setAttribute("dir", "ltr");
	span.setAttribute("data-aura-rendered-by", "6:829;a");

	function createImageElement(id, src, alt) {
		const img = document.createElement("img");
		img.setAttribute("id", id);
		img.setAttribute("src", src);
		img.setAttribute("alt", alt);
		img.setAttribute(
			"style",
			"height: 2rem; filter: invert(60%) sepia(100%) saturate(500%) hue-rotate(170deg) brightness(90%);",
		);

		const span = document.createElement("span");
		span.textContent = alt;
		span.classList.add("hidden", id);

		img.addEventListener("error", function () {
			if (!img.classList.contains("hidden")) {
				span.classList.remove("hidden");
			}
			img.remove();
		});

		return { img, span };
	}

	const { img: starImg, span: starSpan } = createImageElement(
		starId,
		star,
		"Save as Tab",
	);

	const { img: slashedStarImg, span: slashedStarSpan } = createImageElement(
		slashedStarId,
		slashedStar,
		"Remove Tab",
	);
	slashedStarSpan.classList.add("hidden");

	const style = document.createElement("style");
	style.textContent = ".hidden { display: none; }";

	span.appendChild(starImg);
	span.appendChild(starSpan);
	span.appendChild(slashedStarImg);
	span.appendChild(slashedStarSpan);
	span.appendChild(style);
	button.appendChild(span);

	return button;
}

/**
 * Toggles the visibility of the favourite button based on whether the tab is saved.
 *
 * @param {HTMLElement} button - The favourite button element.
 * @param {boolean} isSaved - Optional flag indicating whether the tab is saved.
 */
function toggleFavouriteButton(button, isSaved) {
	// will use the class identifier if there was an error with the image (and was removed)
	const star = button.querySelector(`#${starId}`) ??
		button.querySelector(`.${starId}`);
	const slashedStar = button.querySelector(`#${slashedStarId}`) ??
		button.querySelector(`.${slashedStarId}`);
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
	minifyURL(href)
		.then((url) => {
			minifiedURL = url;

			if (isCurrentlyOnSavedTab) {
				const filteredTabs = currentTabs.filter((tabdef) => {
					return tabdef.url !== url;
				});
				currentTabs.length = 0;
				currentTabs.push(...filteredTabs);
			} else {
				const tabTitle =
					parent.querySelector(".breadcrumbDetail").innerText;
				currentTabs.push({ tabTitle, url });
			}

			toggleFavouriteButton(parent.querySelector(`#${buttonId}`));
			setStorage(currentTabs);
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
		return setTimeout(showFavouriteButton(), 5000);
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
		if (header.querySelector(`#${buttonId}`) != null) { // already inserted my button
			continue;
		}
		header.appendChild(generateFavouriteButton());
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

	rowObj.forEach((row) =>
		generateRowTemplate(row)
			.then((r) => setupTabUl.appendChild(r))
	);
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
	getStorage(init);
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
 * Generates the HTMLElement for the import modal.
 *
 * @returns {HTMLElement} - The HTMLElement used to import data.
 */
function generateSldsImport() {
	const style = document.createElement("style");
	style.textContent = `
        #${importId} {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            left: 0;
        }
        #${importId} > .overlay {
            position: absolute;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 2;
            top: 0;
            left: 0;
            pointer-events: all;
        }
        #${importId} > .modal {
            position: absolute;
            background-color: lightgoldenrodyellow;
            top: 2rem;
            width: 18rem;
            height: 8rem;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            border: 1px solid lightskyblue;
            border-radius: 1rem;
            flex-direction: column;
            box-shadow: 1px 2px 3px black;
            z-index: 3;
        }
        #${closeModalId} {
            position: absolute;
            top: 0rem;
            right: 0rem;
            width: 1.5rem;
            height: 1.5rem;
            background: lightskyblue;
            border: 1px solid black;
            color: black;
            font-size: 1.2rem;
            cursor: pointer;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }
        #${closeModalId} > span {
            transform: translateY(-2px) translateX(1px);
        }
        .modal-header {
            font-weight: revert;
            font-size: initial;
            margin-bottom: 0.6rem;
        }
        .slds-file-selector__body {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
        .slds-file-selector__text {
            margin-left: 0.5rem;
        }
    `;

	const container = document.createElement("div");
	container.id = importId;
	container.appendChild(style);

	const overlay = document.createElement("div");
	overlay.classList.add("overlay");
	container.appendChild(overlay);

	const modal = document.createElement("div");
	modal.classList.add("modal");
	container.appendChild(modal);

	const closeButton = document.createElement("button");
	closeButton.id = closeModalId;
	const closeSpan = document.createElement("span");
	closeSpan.innerHTML = "&times;";
	closeButton.appendChild(closeSpan);
	modal.appendChild(closeButton);

	const header = document.createElement("h4");
	header.classList.add("modal-header");
	header.textContent = "Again, Why Salesforce: Import";
	modal.appendChild(header);

	const inputFile = document.createElement("input");
	inputFile.type = "file";
	inputFile.id = "input-file-166";
	inputFile.accept = ".json";
	inputFile.classList.add("slds-file-selector__input", "slds-assistive-text");
	inputFile.setAttribute("multiple", "");
	inputFile.setAttribute("name", "fileInput");
	inputFile.setAttribute("part", "input");
	inputFile.setAttribute(
		"aria-labelledby",
		"form-label-166 file-selector-label-166",
	);
	modal.appendChild(inputFile);

	const fileLabel = document.createElement("label");
	fileLabel.classList.add("slds-file-selector__body");
	fileLabel.id = "file-selector-label-166";
	fileLabel.setAttribute("for", "input-file-166");
	fileLabel.setAttribute("aria-hidden", "true");

	const buttonSpan = document.createElement("span");
	buttonSpan.classList.add(
		"slds-file-selector__button",
		"slds-button",
		"slds-button_neutral",
	);
	buttonSpan.setAttribute("part", "button");

	const icon = document.createElement("lightning-primitive-icon");
	icon.setAttribute("variant", "bare");

	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("class", "slds-button__icon slds-button__icon_left");
	svg.setAttribute("focusable", "false");
	svg.setAttribute("data-key", "upload");
	svg.setAttribute("aria-hidden", "true");
	svg.setAttribute("viewBox", "0 0 520 520");
	svg.setAttribute("part", "icon");

	const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path.setAttribute(
		"d",
		"M485 310h-30c-8 0-15 8-15 15v100c0 8-7 15-15 15H95c-8 0-15-7-15-15V325c0-7-7-15-15-15H35c-8 0-15 8-15 15v135a40 40 0 0040 40h400a40 40 0 0040-40V325c0-7-7-15-15-15zM270 24c-6-6-15-6-21 0L114 159c-6 6-6 15 0 21l21 21c6 6 15 6 21 0l56-56c6-6 18-2 18 7v212c0 8 6 15 14 15h30c8 0 16-8 16-15V153c0-9 10-13 17-7l56 56c6 6 15 6 21 0l21-21c6-6 6-15 0-21z",
	);
	g.appendChild(path);
	svg.appendChild(g);
	icon.appendChild(svg);
	buttonSpan.appendChild(icon);
	buttonSpan.append("Upload Files");

	const textSpan = document.createElement("span");
	textSpan.classList.add("slds-file-selector__text", "slds-medium-show");
	textSpan.textContent = "Or drop files";
	fileLabel.appendChild(buttonSpan);
	fileLabel.appendChild(textSpan);

	modal.appendChild(fileLabel);

	const checkboxLabel = document.createElement("label");
	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.id = overrideId;
	checkbox.name = "override-tabs";
	checkbox.value = "false";
	checkboxLabel.appendChild(checkbox);
	checkboxLabel.append("Override saved tabs");
	modal.appendChild(checkboxLabel);

	return container;
}

let overridePick;
/**
 * Displays the import modal for uploading tab data.
 */
function showFileImport() {
	if (setupTabUl.querySelector(`#${importId}`) != null) {
		return;
	}

	setupTabUl.appendChild(generateSldsImport());
	setupTabUl.querySelector(`#${closeModalId}`).addEventListener(
		"click",
		() => setupTabUl.querySelector(`#${importId}`).remove(),
	);
	overridePick = false;
	setupTabUl.querySelector(`#${overrideId}`).addEventListener(
		"click",
		() => overridePick = !overridePick,
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
	if (overridePick) {
		currentTabs.length = 0;
	}
	currentTabs.push(...importedArray);
	// remove file import
	setupTabUl.removeChild(setupTabUl.querySelector(`#${importId}`));
	setStorage(currentTabs);
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
	} else if (what === "error") {
		showToast(e.data.message, false);
	}
	//else if(what === "saved")
});

// queries the currently active tab of the current active window
// this prevents showing the tabs when not in a setup page (like Sales or Service Console)
if (href.includes(setupLightning)) {
	delayLoadSetupTabs();
}
