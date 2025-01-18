"use strict";

const prefix = "again-why-salesforce";
const toastId = `${prefix}-toast`;
const modalId = `${prefix}-modal`;
const modalConfirmId = `${prefix}-modal-confirm`;
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
			_minifiedURL = miniURL;
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
            a.addEventListener("click", _handleLightningLinkClick);

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

function generateSldsModal(title){
    const modalDiv = document.createElement("div");
    modalDiv.classList.add("DESKTOP","uiModal--medium","uiModal--recordActionWrapper","uiModal","forceModal","open","active");
    modalDiv.setAttribute("data-aura-class", "uiModal--medium uiModal--recordActionWrapper uiModal forceModal");
    modalDiv.setAttribute("aria-hidden", "false");
    modalDiv.style.display = "block";
    modalDiv.style.zIndex = "9001";

    const backdropDiv = document.createElement("div");
    backdropDiv.setAttribute("tabindex", "-1");
    backdropDiv.classList.add("modal-glass","slds-backdrop","fadein","slds-backdrop_open");
    backdropDiv.style.opacity = "0.8";
    modalDiv.appendChild(backdropDiv);

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("tabindex", "-1");
    dialog.setAttribute("aria-modal", "true");
    dialog.classList.add("panel", "slds-modal", "slds-fade-in-open");
    dialog.style.opacity = "1";
    dialog.setAttribute("aria-label", `Again, Why Salesforce: ${title}`);
    modalDiv.appendChild(dialog);

    const modalContainer = document.createElement("div");
    modalContainer.classList.add("modal-container", "slds-modal__container");
    dialog.appendChild(modalContainer);

    const modalHeader = document.createElement("div");
    modalHeader.classList.add("modal-header", "slds-modal__header", "empty", "slds-modal__header_empty");
    modalContainer.appendChild(modalHeader);

    const closeButton = document.createElement("button");
    closeButton.setAttribute("type", "button");
    closeButton.setAttribute("title", "Cancel and close");
    closeButton.classList.add("slds-button", "slds-button_icon", "slds-modal__close", "closeIcon", "slds-button_icon-bare");
    modalHeader.appendChild(closeButton);
    closeButton.addEventListener("click", () => modalDiv.remove());

    const closeIcon = document.createElement("lightning-primitive-icon");
    closeIcon.setAttribute("variant", "bare");
    closeButton.appendChild(closeIcon);

    const closeSvg = document.createElement("svg");
    closeSvg.setAttribute("focusable", "false");
    closeSvg.setAttribute("aria-hidden", "true");
    closeSvg.setAttribute("viewBox", "0 0 520 520");
    closeSvg.classList.add("slds-button__icon", "slds-button__icon_large");
    closeIcon.appendChild(closeSvg);

    const closePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    closePath.setAttribute("d", "M310 254l130-131c6-6 6-15 0-21l-20-21c-6-6-15-6-21 0L268 212a10 10 0 01-14 0L123 80c-6-6-15-6-21 0l-21 21c-6 6-6 15 0 21l131 131c4 4 4 10 0 14L80 399c-6 6-6 15 0 21l21 21c6 6 15 6 21 0l131-131a10 10 0 0114 0l131 131c6 6 15 6 21 0l21-21c6-6 6-15 0-21L310 268a10 10 0 010-14z");
    closeSvg.appendChild(closePath);

    const assistiveText = document.createElement("span");
    assistiveText.classList.add("slds-assistive-text");
    assistiveText.textContent = "Cancel and close";
    closeButton.appendChild(assistiveText);

    const modalBody = document.createElement("div");
    modalBody.id = "content_1099:0";
    modalBody.classList.add("modal-body", "scrollable", "slds-modal__content", "slds-p-around_medium");
    modalBody.setAttribute("data-scoped-scroll", "true");
    modalContainer.appendChild(modalBody);

    const viewModeDiv = document.createElement("div");
    viewModeDiv.classList.add("windowViewMode-normal", "oneRecordActionWrapper", "isModal", "active", "lafPageHost");
    viewModeDiv.setAttribute("data-aura-rendered-by", "1096:0");
    viewModeDiv.setAttribute("data-aura-class", "lafPageHost");
    modalBody.appendChild(viewModeDiv);

    const actionWrapperDiv = document.createElement("div");
    actionWrapperDiv.classList.add("isModal", "inlinePanel", "oneRecordActionWrapper");
    actionWrapperDiv.setAttribute("data-aura-rendered-by", "1139:0");
    actionWrapperDiv.setAttribute("data-aura-class", "oneRecordActionWrapper");
    viewModeDiv.appendChild(actionWrapperDiv);

    const actionBodyDiv = document.createElement("div");
    actionBodyDiv.classList.add("actionBody");
    actionBodyDiv.setAttribute("data-aura-rendered-by", "1140:0");
    actionWrapperDiv.appendChild(actionBodyDiv);

    const fieldContainerDiv = document.createElement("div");
    fieldContainerDiv.classList.add("slds-clearfix", "slds-card", "groupDependentFieldEnabled", "allow-horizontal-form", "wide-input-break", "full-width", "forceDetailPanelDesktop");
    fieldContainerDiv.setAttribute("data-aura-rendered-by", "1177:0");
    fieldContainerDiv.setAttribute("data-aura-class", "forceDetailPanelDesktop");
    actionBodyDiv.appendChild(fieldContainerDiv);

    const article = document.createElement("article");
    article.setAttribute("aria-labelledby", modalId);
    fieldContainerDiv.appendChild(article);

    const titleContainer = document.createElement("div");
    titleContainer.classList.add("inlineTitle", "slds-p-top--none", "slds-p-horizontal--medium", "slds-p-bottom--medium", "slds-text-heading--medium");
    titleContainer.style.textAlign = "center";
    titleContainer.style.display = "flex";
    titleContainer.style.alignItems = "center";
    titleContainer.style.justifyContent = "center";
    article.appendChild(titleContainer);

    const awsIcon = document.createElement("img");
    awsIcon.src = chrome.runtime.getURL("assets/icons/awsf-128.png");
    awsIcon.style.height = "2rem";
    titleContainer.appendChild(awsIcon);

    const heading = document.createElement("h2");
    heading.textContent = title;
    heading.style.marginLeft = "0.5rem";
    titleContainer.appendChild(heading);
    console.log(heading,title,awsIcon,chrome.runtime.getURL("assets/icons/awsf-128.png"))

    const legend = document.createElement("div");
    legend.classList.add("required-legend");
    article.appendChild(legend);

    const abbr = document.createElement("abbr");
    abbr.classList.add("slds-required");
    abbr.textContent = "*";
    legend.appendChild(abbr);
    legend.append("= Required Information");

    const footerContainer = document.createElement("div");
    footerContainer.classList.add("inlineFooter");
    footerContainer.setAttribute("data-aura-rendered-by", "1215:0");
    footerContainer.style.borderTop = "var(--slds-g-sizing-border-2, var(--lwc-borderWidthThick, 2px)) solid var(--slds-g-color-border-1, var(--lwc-colorBorder, rgb(229, 229, 229)))";
    actionWrapperDiv.appendChild(footerContainer);

    const buttonContainerDiv = document.createElement("div");
    buttonContainerDiv.classList.add("button-container", "slds-text-align_center", "forceRecordEditActions");
    buttonContainerDiv.setAttribute("data-aura-rendered-by", "1148:0");
    buttonContainerDiv.setAttribute("data-aura-class", "forceRecordEditActions");
    footerContainer.appendChild(buttonContainerDiv);

    const actionsContainerDiv = document.createElement("div");
    actionsContainerDiv.classList.add("actionsContainer");
    actionsContainerDiv.setAttribute("data-aura-rendered-by", "1149:0");
    buttonContainerDiv.appendChild(actionsContainerDiv);

    const pageErrorDiv = document.createElement("div");
    pageErrorDiv.classList.add("pageError", "hideEl");
    pageErrorDiv.setAttribute("data-aura-rendered-by", "1150:0");
    actionsContainerDiv.appendChild(pageErrorDiv);

    const pageErrorIconDiv = document.createElement("div");
    pageErrorIconDiv.classList.add("pageErrorIcon");
    pageErrorIconDiv.setAttribute("data-aura-rendered-by", "1151:0");
    pageErrorDiv.appendChild(pageErrorIconDiv);

    const errorButton = document.createElement("button");
    errorButton.classList.add("slds-button", "slds-button_neutral", "pageErrorIconButton", "uiButton");
    errorButton.setAttribute("aria-live", "off");
    errorButton.setAttribute("type", "button");
    errorButton.setAttribute("title", "Error");
    errorButton.setAttribute("aria-label", "");
    errorButton.setAttribute("data-aura-rendered-by", "1155:0");
    errorButton.setAttribute("data-aura-class", "uiButton");
    pageErrorIconDiv.appendChild(errorButton);

    const lightningIcon = document.createElement("lightning-icon");
    lightningIcon.classList.add("slds-icon-utility-warning", "slds-icon_container");
    lightningIcon.setAttribute("icon-name", "utility:warning");
    lightningIcon.setAttribute("data-data-rendering-service-uid", "338");
    lightningIcon.setAttribute("data-aura-rendered-by", "1153:0");
    errorButton.appendChild(lightningIcon);

    const spanElement = document.createElement("span");
    spanElement.setAttribute("style", "--sds-c-icon-color-background: var(--slds-c-icon-color-background, transparent)");
    spanElement.setAttribute("part", "boundary");
    lightningIcon.appendChild(spanElement);

    const lightningPrimitiveIcon = document.createElement("lightning-primitive-icon");
    lightningPrimitiveIcon.setAttribute("exportparts", "icon");
    lightningPrimitiveIcon.setAttribute("size", "x-small");
    lightningPrimitiveIcon.setAttribute("variant", "error");
    spanElement.appendChild(lightningPrimitiveIcon);

    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.classList.add("slds-icon", "slds-icon-text-error", "slds-icon_x-small");
    svgElement.setAttribute("focusable", "false");
    svgElement.setAttribute("aria-hidden", "true");
    svgElement.setAttribute("viewBox", "0 0 520 520");
    svgElement.setAttribute("part", "icon");
    lightningPrimitiveIcon.appendChild(svgElement);

    const gElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgElement.appendChild(gElement);

    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute("d", "M514 425L285 55a28 28 0 00-50 0L6 425c-14 23 0 55 25 55h458c25 0 40-32 25-55zm-254-25c-17 0-30-13-30-30s13-30 30-30 30 13 30 30-13 30-30 30zm30-90c0 6-4 10-10 10h-40c-6 0-10-4-10-10V180c0-6 4-10 10-10h40c6 0 10 4 10 10v130z");
    gElement.appendChild(pathElement);
    gElement.appendChild(pathElement.cloneNode());

    const buttonContainerInnerDiv = document.createElement("div");
    buttonContainerInnerDiv.classList.add("button-container-inner");
    buttonContainerInnerDiv.setAttribute("data-aura-rendered-by", "1161:0");
    actionsContainerDiv.appendChild(buttonContainerInnerDiv);

    const cancelButton = document.createElement("button");
    cancelButton.classList.add("slds-button", "slds-button_neutral", "uiButton--neutral", "uiButton", "forceActionButton");
    cancelButton.setAttribute("aria-live", "off");
    cancelButton.setAttribute("type", "button");
    cancelButton.setAttribute("title", "Cancel");
    cancelButton.setAttribute("aria-label", "");
    cancelButton.setAttribute("data-aura-rendered-by", "1364:0");
    cancelButton.setAttribute("data-aura-class", "uiButton forceActionButton");
    buttonContainerInnerDiv.appendChild(cancelButton);
    cancelButton.addEventListener("click", () => closeButton.click());

    const cancelSpan = document.createElement("span");
    cancelSpan.classList.add("label", "bBody");
    cancelSpan.setAttribute("dir", "ltr");
    cancelSpan.setAttribute("data-aura-rendered-by", "1367:0");
    cancelSpan.textContent = "Cancel";
    cancelButton.appendChild(cancelSpan);

    const saveButton = document.createElement("button");
    saveButton.id = modalConfirmId;
    saveButton.classList.add("slds-button", "slds-button_neutral", "uiButton--brand", "uiButton", "forceActionButton");
    saveButton.setAttribute("aria-live", "off");
    saveButton.setAttribute("type", "button");
    saveButton.setAttribute("title", "Save");
    saveButton.setAttribute("aria-label", "");
    saveButton.setAttribute("data-aura-rendered-by", "1380:0");
    saveButton.setAttribute("data-aura-class", "uiButton forceActionButton");
    buttonContainerInnerDiv.appendChild(saveButton);

    const saveSpan = document.createElement("span");
    saveSpan.classList.add("label", "bBody");
    saveSpan.setAttribute("dir", "ltr");
    saveSpan.setAttribute("data-aura-rendered-by", "1383:0");
    saveSpan.textContent = "Save";
    saveButton.appendChild(saveSpan);

    return { modalDiv, article, saveButton };
}

function _generateOpenOtherOrgModal(miniURL, tabTitle) {
    const { modalDiv, article, saveButton } = generateSldsModal(tabTitle);

    

    return { modalDiv, saveButton };
}
