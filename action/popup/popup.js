// deno-lint-ignore-file no-window
"use strict";
import { handleSwitchColorTheme, initTheme } from "../../themeHandler.js";

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

const setupLightning = "/lightning/setup/";
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
 * Cleans up a URL by removing Salesforce-specific parts.
 *
 * @param {string} url - The URL to clean.
 * @returns {string} The cleaned URL.
 */
function cleanupUrl(url) {
	if (url == null || url == "") {
		return "";
	}
	// remove org-specific url
	const home =
		"https:\/\/.*\.my\.salesforce-setup\.com\/lightning\/setup\/.*";
	if (url.match(home)) {
		url = url.slice(url.indexOf(setupLightning));
	}

	if (url.includes(setupLightning)) {
		url = url.slice(url.indexOf(setupLightning) + setupLightning.length); // remove setup subdirectory
	} // do not remove anything if the page is not from setup
	else if (url.includes("/lightning") || url.includes("/_ui/common")) {
		return url;
	}

	if (url.startsWith("/")) {
		url = url.slice(1);
	}
	if (url.endsWith("/")) {
		url = url.slice(0, url.length - 1);
	}

	return url;
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
 * Adds a new empty tab at the bottom of the popup and enables the previously last child's delete button.
 */
function addTab() {
	if (tabAppendElement.childElementCount >= 1) { // if list is empty, there's nothing to disable
		const deleteButton = tabAppendElement.querySelector(
			"td:last-child button.delete",
		);
		deleteButton.disabled = false;
	}
	// add a new empty element
	tabAppendElement.append(createElement());
}

/**
 * Checks if a tab's title and URL are valid and adds a new tab if both are non-empty.
 *
 * @param {Object} inputObj - The tab input object containing title and URL.
 */
function checkAddTab(inputObj) {
	inputObj.title && inputObj.url && addTab();
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
	const delta = last_input.length - value.length;

	if ((delta < -2 || delta > 2) && type === "url") {
		element.value = cleanupUrl(value);
	}

	inputObj[type] = value;
	focusedIndex == (loggers.length - 1) && checkAddTab(inputObj); // if the user is on the last td
}

/**
 * Focus listener to track the currently focused tab index.
 *
 * @param {Event} e - The focus event.
 */
function focusListener(e) {
	focusedIndex = e.target.dataset.element_index;
	saveTabs(false);
}

/**
 * Creates a new tab element for the popup and sets up event listeners for title and URL input fields.
 *
 * @returns {HTMLElement} The created tab element.
 */
function createElement() {
	const element = tabTemplate.content.firstElementChild.cloneNode(true);
	element.dataset.draggable = "false";
	const deleteButton = element.querySelector("button.delete");
	deleteButton.addEventListener("click", deleteTab);
	deleteButton.disabled = true;

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
	const elements = [];
	for (const tab of rowObjs) {
		const element = createElement();
		element.querySelector(".tabTitle").value = tab.tabTitle;
		element.querySelector(".url").value = tab.url;
		element.querySelector(".delete").disabled = false;
		const logger = loggers.pop();
		logger.last_input.title = tab.tabTitle;
		logger.last_input.url = tab.url;
		loggers.push(logger);
		elements.push(element);
	}
	tabAppendElement.append(...elements);
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
function findTabs() {
	const tabs = [];
	const tabElements = document.getElementsByClassName("tab");
	Array.from(tabElements).forEach((tab) => {
		const tabTitle = tab.querySelector(".tabTitle").value;
		const url = cleanupUrl(tab.querySelector(".url").value);
		if (tabTitle && url) {
			tabs.push({ tabTitle, url });
		}
	});
	return tabs;
}

/**
 * Saves the current tabs to storage and optionally reloads the tab rows.
 *
 * @param {boolean} doReload - Whether to reload the tab rows after saving.
 * @param {Array} tabs - The tabs to save.
 */
function saveTabs(doReload = true, tabs) {
	tabs = tabs ?? findTabs();
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
