// Vanilla Customiser v2
// MIT License (c) Elttob 2021

let preferredTheme = "platinum";

if(window.matchMedia != null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
	preferredTheme = "graphite";
}

document.documentElement.className = "theme-" + preferredTheme;