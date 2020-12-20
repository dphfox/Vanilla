function updateFavicon(isDark) {
	document.documentElement.className = "theme-" + (isDark ? "graphite" : "platinum");
}

if(window.matchMedia != null) {
	let themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
	updateFavicon(themeMedia.matches);

	themeMedia.addListener(media => {updateFavicon(media.matches);});
}

