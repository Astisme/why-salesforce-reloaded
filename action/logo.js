"use strict";
import { initTheme } from "../themeHandler.js";
initTheme();

const html = document.documentElement;
function updateTheme(theme){
  html.dataset.theme = theme;
}

// listen for theme updates
chrome.runtime.onMessage.addListener(function (mess, _, sendResponse) {
  const message = mess.message;
	if (message == null || message.what == null || message.what !== "theme" || message.theme == null) {
		return;
	}
  sendResponse(null);
  updateTheme(message.theme);
});
