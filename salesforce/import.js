"use strict";

let overwritePick;
let duplicatePick;
const importId = `${prefix}-import`;
const importFileId = `${importId}-file`;
const overwriteId = `${prefix}-overwrite`;
const duplicateId = `${prefix}-duplicate`;
const closeModalId = `${prefix}-modal-close`;
let dropArea;

const reader = new FileReader();

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

	dropArea = document.createElement("div");
	dropArea.id = importId;
	dropArea.appendChild(style);

	const overlay = document.createElement("div");
	overlay.classList.add("overlay");
	dropArea.appendChild(overlay);

	const modal = document.createElement("div");
	modal.classList.add("modal");
	dropArea.appendChild(modal);

	const closeButton = document.createElement("button");
	closeButton.id = closeModalId;
	closeButton.addEventListener(
		"click",
		() => dropArea.remove(),
	);
	modal.appendChild(closeButton);

	const closeSpan = document.createElement("span");
	closeSpan.innerHTML = "&times;";
	closeButton.appendChild(closeSpan);

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

	const overwriteCheckboxLabel = document.createElement("label");
	const overwriteCheckbox = document.createElement("input");
	overwriteCheckbox.type = "checkbox";
	overwriteCheckbox.id = overwriteId;
	overwriteCheckbox.name = "overwrite-tabs";
	overwriteCheckbox.checked = false;
	overwriteCheckboxLabel.appendChild(overwriteCheckbox);
	overwriteCheckboxLabel.append("overwrite saved tabs.");
	modal.appendChild(overwriteCheckboxLabel);

	const duplicateCheckboxLabel = document.createElement("label");
	const duplicateCheckbox = document.createElement("input");
	duplicateCheckbox.type = "checkbox";
	duplicateCheckbox.id = duplicateId;
	duplicateCheckbox.name = "duplicate-tabs";
	duplicateCheckbox.checked = true;
	duplicateCheckboxLabel.appendChild(duplicateCheckbox);
	duplicateCheckboxLabel.append("Skip duplicate tabs.");
	modal.appendChild(duplicateCheckboxLabel);

	return dropArea;
}

/**
 * Displays the import modal for uploading tab data.
 */
function showFileImport() {
	if (setupTabUl.querySelector(`#${importId}`) != null) {
		return;
	}

	setupTabUl.appendChild(generateSldsImport());
}
/**
 * Handles the imported tab data and updates the storage with the newly imported tabs.
 * If the user wants to skip the duplicated urls, they won't be imported; otherwise, if duplicates are detected, the user will be warned about it.
 * If the page where the user is at this moment gets imported, the favourite img is switched to the unfavourite one.
 *
 * @param {Object} message - The message containing the imported tab data.
 * @param {Array<Object>} message.imported - The array of imported tab data.
 * @param {boolean} message.overwrite - Whether the imported array should overwrite the currently saved tabs
 * @param {boolean} message.skipDuplicates - Whether to skip the duplicated values of the URLs of already saved tabs
 */
function importer(message) {
	const currentUrls = !message.overwrite ? new Set(sf_currentTabs.map((current) => current.url)) : new Set();
	let importedArray = message.imported;

	// check for duplicated entries
	if (message.skipDuplicates) {
		importedArray = importedArray.filter((imported) =>
			!currentUrls.has(imported.url)
		);
	} else {
		// check if there are duplicates to warn the user
		const duplicatesArray = importedArray.filter((imported) =>
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

	sf_overwriteCurrentTabs(importedArray, message.overwrite);
	// remove file import
	setupTabUl.removeChild(dropArea);
}

reader.onload = function (e) {
	try {
		const imported = JSON.parse(e.target.result);

		// Validate JSON structure
		if (
			Array.isArray(imported) &&
			imported.every((item) =>
				typeof item.tabTitle === "string" &&
				typeof item.url === "string" &&
				(
                    item.org == null ||
                    typeof item.org === "string"
                )
			)
		) {
			const message = {
				what: "import",
				imported,
				overwrite: overwritePick,
				skipDuplicates: duplicatePick,
			};
			importer(message);
		} else {
			showToast(
				"Invalid JSON structure. Your file must contain an array in which each item must have 'tabTitle' and 'url' as strings. Additionally, every item may have an 'org' as string.",
				false,
				false,
			);
		}
	} catch (error) {
		showToast(
			`Error parsing JSON: ${error.message}`,
			false,
			false,
		);
	}
};
/**
 * Sets up event listeners for file upload through both input field and drag-and-drop.
 * The function reads the uploaded file if it is a JSON file and sends the content to the importer function
 */
function listenToFileUpload() {
	function readFile(file) {
		if (file.type !== "application/json") {
			showToast(
				"Invalid file type. Only JSON files are supported.",
				false,
				false,
			);
			return;
		}

		overwritePick = dropArea.querySelector(`#${overwriteId}`).checked;
		duplicatePick = dropArea.querySelector(`#${duplicateId}`).checked;
		reader.readAsText(file);
	}

	dropArea.querySelector(`#${importFileId}`).addEventListener(
		"change",
		function (event) {
			event.preventDefault();
			const file = event.target.files[0];
			readFile(file);
		},
	);

	// Prevent default behavior for drag events
	dropArea.addEventListener("dragover", function (event) {
		event.preventDefault();
	});

	// Handle drop event
	dropArea.addEventListener("drop", function (event) {
		event.preventDefault();
		event.dataTransfer.files.forEach(f = readFile(f));
	});
}

// listen from saves from the action page
chrome.runtime.onMessage.addListener(function (message, _, sendResponse) {
	if (message == null || message.what == null) {
		return;
	}
	if (message.what == "add") {
        sendResponse(null);
		showFileImport();
		listenToFileUpload();
	}
});
