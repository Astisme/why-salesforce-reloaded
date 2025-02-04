"use strict";

const prefix = "again-why-salesforce";
const toastId = `${prefix}-toast`;
const modalId = `${prefix}-modal`;
const modalConfirmId = `${prefix}-modal-confirm`;

/**
 * Generates a random number with the specified number of digits.
 *
 * @param {number} digits - The number of digits for the random number. Must be greater than 1.
 * @returns {number|null} A random number with the specified number of digits, or `null` if `digits <= 1`.
 *
 * - If `digits <= 1`, returns `null`.
 * - Calculates the lower bound as 10^(digits - 1) (e.g., 10 for 2 digits, 100 for 3 digits).
 * - Multiplies a random value (0 to 1) by the range (9 * 10^(digits - 1)) and adds the lower bound.
 * - Ensures the result is a whole number with the correct number of digits.
 */
function getRng_n_digits(digits = 1) {
	if (digits <= 1) {
		return null;
	}
	const tenToTheDigits = Math.pow(10, digits - 1);
	return Math.floor(Math.random() * 9 * tenToTheDigits) +
		tenToTheDigits;
}

/**
 * Expands a URL by adding the domain and the Salesforce setup parts.
 * This function undoes what sf_minifyURL did to a URL.
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
function sf_expandURL(url) {
	return sf_sendMessage({ what: "expand", url, baseUrl: globalThis.origin });
}

/**
 * Handles the redirection to another Salesforce page without requiring a full reload.
 *
 * @param {Event} e - the click event
 */
