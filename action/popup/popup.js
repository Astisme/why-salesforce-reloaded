// deno-lint-ignore-file no-window
"use strict";
import { handleSwitchColorTheme, initTheme } from "../themeHandler.js";

const html = document.documentElement;
const sun = document.getElementById("sun");
const moon = document.getElementById("moon");

/**
 * Initializes the theme SVG elements based on the current theme and updates visibility.
 */
function initThemeSvg() {
	initTheme();
	const elementToShow = html.dataset.theme === "light" ? moon : sun;
	const elementToHide = elementToShow === sun ? moon : sun;

	elementToShow.classList.remove("invisible", "hidden");
	elementToHide.classList.add("invisible", "hidden");
}
initThemeSvg();

// queries the currently active tab of the current active window
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
	// is null if the extension cannot access the current tab
	if (tabs[0].url == null || !tabs[0].url.match(".*\/lightning\/setup\/.*")) {
		window.location.href = chrome.runtime.getURL(
			`action/notSalesforceSetup/notSalesforceSetup.html${
				tabs[0].url != null ? "?url=" + tabs[0].url : ""
			}`,
		);
	} else {
		getStorage(loadTabs);
	}
});

/**
 * Switches the theme and updates the SVG elements accordingly.
 */
function switchTheme() {
	const elementToShow = html.dataset.theme === "light" ? sun : moon;
	const elementToHide = elementToShow === sun ? moon : sun;

	elementToHide.classList.add("invisible", "hidden");
	elementToShow.classList.remove("hidden");

	setTimeout(() => {
		elementToShow.classList.remove("invisible");
	}, 200);

	handleSwitchColorTheme();
}

const tabTemplate = document.getElementById("tr_template");
const tabAppendElement = document.getElementById("tabs");

let knownTabs = [];
let loggers = [];

/**
 * Sends a message to the background script with the specified message and the current URL.
 *
 * @param {Object} message - The message to send.
 * @param {function} callback - The callback to execute after sending the message.
 */
function sendMessage(message, callback) {
	chrome.runtime.sendMessage({ message, url: location.href }, callback);
}

/**
 * Retrieves stored data from the background script and invokes the provided callback.
 *
 * @param {function} callback - The callback to invoke with the retrieved data.
 */
function getStorage(callback) {
	sendMessage({ what: "get" }, callback);
}

/**
 * Sends a message indicating that data has been saved successfully.
 */
function afterSet() {
	sendMessage({ what: "saved" });
}

/**
 * Compares two arrays to check if they are equal.
 *
 * @param {Array} arr1 - The first array.
 * @param {Array} arr2 - The second array.
 * @returns {boolean} True if the arrays are equal, false otherwise.
 */
function arraysAreEqual(arr1, arr2) {
	return JSON.stringify(arr1) === JSON.stringify(arr2);
}

/**
 * Sets the stored tabs data in the background script, optionally checking for changes.
 *
 * @param {Array} tabs - The tabs to save.
 * @param {boolean} check - Whether to check for changes before saving.
 */
function setStorage(tabs, check = true) {
	if ((check && !arraysAreEqual(tabs, knownTabs)) || !check) {
		sendMessage({ what: "set", tabs }, afterSet);
	}
	knownTabs = tabs;
}

/**
 * Minifies a URL by the domain and removing Salesforce-specific parts.
 *
 * @param {string} url - The URL to minify.
 * @returns {Promise} A promise containing the minified URL.
 *
 * These links would all collapse into "SetupOneHome/home".
 * https://myorgdomain.sandbox.my.salesforce-setup.com/lightning/setup/SetupOneHome/home/
 * https://myorgdomain.sandbox.my.salesforce-setup.com/lightning/setup/SetupOneHome/home
 * https://myorgdomain.my.salesforce-setup.com/lightning/setup/SetupOneHome/home/
 * https://myorgdomain.my.salesforce-setup.com/lightning/setup/SetupOneHome/home
 * /lightning/setup/SetupOneHome/home/
 * /lightning/setup/SetupOneHome/home
 * lightning/setup/SetupOneHome/home/
 * lightning/setup/SetupOneHome/home
 * /SetupOneHome/home/
 * /SetupOneHome/home
 * SetupOneHome/home/
 * SetupOneHome/home
 */
