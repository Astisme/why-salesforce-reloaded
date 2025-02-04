// deno-lint-ignore-file no-window
"use strict";
import { handleSwitchColorTheme, initTheme } from "../themeHandler.js";

const html = document.documentElement;
const sun = document.getElementById("sun");
const moon = document.getElementById("moon");

const tabTemplate = document.getElementById("tr_template");
const tabAppendElement = document.getElementById("tabs");

/**
 * tabForCurrentTabs = {
 *      tabTitle: "string", // this is the label for the URL
 *      url: "string", // this is the URL in its minified version
 *      org: "string | undefined", // this is the Org name where this tab is active in
 * }
 */
const pop_currentTabs = [];
let loggers = [];

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

function getCurrentTab(callback) {
	const queryParams = { active: true, currentWindow: true };
	if (callback != null) {
		chrome.tabs.query(queryParams, callback);
	} else {
		return new Promise((resolve, reject) => {
			chrome.tabs.query(queryParams, (res) => {
				if (chrome.runtime.lastError) {
					reject(chrome.runtime.lastError);
				} else {
					resolve(res[0]);
				}
			});
		});
	}
}
// queries the currently active tab of the current active window
getCurrentTab((tabs) => {
	// is null if the extension cannot access the current tab
	if (tabs[0].url == null || !tabs[0].url.match(".*\/lightning\/setup\/.*")) {
		window.location.href = chrome.runtime.getURL(
			`action/notSalesforceSetup/notSalesforceSetup.html${
				tabs[0].url != null ? "?url=" + tabs[0].url : ""
			}`,
		);
	} else {
		pop_getStorage(loadTabs);
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

/**
 * Sends a message to the background script with the specified message and the current URL.
 *
 * @param {Object} message - The message to send.
 * @param {function} callback - The callback to execute after sending the message.
 */
function pop_sendMessage(message, callback) {
	if (callback != null) {
		return chrome.runtime.sendMessage(
			{ message, url: location.href },
			callback,
		);
	} else {
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage(
				{ message, url: location.href },
				(response) => {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
					} else {
						resolve(response);
					}
				},
			);
		});
	}
}

/**
 * Retrieves stored data from the background script and invokes the provided callback.
 *
 * @param {function} callback - The callback to invoke with the retrieved data.
 */
function pop_getStorage(callback) {
	pop_sendMessage({ what: "get" }, callback);
}

/**
 * Sends a message indicating that data has been saved successfully.
 */