function handleLightningLinkClick(e) {
	e.preventDefault();

	/**
	 * Picks a link target between _blank and _top based on whether the user is click CTRL or the meta key.
	 * If the link goes outside of setup, always returns _blank.
	 *
	 * @param {Event} e - the click event
	 * @returns {String} "_blank" | "_top"
	 */
	function getLinkTarget(e, url) {
		return e.ctrlKey || e.metaKey || !url.includes(setupLightning)
			? "_blank"
			: "_top";
	}
	const url = e.currentTarget.href;
	const target = e.currentTarget.target ?? getLinkTarget(e, url);
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
 * @param {string} row.org - The org of the org-specific tab.
 * @returns {HTMLElement} - The generated list item element representing the tab.
 */
function _generateRowTemplate(row) {
	const { tabTitle, url } = row;
	const miniURLpromise = sf_minifyURL(url);
	const expURLpromise = sf_expandURL(url);

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
			a.addEventListener("click", handleLightningLinkClick);

			const span = document.createElement(row.org == null ? "span" : "b");
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
	if (
		message == null || message === "" | isSuccess == null ||
		isWarning == null
	) {
		throw new Error("Unable to generate Toast Message.");
	}

	const toastType = isSuccess
		? (isWarning ? "info" : "success")
		: (isWarning ? "warning" : "error");

	const toastContainer = document.createElement("div");
	const randomNumber10digits = getRng_n_digits(10);
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
 * Creates and returns an abbreviation element indicating a required field.
 *
 * The function constructs an <abbr> element, applies the "slds-required" class,
 * sets the "title" attribute to "required" and the "part" attribute to "required",
 * and sets its text content to an asterisk ("*").
 *
 * @returns {HTMLElement} The <abbr> element representing the required indicator.
 */
function generateRequired() {
	const requiredElement = document.createElement("abbr");
	requiredElement.classList.add("slds-required");
	requiredElement.setAttribute("title", "required");
	requiredElement.setAttribute("part", "required");
	requiredElement.textContent = "*";
	return requiredElement;
}

/**
 * Generates a customizable input element wrapped in a Salesforce-styled form structure.
 *
 * @param {Object} config - Configuration object for the input.
 * @param {string} config.label - The label text for the input.
 * @param {string} [config.type="text"] - The type of the input element (e.g., "text", "password").
 * @param {boolean} [config.required=false] - Indicates if the input is required.
 * @param {string|null} [config.placeholder=null] - Placeholder text for the input.
 * @param {Object|null} [config.prepend=null] - Configuration for an input element to prepend.
 * @param {Object|null} [config.append=null] - Configuration for an input element to append.
 * @param {string|null} [config.style=null] - Additional inline styles for the main input element.
 *
 * @returns {Object} - An object containing:
 *   - `inputParent`: The parent `div` containing the entire input structure.
 *   - `inputContainer`: The main input element.
 *
 * - Dynamically generates a unique `id` for the input using `getRng_n_digits(10)`.
 * - Wraps the input in a Salesforce-styled stacked form element.
 * - Supports additional inputs before (`prepend`) or after (`append`) the main input.
 * - Applies optional attributes like `placeholder`, `required`, and `style`.
 * - Maintains Salesforce Lightning Design System (SLDS) styling conventions.
 */
function generateInput({
	label,
	type = "text",
	required = false,
	placeholder = null,
	prepend = null,
	append = null,
	style = null,
}) {
	const inputParent = document.createElement("div");
	inputParent.setAttribute("name", "input");

	const formElement = document.createElement("div");
	formElement.classList.add("slds-form-element", "slds-form-element_stacked");
	formElement.setAttribute("variant", "label-stacked");
	inputParent.appendChild(formElement);

	const exportParts = document.createElement("div");
	exportParts.setAttribute(
		"exportparts",
		"input-text, input-container, input, required",
	);
	exportParts.setAttribute("variant", "label-stacked");
	formElement.appendChild(exportParts);

	const formElementLabel = document.createElement("div");
	formElementLabel.classList.add("slds-form-element__label", "slds-no-flex");
	formElementLabel.setAttribute("part", "input-text");
	formElementLabel.style.display = "unset"; // makes the elements inside have full width
	exportParts.appendChild(formElementLabel);

	const inputId = `${prefix}-${getRng_n_digits(10)}`;
	const labelElement = document.createElement("label");
	labelElement.classList.add("slds-form-element__label", "slds-no-flex");
	labelElement.setAttribute("for", inputId);
	formElementLabel.appendChild(labelElement);

	if (required) {
		labelElement.appendChild(generateRequired());
	}
	labelElement.append(label);

	const inputWrapper = document.createElement("div");
	inputWrapper.classList.add("slds-form-element__control", "slds-grow");
	inputWrapper.setAttribute("part", "input-container");
	inputWrapper.setAttribute("type", type);
	formElementLabel.appendChild(inputWrapper);

	function createInputElement(
		{
			id = null,
			label = null,
			type,
			placeholder,
			required = false,
			enabled = true,
			style = null,
		},
	) {
		const input = document.createElement("input");
		input.classList.add("slds-input");
		input.setAttribute("part", "input");
		input.setAttribute("maxlength", "255");

		id && (input.id = id);
		label && input.setAttribute("name", label);
		type && input.setAttribute("type", type);
		placeholder && input.setAttribute("placeholder", placeholder);
		required && input.setAttribute("required", true);
		enabled == false && input.setAttribute("disabled", true);
		style && (input.style = style);

		return input;
	}

	if (prepend != null) {
		inputWrapper.appendChild(createInputElement(prepend));
	}
	const inputContainer = createInputElement({
		id: inputId,
		label,
		type,
		placeholder,
		required,
		style,
	});
	inputWrapper.appendChild(inputContainer);
	if (append != null) {
		inputWrapper.appendChild(createInputElement(append));
	}

	return { inputParent, inputContainer };
}

/**
 * Generates a customizable Salesforce-styled section with a title and a layout structure.
 *
 * @param {string} sectionTitle - The title of the section to be displayed.
 *
 * @returns {Object} - An object containing:
 *   - `section`: The root `records-record-layout-section` element that wraps the section.
 *   - `divParent`: A container div element for additional content inside the section.
 *
 * - Creates a `records-record-layout-section` component with a nested layout adhering to Salesforce's design standards.
 * - Includes a section title styled with SLDS (Salesforce Lightning Design System).
 * - Builds a nested grid layout inside the section for content organization.
 * - Adds empty slots (`divParent` and cloned `borderSpacer`) for future customization or dynamic content injection.
 */
function generateSection(sectionTitle = null) {
	const section = document.createElement("records-record-layout-section");
	section.setAttribute("lwc-692i7qiai51-host", "");

	if (sectionTitle != null) {
		const newDiv = document.createElement("div");
		newDiv.setAttribute("lwc-mlenr16lk9", "");
		newDiv.classList.add("slds-card__body", "slds-card__body_inner");
		section.appendChild(newDiv);

		const innerDiv = document.createElement("div");
		innerDiv.setAttribute("lwc-mlenr16lk9", "");
		innerDiv.classList.add(
			"section-layout-container",
			"slds-section",
			"slds-is-open",
		);
		newDiv.appendChild(innerDiv);

		const h3 = document.createElement("h3");
		h3.setAttribute("lwc-mlenr16lk9", "");
		h3.classList.add(
			"label",
			"slds-section__title",
			"slds-truncate",
			"slds-p-around_x-small",
			"slds-theme_shade",
		);
		h3.setAttribute("data-target-reveals", "");
		innerDiv.appendChild(h3);

		const span = document.createElement("span");
		span.setAttribute("lwc-mlenr16lk9", "");
		span.classList.add("slds-truncate");
		span.setAttribute("title", sectionTitle);
		span.textContent = sectionTitle;
		h3.appendChild(span);
	}

	const progressiveContainer = document.createElement("div");
	progressiveContainer.classList.add(
		"section-content",
		"slds-size_1-of-1",
		"slds-grid",
	);
	section.appendChild(progressiveContainer);

	const borderSpacer = document.createElement("div");
	borderSpacer.classList.add("column", "flex-width");
	borderSpacer.setAttribute("slot", "columns");
	progressiveContainer.appendChild(borderSpacer);

	const columns = document.createElement("div");
	columns.classList.add(
		"slds-col",
		"slds-p-horizontal_small",
		"slds-p-vertical_x-small",
	);
	borderSpacer.appendChild(columns);

	const gridCols = document.createElement("div");
	gridCols.classList.add("slds-grid", "slds-col", "slds-has-flexi-truncate");
	gridCols.setAttribute("role", "listitem");
	columns.appendChild(gridCols);

	const gridStack = document.createElement("div");
	gridStack.classList.add("slds-grid", "slds-size_1-of-1", "label-stacked");
	gridCols.appendChild(gridStack);

	const hanger = document.createElement("div");
	hanger.classList.add("slds-size_1-of-1", "field_textarea");
	gridStack.appendChild(hanger);

	const divParent = document.createElement("div");
	progressiveContainer.appendChild(divParent);

	progressiveContainer.appendChild(borderSpacer.cloneNode(true));

	return { section, divParent };
}

/**
 * Generates a Salesforce Lightning Design System (SLDS)-styled modal dialog.
 *
 * @param {string} modalTitle - The title of the modal.
 * @returns {Object} An object containing key elements of the modal:
 * - modalParent: The main modal container element.
 * - article: The content area within the modal.
 * - saveButton: The save button element for user actions.
 * - closeButton: The close button element for closing the modal.
 */
function generateSldsModal(modalTitle) {
	const modalParent = document.createElement("div");
	modalParent.id = modalId;
	modalParent.classList.add(
		"DESKTOP",
		"uiModal--medium",
		"uiModal--recordActionWrapper",
		"uiModal",
		"forceModal",
		"open",
		"active",
	);
	modalParent.setAttribute(
		"data-aura-class",
		"uiModal--medium uiModal--recordActionWrapper uiModal forceModal",
	);
	modalParent.setAttribute("aria-hidden", "false");
	modalParent.style.display = "block";
	modalParent.style.zIndex = "9001";

	const backdropDiv = document.createElement("div");
	backdropDiv.setAttribute("tabindex", "-1");
	backdropDiv.classList.add(
		"modal-glass",
		"slds-backdrop",
		"fadein",
		"slds-backdrop_open",
	);
	backdropDiv.style.opacity = "0.8";
	modalParent.appendChild(backdropDiv);

	const dialog = document.createElement("div");
	dialog.setAttribute("role", "dialog");
	dialog.setAttribute("tabindex", "-1");
	dialog.setAttribute("aria-modal", "true");
	dialog.classList.add("panel", "slds-modal", "slds-fade-in-open");
	dialog.style.opacity = "1";
	dialog.setAttribute(
		"aria-label",
		`Again, Why Salesforce${
			modalTitle != null && modalTitle !== "" ? ": " + modalTitle : ""
		}`,
	);
	//dialog.addEventListener("wheel", e => e.preventDefault());
	modalParent.appendChild(dialog);

	const modalContainer = document.createElement("div");
	modalContainer.classList.add("modal-container", "slds-modal__container");
	dialog.appendChild(modalContainer);

	const modalHeader = document.createElement("div");
	modalHeader.classList.add(
		"modal-header",
		"slds-modal__header",
		"empty",
		"slds-modal__header_empty",
	);
	modalContainer.appendChild(modalHeader);

	const closeButton = document.createElement("button");
	closeButton.setAttribute("type", "button");
	closeButton.setAttribute("title", "Cancel and close");
	closeButton.classList.add(
		"slds-button",
		"slds-button_icon",
		"slds-modal__close",
		"closeIcon",
		"slds-button_icon-bare",
	);
	modalHeader.appendChild(closeButton);
	closeButton.addEventListener("click", () => modalParent.remove());
	backdropDiv.addEventListener("click", () => closeButton.click());

	const closeIcon = document.createElement("lightning-primitive-icon");
	closeIcon.setAttribute("variant", "bare");
	closeButton.appendChild(closeIcon);

	const closeSvg = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"svg",
	);
	closeSvg.setAttribute("focusable", "false");
	closeSvg.setAttribute("aria-hidden", "true");
	closeSvg.setAttribute("viewBox", "0 0 520 520");
	closeSvg.classList.add("slds-button__icon", "slds-button__icon_large");
	closeIcon.appendChild(closeSvg);

	const closeGroupElement = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"g",
	);
	closeSvg.appendChild(closeGroupElement);

	const closePath = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"path",
	);
	closePath.setAttribute(
		"d",
		"M310 254l130-131c6-6 6-15 0-21l-20-21c-6-6-15-6-21 0L268 212a10 10 0 01-14 0L123 80c-6-6-15-6-21 0l-21 21c-6 6-6 15 0 21l131 131c4 4 4 10 0 14L80 399c-6 6-6 15 0 21l21 21c6 6 15 6 21 0l131-131a10 10 0 0114 0l131 131c6 6 15 6 21 0l21-21c6-6 6-15 0-21L310 268a10 10 0 010-14z",
	);
	closeGroupElement.appendChild(closePath);

	const assistiveText = document.createElement("span");
	assistiveText.classList.add("slds-assistive-text");
	assistiveText.textContent = "Cancel and close";
	closeButton.appendChild(assistiveText);

	const modalBody = document.createElement("div");
	modalBody.id = "content_1099:0";
	modalBody.classList.add(
		"modal-body",
		"scrollable",
		"slds-modal__content",
		"slds-p-around_medium",
	);
	modalBody.setAttribute("data-scoped-scroll", "true");
	modalContainer.appendChild(modalBody);

	const viewModeDiv = document.createElement("div");
	viewModeDiv.classList.add(
		"windowViewMode-normal",
		"oneRecordActionWrapper",
		"isModal",
		"active",
		"lafPageHost",
	);
	viewModeDiv.setAttribute("data-aura-rendered-by", "1096:0");
	viewModeDiv.setAttribute("data-aura-class", "lafPageHost");
	modalBody.appendChild(viewModeDiv);

	const actionWrapperDiv = document.createElement("form");
	actionWrapperDiv.classList.add(
		"isModal",
		"inlinePanel",
		"oneRecordActionWrapper",
	);
	actionWrapperDiv.setAttribute("data-aura-rendered-by", "1139:0");
	actionWrapperDiv.setAttribute("data-aura-class", "oneRecordActionWrapper");
	viewModeDiv.appendChild(actionWrapperDiv);

	const actionBodyDiv = document.createElement("div");
	actionBodyDiv.classList.add("actionBody");
	actionBodyDiv.setAttribute("data-aura-rendered-by", "1140:0");
	actionWrapperDiv.appendChild(actionBodyDiv);

	const fieldContainerDiv = document.createElement("div");
	fieldContainerDiv.classList.add(
		"slds-clearfix",
		"slds-card",
		"groupDependentFieldEnabled",
		"allow-horizontal-form",
		"wide-input-break",
		"full-width",
		"forceDetailPanelDesktop",
	);
	fieldContainerDiv.setAttribute("data-aura-rendered-by", "1177:0");
	fieldContainerDiv.setAttribute(
		"data-aura-class",
		"forceDetailPanelDesktop",
	);
	actionBodyDiv.appendChild(fieldContainerDiv);

	const article = document.createElement("article");
	article.setAttribute("aria-labelledby", modalId);
	fieldContainerDiv.appendChild(article);

	const titleContainer = document.createElement("div");
	titleContainer.classList.add(
		"inlineTitle",
		"slds-p-top--none",
		"slds-p-horizontal--medium",
		"slds-p-bottom--medium",
		"slds-text-heading--medium",
	);
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
	heading.textContent = modalTitle;
	heading.style.marginLeft = "0.5rem";
	titleContainer.appendChild(heading);

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
	footerContainer.style.borderTop =
		"var(--slds-g-sizing-border-2, var(--lwc-borderWidthThick, 2px)) solid var(--slds-g-color-border-1, var(--lwc-colorBorder, rgb(229, 229, 229)))";
	actionWrapperDiv.appendChild(footerContainer);

	const buttonContainerDiv = document.createElement("div");
	buttonContainerDiv.classList.add(
		"button-container",
		"slds-text-align_center",
		"forceRecordEditActions",
	);
	buttonContainerDiv.setAttribute("data-aura-rendered-by", "1148:0");
	buttonContainerDiv.setAttribute(
		"data-aura-class",
		"forceRecordEditActions",
	);
	footerContainer.appendChild(buttonContainerDiv);

	const actionsContainerDiv = document.createElement("div");
	actionsContainerDiv.classList.add("actionsContainer");
	actionsContainerDiv.setAttribute("data-aura-rendered-by", "1149:0");
	buttonContainerDiv.appendChild(actionsContainerDiv);

	/*
	const pageErrorDiv = document.createElement("div");
	pageErrorDiv.classList.add("pageError", "hideEl");
	pageErrorDiv.setAttribute("data-aura-rendered-by", "1150:0");
	actionsContainerDiv.appendChild(pageErrorDiv);

	const pageErrorIconDiv = document.createElement("div");
	pageErrorIconDiv.classList.add("pageErrorIcon");
	pageErrorIconDiv.setAttribute("data-aura-rendered-by", "1151:0");
	pageErrorDiv.appendChild(pageErrorIconDiv);

	const errorButton = document.createElement("button");
	errorButton.classList.add(
		"slds-button",
		"slds-button_neutral",
		"pageErrorIconButton",
		"uiButton",
	);
	errorButton.setAttribute("aria-live", "off");
	errorButton.setAttribute("type", "button");
	errorButton.setAttribute("title", "Error");
	errorButton.setAttribute("aria-label", "");
	errorButton.setAttribute("data-aura-rendered-by", "1155:0");
	errorButton.setAttribute("data-aura-class", "uiButton");
	pageErrorIconDiv.appendChild(errorButton);

	const lightningIcon = document.createElement("lightning-icon");
	lightningIcon.classList.add(
		"slds-icon-utility-warning",
		"slds-icon_container",
	);
	lightningIcon.setAttribute("icon-name", "utility:warning");
	lightningIcon.setAttribute("data-data-rendering-service-uid", "338");
	lightningIcon.setAttribute("data-aura-rendered-by", "1153:0");
	errorButton.appendChild(lightningIcon);

	const spanElement = document.createElement("span");
	spanElement.setAttribute(
		"style",
		"--sds-c-icon-color-background: var(--slds-c-icon-color-background, transparent)",
	);
	spanElement.setAttribute("part", "boundary");
	lightningIcon.appendChild(spanElement);

	const lightningPrimitiveIcon = document.createElement(
		"lightning-primitive-icon",
	);
	lightningPrimitiveIcon.setAttribute("exportparts", "icon");
	lightningPrimitiveIcon.setAttribute("size", "x-small");
	lightningPrimitiveIcon.setAttribute("variant", "error");
	spanElement.appendChild(lightningPrimitiveIcon);

	const svgElement = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"svg",
	);
	svgElement.classList.add(
		"slds-icon",
		"slds-icon-text-error",
		"slds-icon_x-small",
	);
	svgElement.setAttribute("focusable", "false");
	svgElement.setAttribute("aria-hidden", "true");
	svgElement.setAttribute("viewBox", "0 0 520 520");
	svgElement.setAttribute("part", "icon");
	lightningPrimitiveIcon.appendChild(svgElement);

	const gElement = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"g",
	);
	svgElement.appendChild(gElement);

	const pathElement = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"path",
	);
	pathElement.setAttribute(
		"d",
		"M514 425L285 55a28 28 0 00-50 0L6 425c-14 23 0 55 25 55h458c25 0 40-32 25-55zm-254-25c-17 0-30-13-30-30s13-30 30-30 30 13 30 30-13 30-30 30zm30-90c0 6-4 10-10 10h-40c-6 0-10-4-10-10V180c0-6 4-10 10-10h40c6 0 10 4 10 10v130z",
	);
	gElement.appendChild(pathElement);
    */

	const buttonContainerInnerDiv = document.createElement("div");
	buttonContainerInnerDiv.classList.add("button-container-inner");
	buttonContainerInnerDiv.setAttribute("data-aura-rendered-by", "1161:0");
	actionsContainerDiv.appendChild(buttonContainerInnerDiv);

	const cancelButton = document.createElement("button");
	cancelButton.classList.add(
		"slds-button",
		"slds-button_neutral",
		"uiButton--neutral",
		"uiButton",
		"forceActionButton",
	);
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
	saveButton.classList.add(
		"slds-button",
		"slds-button_neutral",
		"uiButton--brand",
		"uiButton",
		"forceActionButton",
	);
	saveButton.setAttribute("aria-live", "off");
	saveButton.setAttribute("type", "submit");
	saveButton.setAttribute("title", "Save");
	saveButton.setAttribute("aria-label", "");
	saveButton.setAttribute("data-aura-rendered-by", "1380:0");
	saveButton.setAttribute("data-aura-class", "uiButton forceActionButton");
	buttonContainerInnerDiv.appendChild(saveButton);

	saveButton.addEventListener;

	const saveSpan = document.createElement("span");
	saveSpan.classList.add("label", "bBody");
	saveSpan.setAttribute("dir", "ltr");
	saveSpan.setAttribute("data-aura-rendered-by", "1383:0");
	saveSpan.textContent = "Continue";
	saveButton.appendChild(saveSpan);

	// listen for key presses
	function keyDownListener(event) {
		switch (event.key) {
			case "Escape":
				closeButton.click();
				break;
			case "Enter":
				saveButton.click();
				break;
			default:
				return;
		}
		document.removeEventListener("keydown", keyDownListener);
	}
	document.addEventListener("keydown", keyDownListener);

	return { modalParent, article, saveButton, closeButton };
}

