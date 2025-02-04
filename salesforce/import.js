"use strict";

let overwritePick;
let otherOrgPick;
const importId = `${prefix}-import`;
const importFileId = `${importId}-file`;
const overwriteId = `${importId}-overwrite`;
const otherOrgId = `${importId}-other-org`;
const closeModalId = `${prefix}-modal-close`;

const reader = new FileReader();

/**
 * Generates an SLDS import modal for importing tabs.
 *
 * This function creates a modal dialog by calling generateSldsModal with the title "Import Tabs",
 * and then sets up a section with a full-width, flex container. It appends an SLDS file input component
 * (created by _generateSldsFileInput) and three checkboxes with labels for import options:
 * "Overwrite saved tabs." and "Preserve tabs for other orgs."
 * Additionally, it assigns an ID to the close button using closeModalId.
 *
 * @returns {{
 *   modalParent: HTMLElement,
 *   saveButton: HTMLElement,
 *   closeButton: HTMLElement,
 *   inputContainer: HTMLInputElement
 * }} An object containing the modal's parent element, the save button, the close button, and the file input element.
 */
function generateSldsImport() {
	const { modalParent, article, saveButton, closeButton } = generateSldsModal(
		"Import Tabs",
	);
	closeButton.id = closeModalId;

	const { section, divParent } = generateSection();
	divParent.style.width = "100%"; // makes the elements inside have full width
	divParent.style.display = "flex";
	divParent.style.alignItems = "center";
	divParent.style.flexDirection = "column";
	article.appendChild(section);

	const { fileInputWrapper, inputContainer } = _generateSldsFileInput(
		importId,
		importFileId,
		".json,application/json",
	);
	fileInputWrapper.style.marginBottom = "1rem";
	divParent.appendChild(fileInputWrapper);

	const style = document.createElement("style");
	style.textContent = ".hidden { display: none; }";
	divParent.appendChild(style);
	const duplicateWarning = document.createElement("span");
	duplicateWarning.innerHTML =
		"Duplicate tabs will be ignored.<br />Two tabs are considered duplicates if they have the same URL.";
	duplicateWarning.style.textAlign = "center";
	divParent.append(duplicateWarning);

	const overwriteCheckbox = _generateCheckboxWithLabel(
		overwriteId,
		"Overwrite saved tabs.",
		false,
	);
	divParent.appendChild(overwriteCheckbox);
	const otherOrgCheckbox = _generateCheckboxWithLabel(
		otherOrgId,
		"Preserve tabs for other orgs.",
		true,
	);
	otherOrgCheckbox.classList.add("hidden");
	divParent.appendChild(otherOrgCheckbox);
	overwriteCheckbox.addEventListener(
		"change",
		() => otherOrgCheckbox.classList.toggle("hidden"),
	);

	return { modalParent, saveButton, closeButton, inputContainer };
}

/**
 * Handles the imported tab data and updates the storage with the newly imported tabs.
 * If the page where the user is at this moment gets imported, the favourite img is switched to the unfavourite one.
 *
 * @param {Object} message - The message containing the imported tab data.
 * @param {Array<Object>} message.imported - The array of imported tab data.
 * @param {boolean} message.overwrite - Whether the imported array should overwrite the currently saved tabs
 * @param {boolean} message.preserveOtherOrg - Whether the org-specific tabs should be preserved
 */
function importer(message) {
	sf_overwriteCurrentTabs(
		message.imported,
		message.overwrite,
		!message.preserveOtherOrg,
	);

	// remove file import
	document.getElementById(closeModalId).click();
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
			importer({
				what: "import",
				imported,
				overwrite: overwritePick,
				preserveOtherOrg: otherOrgPick,
			});
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
 * Attaches event listeners to handle file uploads via both file selection and drag-and-drop.
 *
 * This function sets up listeners on the file input element (identified by the global `importId`)
 * within the modal. It handles the "change" event for file selection and "dragover", "dragleave",
 * and "drop" events for drag-and-drop actions. When a file is uploaded, it validates that the file
 * type is "application/json", retrieves import options (overwrite and other org picks)
 * from checkboxes within the modal, and reads the file as text using a FileReader.
 *
 * @param {HTMLElement} modalParent - The parent element of the modal that contains the file input and option checkboxes.
 */
function listenToFileUpload(modalParent) {
	function readFile(file) {
		if (file.type !== "application/json") {
			return showToast(
				`Invalid file type: ${file.type}.\nOnly JSON files are supported.`,
				false,
			);
		}

		overwritePick = modalParent.querySelector(`#${overwriteId}`).checked;
		otherOrgPick = modalParent.querySelector(`#${otherOrgId}`).checked;
		reader.readAsText(file);
	}

	const dropArea = document.getElementById(importId);
	dropArea.addEventListener("change", function (event) {
		event.preventDefault();
		readFile(event.target.files[0]);
	});

	dropArea.addEventListener("dragover", function (event) {
		event.preventDefault();
		//console.log('dragover')
		//dropArea.classList.add("slds-has-drag-over");
	});
	dropArea.addEventListener("dragleave", function (event) {
		event.preventDefault();
		//console.log('dragleave')
		//dropArea.classList.remove("slds-has-drag-over");
	});

	dropArea.addEventListener("drop", function (event) {
		event.preventDefault();
		Array.from(event.dataTransfer.files).forEach((f) => readFile(f));
	});
}

/**
 * Displays the import modal for uploading tab data.
 */
function showFileImport() {
	if (
		setupTabUl.querySelector(`#${importId}`) != null ||
		document.getElementById(modalId) != null
	) {
		return showToast("Close the other modal first!", false);
	}

	const { modalParent, saveButton } = generateSldsImport();

	modalHanger = getModalHanger();
	modalHanger.appendChild(modalParent);

	saveButton.remove();
	listenToFileUpload(modalParent);
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
