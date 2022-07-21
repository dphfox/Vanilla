// Vanilla Customiser v2
// MIT License (c) Elttob 2021

import * as render from "./render.js"
import * as exporter from "./exporter.js"
import * as previewer from "./previewer.js"

// Instead of using relative URLs, we're using absolute URLs for portability.
const BASE_URL = "https://elttob.uk/Vanilla/icons/"

let icondata
let palettes

let activePalette = null
let overrideColour = null
let exportResolution = null

/**
 * Returns the palette object with the given ID.
 * @param {*} paletteID - The id to search for
 */
function getPaletteByID(paletteID) {
	for(const palette of palettes.palettes) {
		if(palette.id == paletteID) {
			return palette
		}
	}
	return null
}

/**
 * Changes the currently active colour palette.
 * @param {*} palette - The palette object to use
 */
function setActivePalette(palette) {
	document.documentElement.className = "theme-" + palette.page_colours
	activePalette = palette

	const paletteOptions = document.querySelectorAll("input[name=theme][type=radio]")

	for(const paletteOption of paletteOptions) {
		paletteOption.checked = paletteOption.value == palette.id
	}

	previewer.setPalette(activePalette, overrideColour)
}

/**
 * Initialises the palette options on the customiser page.
 */
function initPalettes() {
	let userTheme = "light";
	if(window.matchMedia != null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		userTheme = "dark"
	}

	const paletteFieldset = document.querySelector("#palette-options")

	for(const palette of palettes.palettes) {
		paletteFieldset.innerHTML += `<label><input type="radio" name="theme" value="${palette.id}">${palette.title}</label>`
	}

	setActivePalette(getPaletteByID(palettes.defaults[userTheme]))

	const paletteOptions = document.querySelectorAll("input[name=theme][type=radio]")

	for(const paletteOption of paletteOptions) {
		paletteOption.addEventListener('click', () => {
			setActivePalette(getPaletteByID(paletteOption.value))
		})
	}
}

/**
 * Changes the current override colour, or resets it to null.
 * @param {*} colour - The new override colour, or null
 */
function setOverrideColour(colour) {
	overrideColour = colour

	const styleOptions = document.querySelectorAll("input[name=style][type=radio]")

	for(const styleOption of styleOptions) {
		switch(styleOption.value) {
			case "colourful":
				styleOption.checked = overrideColour == null
				break
			case "mono":
				styleOption.checked = overrideColour == "grey"
				break
			default:
				styleOption.checked = false
				break
		}
	}

	previewer.setPalette(activePalette, overrideColour)
}

/**
 * Initialises the style options on the customiser page.
 */
function initStyles() {
	setOverrideColour(null)

	const styleOptions = document.querySelectorAll("input[name=style][type=radio]")

	for(const styleOption of styleOptions) {
		styleOption.addEventListener('click', () => {
			const colour = styleOption.value == "mono" ? "grey" : null
			setOverrideColour(colour)
		})
	}
}

/**
 * Changes the resolution used when exporting icons.
 * @param {*} resolution - The size of exported icons, in px
 */
function setExportResolution(resolution) {
	exportResolution = resolution

	const resolutionOptions = document.querySelectorAll("input[name=resolution][type=radio]")

	for(const resolutionOption of resolutionOptions) {
		resolutionOption.checked = resolutionOption.value == exportResolution
	}
}

/**
 * Initialises the resolution options on the customiser page.
 */
function initResolutions() {
	setExportResolution(16)

	const resolutionOptions = document.querySelectorAll("input[name=resolution][type=radio]")

	for(const resolutionOption of resolutionOptions) {
		resolutionOption.addEventListener('click', () => {
			const resolution = Number(resolutionOption.value)
			setExportResolution(resolution)
		})
	}
}

/**
 * Generates and downloads a zip of the icon set with the current settings.
 */
async function exportIcons() {
	showModalDialog('preparing-download')

	const exportDownloadLink = document.querySelector("#export-download-link")

	// add a timeout to give the page time to show the dialog
	await new Promise(resolve => setTimeout(resolve, 500))

	let zipBlob = await exporter.exportBlob(icondata, activePalette, overrideColour, exportResolution)

	if(exportDownloadLink.href != "") {
		URL.revokeObjectURL(exportDownloadLink.href)
	}
	exportDownloadLink.href = URL.createObjectURL(zipBlob)
	exportDownloadLink.click()

	showModalDialog('download-ready')
}

/**
 * Initialises the main page asynchronously.
 */
async function init() {
	icondata = await fetch(BASE_URL + "icondata.json").then(response => response.json())
	palettes = await fetch(BASE_URL + "palettes.json").then(response => response.json())

	await render.init()

	initPalettes()
	initStyles()
	initResolutions()

	previewer.setPalette(activePalette, overrideColour, true)
	previewer.init(icondata)

	document.querySelector("#export-button").addEventListener("click", exportIcons)
	document.querySelector("#page-loading").className = "done"
}

init().catch((e) => {
	alert("Error during customiser initialisation:\n" + e)
	console.error(e);
})