function minifyURL(url) {
	return chrome.runtime.sendMessage({ message: { what: "minify", url } });
}

/**
 * Removes the closest tab element from the popup and saves the updated tabs.
 * This function is called by the delete button at the end of each tab.
 */
function deleteTab() {
	this.closest(".tab").remove();
	saveTabs();
}

/**
 * Enables or disables the elements of the last td available in the popup.
 *
 * @param {boolean} [enable=true] - if enabling or disabling the elements in the last td
 */
function updateTabAttributes(enable = true) {
	const deleteButton = tabAppendElement.querySelector(
		"tr:last-child button.delete",
	);
	const tr = tabAppendElement.querySelector("tr:last-child");
	const svg = tr.querySelector("svg");

	if (enable) {
		deleteButton.removeAttribute("disabled");
		tr.setAttribute("draggable", "true");
	} else {
		deleteButton.setAttribute("disabled", "true");
		tr.removeAttribute("draggable");
	}
	tr.dataset.draggable = enable;
	svg.dataset.draggable = enable;
}
/**
 * Adds a new empty tab at the bottom of the popup and enables the previously last child's delete button.
 */
function addTab() {
	if (tabAppendElement.childElementCount >= 1) { // if list is empty, there's nothing to disable
		updateTabAttributes();
	}
	// add a new empty element
	tabAppendElement.append(createElement());
}
/**
 * Removes the last empty tab at the bottom of the popup and disables the newly last child's delete button.
 */
function removeTab() {
	if (tabAppendElement.childElementCount >= 2) { // if list is empty, there's nothing to disable
		tabAppendElement.removeChild(tabAppendElement.lastChild);
		loggers.pop();
		updateTabAttributes(false);
	}
}

let focusedIndex = 0;

/**
 * Listens for input changes on the title and URL fields and updates the corresponding values.
 *
 * @param {string} type - The type of input field ("title" or "url").
 */
function inputTitleUrlListener(type) {
	const currentObj = loggers[focusedIndex];
	const element = currentObj[type];
	const value = element.value;
	const inputObj = currentObj.last_input;
	const last_input = inputObj[type] || "";
	const delta = value.length - last_input.length;

	// check if the user copied the url
	if (delta > 2 && type === "url") {
		minifyURL(value)
			.then((v) => {
				element.value = v;
				// check eventual duplicates
				if (knownTabs.some((tab) => tab.url === v)) {
					// show warning in salesforce
					sendMessage({
						what: "warning",
						message: "A tab with this URL has already been saved!",
						action: "make-bold",
						url: v,
					});

					// highlight all duplicated rows and scroll to the first one
					const trs = Array.from(
						tabAppendElement.querySelectorAll("tr input.url"),
					)
						.filter((input) => input.value === v)
						.map((input) => input.closest("tr"));

					trs.forEach((tr) => tr.classList.add("duplicate"));
					trs[0].scrollIntoView({
						behavior: "smooth",
						block: "center",
					});

					setTimeout(
						() =>
							trs.forEach((tr) =>
								tr.classList.remove("duplicate")
							),
						4000,
					);
				}
			});
	}

	inputObj[type] = value;
	// if the user is on the last td, add a new tab if both fields are non-empty.
	if (focusedIndex === (loggers.length - 1)) {
		if (inputObj.title && inputObj.url) {
			addTab();
		}
	} // if the user is on the previous-to-last td, remove the last tab if either one of the fields are empty
	else if (focusedIndex === (loggers.length - 2)) {
		if (!inputObj.title || !inputObj.url) {
			removeTab();
		}
	}
}

/**
 * Focus listener to track the currently focused tab index.
 *
 * @param {Event} e - The focus event.
 */
function focusListener(e) {
	focusedIndex = parseInt(e.target.dataset.element_index);
	saveTabs(false);
}

/**
 * Creates a new tab element for the popup and sets up event listeners for title and URL input fields.
 *
 * @returns {HTMLElement} The created tab element.
 */
