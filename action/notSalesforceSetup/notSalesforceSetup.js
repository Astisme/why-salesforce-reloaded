// deno-lint-ignore-file no-window
import { initTheme } from "../../themeHandler.js";
initTheme();

/**
 * Dynamically creates and inserts content into the page based on the "url" query parameter.
 * Validates if the URL corresponds to a valid Salesforce Lightning Setup page.
 * Updates the DOM with appropriate text and button visibility based on the validation.
 */

const div = document.createElement("div");
const prefix = document.createTextNode("This is not a ");
const strongEl = document.createElement("strong");
const otherText = document.createTextNode("");

const sfsetupTextEl = document.querySelector("h3");
sfsetupTextEl.innerText = "";
sfsetupTextEl.appendChild(div);

let insertPrefix = true;
let strongFirst = true;

const page = new URLSearchParams(window.location.search).get("url");
if (page != null) { // we're in a salesforce page
	let domain;

	try {
		domain = new URL(page).origin;
	} catch (_) {
		strongEl.textContent = "Invalid URL";
		otherText.textContent = " detected.";
		insertPrefix = false;
	}

	// domain is null if an error occurred
	if (domain != null) {
		// Validate the domain (make sure it's a Salesforce domain)
		const authorizedDomainRegex =
			/^https:\/\/[a-zA-Z0-9.-]+\.lightning\.force\.com\/.*/;
		if (!authorizedDomainRegex.test(page)) {
			strongEl.textContent = "Salesforce Lightning";
			otherText.textContent = " Setup Page";
		} else {
			// switch which button is shown
			document.getElementById("login").classList.add("hidden");
			const goSetup = document.getElementById("go-setup");
			goSetup.classList.remove("hidden");
			// update the button href to use the domain
			goSetup.href = `${domain}/lightning/setup/SetupOneHome/home`;
			// update the bold on the text
			otherText.textContent = "Salesforce Lightning";
			strongEl.textContent = " Setup Page";
			strongFirst = false;
		}
	}
} else {
	strongEl.textContent = "Salesforce Lightning";
	otherText.textContent = " Setup Page";
}
insertPrefix && div.appendChild(prefix);
if (strongFirst) {
	div.appendChild(strongEl);
	div.appendChild(otherText);
} else {
	div.appendChild(otherText);
	div.appendChild(strongEl);
}

// close the popup when the user clicks on the redirection link
document.querySelectorAll("a").forEach((a) => {
	a.addEventListener("click", (e) => {
		e.preventDefault();
		open(a.href, "_blank");
		setTimeout(() => close(), 200);
	});
});
