"use strict";

const prefix = "again-why-salesforce";
const toastId = `${prefix}-toast`;
const importId = `${prefix}-import`;
const importFileId = `${importId}-file`;
const overrideId = `${prefix}-override`;
const duplicateId = `${prefix}-duplicate`;
/**
 * Generates the HTMLElement for the import modal.
 *
 * @returns {HTMLElement} - The HTMLElement used to import data.
 */
function _generateSldsImport() {
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
	inputFile.id = importFileId;
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
	fileLabel.setAttribute("for", importFileId);
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

	const overrideCheckboxLabel = document.createElement("label");
	const overrideCheckbox = document.createElement("input");
	overrideCheckbox.type = "checkbox";
	overrideCheckbox.id = overrideId;
	overrideCheckbox.name = "override-tabs";
	overrideCheckbox.checked = false;
	overrideCheckboxLabel.appendChild(overrideCheckbox);
	overrideCheckboxLabel.append("Override saved tabs.");
	modal.appendChild(overrideCheckboxLabel);

	const duplicateCheckboxLabel = document.createElement("label");
	const duplicateCheckbox = document.createElement("input");
	duplicateCheckbox.type = "checkbox";
	duplicateCheckbox.id = duplicateId;
	duplicateCheckbox.name = "duplicate-tabs";
	duplicateCheckbox.checked = true;
	duplicateCheckboxLabel.appendChild(duplicateCheckbox);
	duplicateCheckboxLabel.append("Skip duplicate tabs.");
	modal.appendChild(duplicateCheckboxLabel);

	return container;
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
function generateSldsToastMessage(message, isSuccess, isWarning) {
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