function createElement() {
	const element = tabTemplate.content.firstElementChild.cloneNode(true);
	const deleteButton = element.querySelector("button.delete");
	deleteButton.addEventListener("click", deleteTab);

	function setInfoForDrag(element, listener) {
		element.addEventListener("input", listener);
		element.addEventListener("focus", focusListener);
		element.dataset.element_index = loggers.length;
	}
	const title = element.querySelector(".tabTitle");
	setInfoForDrag(title, () => inputTitleUrlListener("title"));
	const url = element.querySelector(".url");
	setInfoForDrag(url, () => inputTitleUrlListener("url"));

	loggers.push({ title, url, last_input: {} }); // set last_input as an empty object
	return element;
}

/**
 * Loads stored tab data and populates the tab elements in the popup.
 *
 * @param {Object} items - The stored tab data.
 */
function loadTabs(items) {
	if (items == null || items[items.key] == null) {
		return addTab();
	}

	const rowObjs = items[items.key];
	for (const tab of rowObjs) {
		const element = createElement();
		element.querySelector(".tabTitle").value = tab.tabTitle;
		element.querySelector(".url").value = tab.url;
		element.querySelector(".delete").removeAttribute("disabled");
		const logger = loggers.pop();
		logger.last_input.title = tab.tabTitle;
		logger.last_input.url = tab.url;

		loggers.push(logger);
		tabAppendElement.append(element);
		updateTabAttributes();
	}
	tabAppendElement.append(createElement()); // always leave a blank at the bottom
	knownTabs = rowObjs;
}

/**
 * Reloads the tab elements in the popup based on the provided tab data.
 *
 * @param {Object} items - The tab data to reload.
 */
function reloadRows(items) {
	while (tabAppendElement.childElementCount > 0) {
		tabAppendElement.removeChild(tabAppendElement.lastChild);
	}
	loggers = [];
	loadTabs(items);
}

/**
 * Finds and returns all the tabs in the popup with valid title and URL.
 *
 * @returns {Array} An array of tab objects containing title and URL.
 */
async function findTabs(callback, doReload) {
	const tabElements = document.getElementsByClassName("tab");
	// Get the list of tabs
	const tabPromises = Array.from(tabElements)
		.map(async (tab) => {
			const tabTitle = tab.querySelector(".tabTitle").value;
			const href = tab.querySelector(".url").value;

			// Await the minified URL
			const url = await minifyURL(href);

			if (tabTitle && url) {
				return { tabTitle, url };
			}
			return null; // Return null for invalid tabs
		});

	let availableTabs;
	try {
		// Wait for all promises to resolve and filter out null values
		const resolvedTabs = await Promise.all(tabPromises);
		availableTabs = resolvedTabs.filter((tab) => tab !== null);
	} catch (err) {
		console.error("Error processing tabs:", err);
		availableTabs = [];
	}

	callback(doReload, availableTabs);
}

/**
 * Saves the current tabs to storage and optionally reloads the tab rows.
 *
 * @param {boolean} doReload - Whether to reload the tab rows after saving.
 * @param {Array} tabs - The tabs to save.
 */
function saveTabs(doReload = true, tabs) {
	tabs = tabs ?? findTabs(saveTabs, doReload);
	if (tabs == null || !Array.isArray(tabs)) {
		return;
	}
	setStorage(tabs, true);
	doReload && reloadRows({ tabs, key: "tabs" });
}

/**
 * Handles the import functionality by sending a message that will be used as signal to create an import modal in the Salesforce page.
 */
function importHandler() {
	const message = { what: "add" };
	chrome.runtime.sendMessage({ message, url: location.href });
	close();
}

/**
 * Handles the export functionality by downloading the current tabs as a JSON file.
 */
function exportHandler() {
	// Convert JSON string to Blob
	const blob = new Blob([JSON.stringify(knownTabs, null, 4)], {
		type: "application/json",
	});

	// Create a download link
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "again-why-salesforce.json";

	// Append the link to the body and trigger the download
	document.body.appendChild(link);
	link.click();

	// Cleanup
	document.body.removeChild(link);
}

/**
 * Clears all saved tabs and saves the empty list.
 */
function emptyTabs() {
	saveTabs(true, []);
}

// listen to possible updates from tableDragHandler
addEventListener("message", (e) => {
	e.source == window && e.data.what === "order" && saveTabs();
});

document.getElementById("theme-selector").addEventListener(
	"click",
	switchTheme,
);
document.getElementById("import").addEventListener("click", importHandler);
document.getElementById("export").addEventListener("click", exportHandler);
document.getElementById("delete-all").addEventListener("click", emptyTabs);
