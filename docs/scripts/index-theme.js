function updateTheme(isDark) {
	document.documentElement.className = "theme-" + (isDark ? "graphite" : "platinum");
	document.querySelector(".icon-gallery").src = "/Vanilla/assets/index/icons-" + (isDark ? "dark" : "light") + ".svg";
}

if(window.matchMedia != null) {
	let themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
	updateTheme(themeMedia.matches);

	themeMedia.addListener(media => {updateTheme(media.matches);});
}