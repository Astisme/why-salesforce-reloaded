"use strict";

const prefix = "again-why-salesforce";
const toastId = `${prefix}-toast`;
const closeModalId = `${prefix}-closeModal`;
const otherOrgId = `${prefix}-other-org`;

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
		message: { what: "expand", url, baseUrl: globalThis.origin },
	});
}

/**
 * Generates the HTML for a tab row.
 *
 * @param {Object} row - The tab data object containing title and URL.
 * @param {string} row.tabTitle - The title of the tab.
 * @param {string} row.url - The URL of the tab.
 * @returns {HTMLElement} - The generated list item element representing the tab.
 */
function _generateRowTemplate(row) {
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
				a.addEventListener("click", _handleLightningLinkClick);
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
function _generateSldsToastMessage(message, isSuccess, isWarning) {
	const toastType = isSuccess
		? (isWarning ? "info" : "success")
		: (isWarning ? "warning" : "error");

	const toastContainer = document.createElement("div");
	const randomNumber10digits = Math.floor(Math.random() * 9_000_000_000) +
		1_000_000_000;
	toastContainer.id = `${toastId}-${randomNumber10digits}`;
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
	messageSpan.innerHTML = message.replaceAll("\n", "<br />");

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


function _generateOpenOtherOrgModal(miniURL) {
    document.createElement("div");
    div.id = otherOrgId;
	document.createElement("a");
    a.id = closeModalId;
	a.href = miniURL;
    div.appendChild(a);
	return div;
}
