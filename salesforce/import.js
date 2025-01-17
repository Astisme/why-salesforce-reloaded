"use strict";

let overridePick;
let duplicatePick;

const reader = new FileReader();

reader.onload = function (e) {
	try {
		const imported = JSON.parse(e.target.result);

		// Validate JSON structure
		if (
			Array.isArray(imported) &&
			imported.every((item) =>
				typeof item.tabTitle === "string" &&
				typeof item.url === "string"
			)
		) {
			const message = {
				what: "import",
				imported,
				override: overridePick,
				skipDuplicates: duplicatePick,
			};
			_importer(message);
		} else {
			showToast(
				"Invalid JSON structure. Your file must contain an array in which each item must have 'tabTitle' and 'url' as strings.",
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
	const dropArea = document.getElementById(importId);

	function readFile(file) {
		if (file.type !== "application/json") {
			showToast(
				"Invalid file type. Only JSON files are supported.",
				false,
				false,
			);
			return;
		}

		overridePick = dropArea.querySelector(`#${overrideId}`).checked;
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
		listenToFileUpload();
	}
});
