"use strict";

/**
 * Sets up event listeners for file upload through both input field and drag-and-drop.
 * The function reads the uploaded file if it is a JSON file and sends the content to the postMessage API.
 */
function listenToFileUpload() {
	const dropArea = document.getElementById("again-why-salesforce-import");

	function readFile(file) {
		if (file.type !== "application/json") {
			postMessage({
				what: "error",
				message: "Invalid file type. Only JSON files are supported.",
			});
			return;
		}

		const reader = new FileReader();

		reader.onload = function (e) {
			try {
				const contents = e.target.result;
				const imported = JSON.parse(contents);

				// Validate JSON structure
				if (
					Array.isArray(imported) &&
					imported.every((item) =>
						typeof item.tabTitle === "string" &&
						typeof item.url === "string"
					)
				) {
					const message = { what: "import", imported };
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

		reader.readAsText(file);
	}

	dropArea.querySelector("input").addEventListener(
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

		// Get the dropped files
		const files = event.dataTransfer.files;

		// Iterate through dropped files
		for (const file of files) {
			// Access file properties (e.g., file.name, file.type, etc.)
			console.log("Dropped file:", file.name);
			// Optionally, perform further processing with the dropped files
			readFile(file);
		}
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
