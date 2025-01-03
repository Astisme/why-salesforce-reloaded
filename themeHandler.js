const html = document.documentElement;
let systemColorListener = null;

function sendMessageTheme(theme) {
	chrome.runtime.sendMessage({ message: { what: "theme", theme } });
}

function messageAndUpdateTheme(theme, updateUserTheme = false) {
	sendMessageTheme(theme);
	setTimeout(() => {
		html.dataset.theme = theme;
		localStorage.setItem("usingTheme", theme);
		if (updateUserTheme) {
			html.dataset.usertheme = theme;
			localStorage.setItem("userTheme", theme);
		}
	}, 10);
}

function handleSystemColorSchemeChange(e) {
	// check if theme has to be changed
	const systemThemeValue = e.matches ? "dark" : "light";
	const htmlThemeValue = html.dataset.theme;
	if (systemThemeValue !== htmlThemeValue) {
		messageAndUpdateTheme(systemThemeValue);
	}
}

export function systemColorSchemeListener(enable = true) {
	if (
		window.matchMedia == null || enable == null ||
		(enable && systemColorListener != null) ||
		(!enable && systemColorListener == null)
	) {
		return;
	}

	localStorage.setItem("userTheme", "system");
	if (enable) {
		// If enabling, add the systemColorListener
		systemColorListener = window.matchMedia("(prefers-color-scheme: dark)");
		systemColorListener.addEventListener(
			"change",
			handleSystemColorSchemeChange,
		);
		// Initial check for the current color scheme
		handleSystemColorSchemeChange(systemColorListener);
	} else {
		// If disabling, remove the systemColorListener
		systemColorListener.removeEventListener(
			"change",
			handleSystemColorSchemeChange,
		);
		systemColorListener = null;
	}
}

export function handleSwitchColorTheme() {
	const newTheme = html.dataset.theme === "light" ? "dark" : "light";
	messageAndUpdateTheme(newTheme, true);
}

export function initTheme() {
	html.dataset.usertheme = localStorage.getItem("userTheme") ?? "system";
	html.dataset.theme = html.dataset.usertheme !== "system"
		? html.dataset.usertheme
		: null;
	// call other function to match system theme
	systemColorSchemeListener(html.dataset.usertheme === "system");
}

initTheme();
