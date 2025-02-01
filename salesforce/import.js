"use strict";

let overwritePick;
let duplicatePick;
const importId = `${prefix}-import`;
const importFileId = `${importId}-file`;
const overwriteId = `${importId}-overwrite`;
const duplicateId = `${importId}-duplicate`;
const otherOrgId = `${importId}-other-org`;
//const closeModalId = `${prefix}-modal-close`;

const reader = new FileReader();

/**
 * Generates the HTMLElement for the import modal.
 *
 * @returns {HTMLElement} - The HTMLElement used to import data.
 */
function new_generateSldsImport(){
	const { modalParent, article, saveButton, closeButton } = generateSldsModal(
        "Import Tabs"
	);

	const { section, divParent } = generateSection();
	divParent.style.width = "100%"; // makes the elements inside have full width
	divParent.style.display = "flex";
	divParent.style.alignItems = "center";
    divParent.style.flexDirection = "column";
	article.appendChild(section);

    const { fileInputWrapper, inputContainer } = _generateFileInput();
    fileInputWrapper.style.marginBottom = "1rem";
	divParent.appendChild(fileInputWrapper);
    divParent.appendChild(_generateCheckboxWithLabel(overwriteId, "Overwrite saved tabs.", false));
    divParent.appendChild(_generateCheckboxWithLabel(duplicateId, "Skip duplicate tabs.", true));
    divParent.appendChild(_generateCheckboxWithLabel(otherOrgId, "Preserve tabs for other orgs.", true));

	return { modalParent, saveButton, closeButton, inputContainer };
}

/**
 * Displays the import modal for uploading tab data.
 */
function showFileImport() {
	if (setupTabUl.querySelector(`#${importId}`) != null) {
		return;
	}

    const { modalParent, saveButton } = new_generateSldsImport();

    modalHanger = getModalHanger();
    modalHanger.appendChild(modalParent);
    console.log(modalHanger);

    saveButton.remove();
    listenToFileUpload();
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
	const currentUrls = !message.overwrite
		? new Set(sf_currentTabs.map((current) => current.url))
		: new Set();
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
	setupTabUl.removeChild(document.getElementById(importId));
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

    const dropArea = document.getElementById(importId);
    console.log(dropArea)
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
	}
});
