"use strict";

/**
 * Retrieves the favourite button with the specified Id from the page.
 *
 * @param {string} favouriteId - the Id of the favourite button to find.
 * @param {HTMLElement} [button=null] - the HTMLElement of the button which is parent of the favouriteId.
 */
function getFavouriteButton(favouriteId, button = null) {
	return button?.querySelector(`#${favouriteId}`) ??
		button?.querySelector(`.${favouriteId}`) ??
		document.getElementById(favouriteId) ??
		document.querySelector(`.${favouriteId}`);
}
/**
 * Toggles the visibility of the favourite button based on whether the tab is saved.
 *
 * @param {HTMLElement} button - The favourite button element.
 * @param {boolean} isSaved - Optional flag indicating whether the tab is saved.
 */
function toggleFavouriteButton(isSaved, button) {
	// will use the class identifier if there was an error with the image (and was removed)
	const star = getFavouriteButton(starId, button);
	const slashedStar = getFavouriteButton(slashedStarId, button);

	if (isSaved == null) {
		star.classList.toggle("hidden");
		slashedStar.classList.toggle("hidden");
		return;
	}

	if (isSaved) {
		star.classList.add("hidden");
		slashedStar.classList.remove("hidden");
	} else {
		star.classList.remove("hidden");
		slashedStar.classList.add("hidden");
	}
}
/**
 * Adds or removes the current tab from the saved tabs list based on the button's state.
 *
 * @param {HTMLElement} parent - The parent element of the favourite button.
 */
function actionFavourite(parent) {
	minifyURL(href)
		.then((url) => {
			minifiedURL = url;

			if (isCurrentlyOnSavedTab) {
				removeTab(url);
			} else {
				const tabTitle =
					parent.querySelector(".breadcrumbDetail").innerText;
				currentTabs.push({ tabTitle, url });
			}

			toggleFavouriteButton();
			setStorage();
		});
}

/**
 * Checks if the current URL is saved and updates the favourite button accordingly.
 */
function checkUpdateFavouriteButton() {
	// check if the current page is being imported
	minifyURL(href)
		.then((miniURL) => {
			minifiedURL = miniURL;
			const isOnFavouriteTab = currentTabs.some((current) =>
				current.url === miniURL
			);
			toggleFavouriteButton(isOnFavouriteTab);
		});
}

/**
 * Displays the favourite button in the UI if applicable.
 *
 * @param {number} [count=0] - The number of retry attempts to find headers.
 */
function showFavouriteButton(count = 0) {
	if (count > 5) {
		console.error("Again, Why Salesforce - failed to find headers.");
		return setTimeout(() => showFavouriteButton(), 5000);
	}

	// Do not add favourite button on Home and Object Manager
	const standardTabs = ["SetupOneHome/home", "ObjectManager/home"];
	if (standardTabs.includes(minifiedURL)) {
		return;
	}

	// there's possibly 2 headers: one for Setup home and one for Object Manager
	const headers = Array.from(
		document.querySelectorAll("div.overflow.uiBlock > div.bRight"),
	);
	if (headers == null || headers.length < 1) {
		return setTimeout(() => showFavouriteButton(count + 1), 500);
	}

	// ensure we have clean data
	if (wasOnSavedTab == null && isCurrentlyOnSavedTab == null) {
		isOnSavedTab();
	}

	for (const header of headers) {
		if (header.querySelector(`#${buttonId}`) != null) {
			// already inserted my button, check if I should switch it
			checkUpdateFavouriteButton();
			continue;
		}
		header.appendChild(_generateFavouriteButton());
		const button = header.querySelector(`#${buttonId}`); // need to repeat this bit of code because I'm inserting it at the previous line
		toggleFavouriteButton(isCurrentlyOnSavedTab, button); // init correctly
		button.addEventListener(
			"click",
			() => actionFavourite(header.parentNode),
		);
	}
}
