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
            const message = { what: "import", imported, override: overridePick, skipDuplicates: duplicatePick };
            postMessage(message, "*");
        } else {
            postMessage({
                what: "error",
                message:
                    "Invalid JSON structure. Your file must contain an array in which each item must have 'tabTitle' and 'url' as strings.",
            });
        }
    } catch (error) {
        postMessage({
            what: "error",
            message: `Error parsing JSON: ${error.message}`,
        });
    }
};
/**
 * Sets up event listeners for file upload through both input field and drag-and-drop.
 * The function reads the uploaded file if it is a JSON file and sends the content to the postMessage API.
 */
function listenToFileUpload() {
	const dropArea = document.getElementById(importId);

	function readFile(file) {
		if (file.type !== "application/json") {
			postMessage({
				what: "error",
				message: "Invalid file type. Only JSON files are supported.",
			});
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