/**
 * Generates and opens a modal dialog for entering another Salesforce Org's information.
 *
 * @param {string} miniURL - A partial URL for the target org.
 * @param {string} tabTitle - The title of the modal tab.
 * @returns {Object} An object containing key elements of the modal:
 * - modalParent: The main modal container element.
 * - saveButton: The save button element for user actions.
 * - closeButton: The close button element for closing the modal.
 * - inputContainer: The container element for the org link input field.
 */
function _generateOpenOtherOrgModal(miniURL, tabTitle) {
	const { modalParent, article, saveButton, closeButton } = generateSldsModal(
		tabTitle,
	);

	const { section, divParent } = generateSection("Other Org info");
	divParent.style.width = "100%"; // makes the elements inside have full width
	divParent.style.display = "flex";
	divParent.style.alignItems = "center";
	article.appendChild(section);

	const orgLinkInputConf = {
		label: "Org Link",
		type: "text",
		required: true,
		placeholder: "other-org",
		style: "width: 50%",
	};

	const { inputParent, inputContainer } = generateInput(orgLinkInputConf);
	const https = document.createElement("span");
	https.append("https://");
	https.style.height = "1.5rem";
	divParent.appendChild(https);
	divParent.appendChild(inputParent);
	const linkEnd = document.createElement("span");
	linkEnd.append(
		`.lightning.force.com${
			!miniURL.startsWith("/") ? setupLightning : ""
		}${miniURL}`,
	);
	linkEnd.style.width = "fit-content";
	linkEnd.style.height = "1.5rem";
	linkEnd.style.wordBreak = "break-all";
	linkEnd.style.overflow = "hidden";
	divParent.appendChild(linkEnd);

	return { modalParent, saveButton, closeButton, inputContainer };
}

