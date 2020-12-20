let favicon = document.querySelector("#favicon");

function updateFavicon(isDark) {
	favicon.href = "/Vanilla/assets/favicon-" + (isDark ? "dark" : "light") + ".png";
}

if(window.matchMedia != null) {
	let themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
	updateFavicon(themeMedia.matches);

	themeMedia.addListener(media => {updateFavicon(media.matches);});
}