function pop_afterSet() {
	pop_sendMessage({ what: "saved" });
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
 * Overwrites the `pop_currentTabs` array with new tabs, with an option to reset the tabs (replacing all of them with the newTabs) and another one to remove non-org-specific tabs.
 *
 * @param {Array<Object> | Object} newTabsOrOptions - An array of new tab objects to be added to `pop_currentTabs` OR An object containing the parameters for key-based function calling.
 * @param {boolean} [resetTabs=true] - If `true`, resets `pop_currentTabs`.
 * @param {boolean} [removeOrgSpecificTabs=false] - If `true`, removes all Org specific tabs; otherwise, only non-org-specific tabs (tabs with `org == null`) are removed, retaining org-specific tabs.
 * @param {boolean} [setStorage=true] - If `true`, calls `pop_setStorage` to save the `pop_currentTabs` array.
 *
 * @example
 * // Remove all tabs
 * pop_overwriteCurrentTabs(null, true, true);
 * pop_overwriteCurrentTabs([], true, true);
 *
 * @example
 * // Remove all org-specific tabs
 * pop_overwriteCurrentTabs(null, false, true);
 * pop_overwriteCurrentTabs([], false, true);
 *
 * @example
 * // DEFAULT: Keep only org-specific tabs
 * pop_overwriteCurrentTabs(null);
 * pop_overwriteCurrentTabs([]);
 * pop_overwriteCurrentTabs(null, true);
 * pop_overwriteCurrentTabs([], true);
 * pop_overwriteCurrentTabs(null, true, false);
 * pop_overwriteCurrentTabs([], true, false);
 *
 * @example
 * // Remove all tabs and add new ones
 * pop_overwriteCurrentTabs([{ tabTitle: "a", url: "a", org: "OrgA" }], true, true);
 *
 * @example
 * // DEFAULT: Keep org-specific tabs and add new ones
 * pop_overwriteCurrentTabs([{ tabTitle: "a", url: "a", org: "OrgA" }, { tabTitle: "b", url: "b" }]);
 * pop_overwriteCurrentTabs([{ tabTitle: "a", url: "a", org: "OrgA" }, { tabTitle: "b", url: "b" }], true);
 * pop_overwriteCurrentTabs([{ tabTitle: "a", url: "a", org: "OrgA" }, { tabTitle: "b", url: "b" }], true, false);
 *
 * @example
 * // Keep all tabs and add new ones
 * pop_overwriteCurrentTabs([{ tabTitle: "a", url: "a", org: "OrgA" }], false);
 * pop_overwriteCurrentTabs([{ tabTitle: "a", url: "a", org: "OrgA" }], false, false);
 *
 * @example
 * // Remove org-specific tabs and add new ones
 * pop_overwriteCurrentTabs([{ tabTitle: "a", url: "a", org: "OrgA" }], false, true);
 */
function pop_overwriteCurrentTabs(
	newTabsOrOptions,
	resetTabs = true,
	removeOrgSpecificTabs = false,
) {
	let newTabs;
	if (
		typeof newTabsOrOptions === "object" && !Array.isArray(newTabsOrOptions)
	) {
		const {
			newTabs: nt,
			resetTabs: rt = true,
			removeOrgSpecificTabs: ro = false,
		} = newTabsOrOptions;
		newTabs = nt;
		resetTabs = rt;
		removeOrgSpecificTabs = ro;
	} else {
		newTabs = newTabsOrOptions;
	}

	/**
	 * Filters the current tabs based on whether they are org-specific.
	 *
	 * @param {boolean} keepOrgTabs - If `true`, keeps org-specific tabs (tabs with `org != null`); otherwise, keeps non-org-specific tabs (tabs with `org == null`).
	 * @returns {Array<Object>} - The filtered array of tabs.
	 */
	function filterOrgSpecificTabs(isOrgTab = true) {
		return pop_currentTabs.filter((tab) =>
			(isOrgTab && tab.org != null) || (!isOrgTab && tab.org == null)
		);
	}

	if (resetTabs) {
		if (removeOrgSpecificTabs) {
			pop_currentTabs.length = 0;
		} else {
			// prevent accidental deletion of tabs that are not for "this" current Org
			const orgSpecificTabs = filterOrgSpecificTabs();
			pop_currentTabs.length = 0;
			pop_currentTabs.push(...orgSpecificTabs);
		}
	} else if (removeOrgSpecificTabs) {
		const non_orgSpecificTabs = filterOrgSpecificTabs(false);
		pop_currentTabs.length = 0;
		pop_currentTabs.push(...non_orgSpecificTabs);
	}

	function removeDuplicates(array) {
		const unique = new Map();
		array.forEach((item) => {
			const normalized = JSON.stringify(Object.entries(item).sort());
			unique.set(normalized, item);
		});
		return Array.from(unique.values());
	}

	// needed due to org-specific tabs (don't know why)
	const tabsNoDuplicates = removeDuplicates([...pop_currentTabs, ...newTabs]);
	pop_currentTabs.length = 0;
	pop_currentTabs.push(...tabsNoDuplicates);
}

/**
 * Sets the stored tabs data in the background script, optionally checking for changes.
 *
 * @param {Array} tabs - The tabs to save.
 */
function pop_setStorage(tabs) {
	if (!arraysAreEqual(tabs, pop_currentTabs)) {
		pop_sendMessage({ what: "set", tabs }, pop_afterSet);
	}
	pop_overwriteCurrentTabs(tabs);
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
function pop_minifyURL(url) {
	return pop_sendMessage({ what: "minify", url });
}

/**
 * Extracts the Org name out of the url passed as input.
 *
 * @param {string} url - The URL from which the Org name has to be extracted
 */
async function pop_extractOrgName() {
	const tab = await getCurrentTab();
	return pop_sendMessage({ what: "extract-org", url: tab.url });
}

/**
 * Checks if the url passed as input contains a Salesforce Id.
 *
 * @param {string} url - The URL to be checked.
 */
function pop_containsSalesforceId(url = location.href) {
	return pop_sendMessage({ what: "contains-sf-id", url });
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
	const tr = tabAppendElement.querySelector("tr:last-child");
	const deleteButton = tr.querySelector("button.delete");

	if (enable) {
		deleteButton.removeAttribute("disabled");
		tr.setAttribute("draggable", "true");
	} else {
		deleteButton.setAttribute("disabled", "true");
		tr.removeAttribute("draggable");
	}
	tr.dataset.draggable = enable;
	tr.querySelector("svg").dataset.draggable = enable;
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
		pop_minifyURL(value)
			.then((v) => {
				element.value = v;
				// check eventual duplicates
				if (pop_currentTabs.some((tab) => tab.url === v)) {
					// show warning in salesforce
					pop_sendMessage({
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

	element.querySelector(".only-org").addEventListener("click", () => {
		saveTabs(false);
	});

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

	pop_extractOrgName()
		.then((orgName) => {
			const rowObjs = items[items.key];
			for (const tab of rowObjs) {
				if (tab.org != null && tab.org !== orgName) {
					continue; // default hide not-this-org org-specific tabs
				}
				const element = createElement();
				element.querySelector(".tabTitle").value = tab.tabTitle;
				element.querySelector(".url").value = tab.url;
				element.querySelector(".only-org").checked = tab.org != null;
				element.querySelector(".delete").removeAttribute("disabled");
				const logger = loggers.pop();
				logger.last_input.title = tab.tabTitle;
				logger.last_input.url = tab.url;

				loggers.push(logger);
				tabAppendElement.append(element);
				updateTabAttributes();
			}
			tabAppendElement.append(createElement()); // leave a blank at the bottom
			pop_overwriteCurrentTabs(rowObjs);
		});
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
	const orgName = await pop_extractOrgName();
	const tabPromises = Array.from(tabElements)
		.map(async (tab) => {
			const tabTitle = tab.querySelector(".tabTitle").value;
			const tabUrl = tab.querySelector(".url").value;
			const onlyOrg = tab.querySelector(".only-org").checked;

			// Await the minified URL
			const url = await pop_minifyURL(tabUrl);

			if (tabTitle && url) {
				const tabVal = { tabTitle, url };
				// the user has not checked the onlyOrg checkbox &&
				// the link does not contain a Salesforce Id
				const containsSalesforceId = await pop_containsSalesforceId(
					tabUrl,
				);
				if (!onlyOrg && !containsSalesforceId) {
					return tabVal;
				}
				tabVal.org = orgName;
				return tabVal;
			}
			return null; // Return null for invalid tabs
		});

	let availableTabs;
	try {
		// Wait for all promises to resolve and filter out null values
		const resolvedTabs = await Promise.all(tabPromises);
		availableTabs = resolvedTabs.filter((tab) => tab !== null);
		// add all the hidden not-this-org tabs
		availableTabs.push(
			...pop_currentTabs.filter((tab) =>
				tab.org != null && tab.org !== orgName
			),
		);
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
	if (tabs == null || !Array.isArray(tabs)) {
		return findTabs(saveTabs, doReload);
	}
	pop_setStorage(tabs);
	doReload && reloadRows({ tabs, key: "tabs" });
}

/**
 * Handles the import functionality by sending a message that will be used as signal to create an import modal in the Salesforce page.
 */
function importHandler() {
	pop_sendMessage({ what: "add" }, close);
}

/**
 * Handles the export functionality by downloading the current tabs as a JSON file.
 */
function pop_exportHandler() {
	pop_sendMessage({ what: "export", tabs: pop_currentTabs }, close);
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
document.getElementById("export").addEventListener("click", pop_exportHandler);
document.getElementById("delete-all").addEventListener("click", emptyTabs);