/**
 * Generates an SLDS file input component with configurable file selection and drag-and-drop support.
 *
 * Depending on the parameters, this function constructs a complex DOM structure styled with SLDS classes.
 * It supports enabling/disabling drag-and-drop, preventing file selection, and toggling single or multiple file uploads.
 *
 * @param {boolean} [singleFile=false] - If true, restricts the input to a single file; if false, multiple files can be selected.
 * @param {boolean} [allowDrop=true] - If true, enables file drop functionality.
 * @param {boolean} [preventFileSelection=false] - If true, disables file selection via the file dialog.
 *                                                Note: Cannot be true if allowDrop is false.
 * @param {boolean} [required=true] - If true, marks the file input as required and appends a required indicator.
 * @throws {Error} Throws an error if allowDrop is false while preventFileSelection is true.
 * @returns {{ fileInputWrapper: HTMLElement, inputContainer: HTMLInputElement }} An object containing:
 *   - fileInputWrapper: The wrapper element for the entire file input component.
 *   - inputContainer: The actual file input element.
 */
function _generateSldsFileInput(
	wrapperId,
	inputElementId,
	acceptedType,
	singleFile = false,
	allowDrop = true,
	preventFileSelection = false,
	required = true,
) {
	if (!allowDrop && preventFileSelection) {
		throw new Error(
			"Cannot generate a file input when allowDrop == false && preventFileSelection == true",
		);
	} else if (
		wrapperId == null || wrapperId === "" || inputElementId == null ||
		inputElementId === "" || acceptedType == null || acceptedType === ""
	) {
		throw new Error(
			"Cannot generate a file input when the required files are not passed.",
		);
	}

	const fileInputWrapper = document.createElement("div");
	fileInputWrapper.id = wrapperId;
	fileInputWrapper.classList.add(
		"previewMode",
		"MEDIUM",
		"forceRelatedListPreview",
	);
	fileInputWrapper.setAttribute("data-aura-class", "forceRelatedListPreview");
	fileInputWrapper.style.width = "100%";

	const innerDiv = document.createElement("div");
	fileInputWrapper.appendChild(innerDiv);

	const cardBodyDiv = document.createElement("div");
	cardBodyDiv.classList.add(
		"slds-card__body_inner",
		"forceContentFileDroppableZone",
		"forceContentRelatedListPreviewFileList",
	);
	cardBodyDiv.setAttribute(
		"data-aura-class",
		"forceContentFileDroppableZone forceContentRelatedListPreviewFileList",
	);
	innerDiv.appendChild(cardBodyDiv);

	if (preventFileSelection && allowDrop) {
		const fileSelectorDiv = document.createElement("div");
		fileSelectorDiv.classList.add(
			"slds-file-selector",
			"slds-file-selector--integrated",
			"slds-file-selector--integrated",
		);
		cardBodyDiv.appendChild(fileSelectorDiv);

		const dropzoneDiv = document.createElement("div");
		dropzoneDiv.classList.add(
			"slds-file-selector__dropzone",
			"slds-file-selector__dropzone--integrated",
		);
		fileSelectorDiv.appendChild(dropzoneDiv);

		const dropzoneBodySpan = document.createElement("span");
		dropzoneBodySpan.classList.add(
			"slds-file-selector__body",
			"slds-file-selector__body--integrated",
		);
		dropzoneDiv.appendChild(dropzoneBodySpan);

		const lightningIcon = document.createElement("lightning-icon");
		lightningIcon.classList.add(
			"slds-icon-utility-upload",
			"slds-file-selector__body-icon",
			"slds-icon",
			"slds-icon-text-default",
			"slds-button__icon",
			"slds-icon_container forceIcon",
		);
		lightningIcon.setAttribute("icon-name", "utility:upload");
		lightningIcon.setAttribute("data-data-rendering-service-uid", "742");
		lightningIcon.setAttribute("data-aura-class", "forceIcon");
		dropzoneBodySpan.appendChild(lightningIcon);

		const iconSpan = document.createElement("span");
		iconSpan.style.setProperty(
			"--sds-c-icon-color-background",
			"var(--slds-c-icon-color-background, transparent)",
		);
		iconSpan.setAttribute("part", "boundary");
		lightningIcon.appendChild(iconSpan);

		const primitiveIcon = document.createElement(
			"lightning-primitive-icon",
		);
		primitiveIcon.setAttribute("exportparts", "icon");
		primitiveIcon.setAttribute("size", "medium");
		primitiveIcon.setAttribute("variant", "inverse");
		iconSpan.appendChild(primitiveIcon);

		const svg = document.createElement("svg");
		svg.setAttribute("focusable", "false");
		svg.setAttribute("aria-hidden", "true");
		svg.setAttribute("viewBox", "0 0 520 520");
		svg.setAttribute("part", "icon");
		svg.classList.add("slds-icon");
		primitiveIcon.appendChild(svg);

		const g = document.createElement("g");
		svg.appendChild(g);

		const path = document.createElement("path");
		path.setAttribute(
			"d",
			"M485 310h-30c-8 0-15 8-15 15v100c0 8-7 15-15 15H95c-8 0-15-7-15-15V325c0-7-7-15-15-15H35c-8 0-15 8-15 15v135a40 40 0 0040 40h400a40 40 0 0040-40V325c0-7-7-15-15-15zM270 24c-6-6-15-6-21 0L114 159c-6 6-6 15 0 21l21 21c6 6 15 6 21 0l56-56c6-6 18-2 18 7v212c0 8 6 15 14 15h30c8 0 16-8 16-15V153c0-9 10-13 17-7l56 56c6 6 15 6 21 0l21-21c6-6 6-15 0-21z",
		);
		g.appendChild(path);

		const dropFilesSpan = document.createElement("span");
		dropFilesSpan.classList.add(
			"slds-file-selector__text",
			"slds-file-selector__text--integrated",
			"slds-text-heading--medium",
			"slds-text-align--center",
		);
		dropFilesSpan.textContent = `Drop File${singleFile ? "" : "s"}`;
		dropzoneBodySpan.appendChild(dropFilesSpan);
	}

	const dragOverDiv = document.createElement("div");
	dragOverDiv.classList.add("drag-over-body");
	cardBodyDiv.appendChild(dragOverDiv);

	const lightningInput = document.createElement("lightning-input");
	lightningInput.classList.add("slds-form-element", "lightningInput");
	lightningInput.setAttribute("data-data-rendering-service-uid", "743");
	dragOverDiv.appendChild(lightningInput);

	const primitiveInputFile = document.createElement(
		"lightning-primitive-input-file",
	);
	primitiveInputFile.setAttribute("exportparts", "button");
	lightningInput.appendChild(primitiveInputFile);

	const formLabelSpan = document.createElement("span");
	formLabelSpan.classList.add(
		"slds-form-element__label",
		"slds-assistive-text",
	);
	primitiveInputFile.appendChild(formLabelSpan);

	const controlDiv = document.createElement("div");
	controlDiv.classList.add("slds-form-element__control");
	primitiveInputFile.appendChild(controlDiv);

	const fileSelectorImagesDiv = document.createElement("div");
	fileSelectorImagesDiv.classList.add(
		"slds-file-selector",
		"slds-file-selector--images",
		"slds-file-selector_images",
	);
	fileSelectorImagesDiv.setAttribute("part", "file-selector");
	controlDiv.appendChild(fileSelectorImagesDiv);

	const fileDroppableZone = document.createElement(
		"lightning-primitive-file-droppable-zone",
	);
	fileDroppableZone.classList.add("slds-file-selector__dropzone");
	fileSelectorImagesDiv.appendChild(fileDroppableZone);

	const slot = document.createElement("slot");
	fileDroppableZone.appendChild(slot);

	const inputContainer = document.createElement("input");
	inputContainer.id = inputElementId;
	inputContainer.classList.add(
		"slds-file-selector__input",
		"slds-assistive-text",
	);
	inputContainer.setAttribute("accept", acceptedType);
	inputContainer.setAttribute("type", "file");
	inputContainer.setAttribute("part", "input");
	inputContainer.setAttribute("multiple", "");
	inputContainer.setAttribute("name", "fileInput");
	slot.appendChild(inputContainer);

	const fileSelectorLabel = document.createElement("label");
	fileSelectorLabel.classList.add("slds-file-selector__body");
	fileSelectorLabel.setAttribute("for", inputElementId);
	slot.appendChild(fileSelectorLabel);

	const fileSelectorButtonSpan = document.createElement("span");
	fileSelectorButtonSpan.classList.add(
		"slds-file-selector__button",
		"slds-button",
		"slds-button_neutral",
	);
	fileSelectorButtonSpan.setAttribute("part", "button");
	fileSelectorLabel.appendChild(fileSelectorButtonSpan);

	const buttonIcon = document.createElement("lightning-primitive-icon");
	buttonIcon.setAttribute("variant", "bare");
	fileSelectorButtonSpan.appendChild(buttonIcon);
	fileSelectorButtonSpan.append(`Upload File${singleFile ? "" : "s"}`);
	required && fileSelectorButtonSpan.appendChild(generateRequired());

	const buttonSvg = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"svg",
	);
	buttonSvg.classList.add("slds-button__icon", "slds-button__icon_left");
	buttonSvg.setAttribute("focusable", "false");
	buttonSvg.setAttribute("data-key", "upload");
	buttonSvg.setAttribute("aria-hidden", "true");
	buttonSvg.setAttribute("viewBox", "0 0 520 520");
	buttonSvg.setAttribute("part", "icon");
	buttonIcon.appendChild(buttonSvg);

	const buttonG = document.createElementNS("http://www.w3.org/2000/svg", "g");
	buttonSvg.appendChild(buttonG);

	const buttonPath = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"path",
	);
	buttonPath.setAttribute(
		"d",
		"M485 310h-30c-8 0-15 8-15 15v100c0 8-7 15-15 15H95c-8 0-15-7-15-15V325c0-7-7-15-15-15H35c-8 0-15 8-15 15v135a40 40 0 0040 40h400a40 40 0 0040-40V325c0-7-7-15-15-15zM270 24c-6-6-15-6-21 0L114 159c-6 6-6 15 0 21l21 21c6 6 15 6 21 0l56-56c6-6 18-2 18 7v212c0 8 6 15 14 15h30c8 0 16-8 16-15V153c0-9 10-13 17-7l56 56c6 6 15 6 21 0l21-21c6-6 6-15 0-21z",
	);
	buttonG.appendChild(buttonPath);

	if (allowDrop) {
		const orDropFilesSpan = document.createElement("span");
		orDropFilesSpan.classList.add(
			"slds-file-selector__text",
			"slds-medium-show",
		);
		orDropFilesSpan.textContent = `Or drop file${singleFile ? "" : "s"}`;
		fileSelectorLabel.appendChild(orDropFilesSpan);
	}

	/*
        const helpTextDiv = document.createElement("div");
    helpTextDiv.classList.add("slds-form-element__help");
    helpTextDiv.setAttribute("data-name", "fileInput");
    helpTextDiv.setAttribute("part", "help-text");
    helpTextDiv.setAttribute("role", "status");
    primitiveInputFile.appendChild(helpTextDiv);

    const hiddenPlaceholderDiv = document.createElement("div");
    hiddenPlaceholderDiv.classList.add("slds-hide");

    const forcePlaceholder = document.createElement("force-placeholder2");

    const placeholderBodyDiv = document.createElement("div");
    placeholderBodyDiv.classList.add("body","slds-grid","slds-grid_vertical-align-center","slds-p-around_large");

    const placeholderFigureDiv = document.createElement("div");
    placeholderFigureDiv.classList.add("slds-media__figure","slds-avatar","slds-m-right_small");

    const placeholderTextContainerDiv = document.createElement("div");
    placeholderTextContainerDiv.classList.add("text-container");

    const placeholderTextDiv1 = document.createElement("div");
    placeholderTextDiv1.classList.add("text","slds-m-bottom_small");

    const placeholderTextDiv2 = document.createElement("div");
    placeholderTextDiv2.classList.add("text","text-medium");

    placeholderTextContainerDiv.appendChild(placeholderTextDiv1);
    placeholderTextContainerDiv.appendChild(placeholderTextDiv2);
    placeholderBodyDiv.appendChild(placeholderFigureDiv);
    placeholderBodyDiv.appendChild(placeholderTextContainerDiv);
    forcePlaceholder.appendChild(placeholderBodyDiv);
    hiddenPlaceholderDiv.appendChild(forcePlaceholder);

    const abstractList = document.createElement("ul");
    abstractList.classList.add("uiAbstractList");

    const emptyContentDiv = document.createElement("div");
    emptyContentDiv.classList.add("emptyContent","hidden");

    const emptyContentInnerDiv = document.createElement("div");
    emptyContentInnerDiv.classList.add("emptyContentInner","slds-text-align_center","slds-text-align--center");

    emptyContentDiv.appendChild(emptyContentInnerDiv);

    dragOverDiv.appendChild(hiddenPlaceholderDiv);
    dragOverDiv.appendChild(abstractList);
    dragOverDiv.appendChild(emptyContentDiv);
    */

	return { fileInputWrapper, inputContainer };
}

/**
 * Generates a checkbox input element with an associated label.
 *
 * @param {string} id - The unique identifier for the checkbox.
 * @param {string} label - The text to display next to the checkbox.
 * @param {boolean} [checked=false] - Whether the checkbox should be initially checked.
 * @returns {HTMLLabelElement} The label element containing the checkbox input and its text.
 */
function _generateCheckboxWithLabel(id, label, checked = false) {
	const checkboxLabel = document.createElement("label");
	checkboxLabel.for = id;

	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.id = id;
	checkbox.name = label;
	checkbox.checked = checked;
	checkboxLabel.appendChild(checkbox);

	const checkboxSpan = document.createElement("span");
	checkboxSpan.style.marginLeft = "0.5rem";
	checkboxSpan.textContent = label;
	checkboxLabel.append(checkboxSpan);

	return checkboxLabel;
}
