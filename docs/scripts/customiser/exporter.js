// Vanilla Icon Exporter v2
// MIT License (c) Elttob 2021

import * as render from "./render.js"

let exportSheetCanvas = document.createElement("canvas")
let exportIconCanvas = document.createElement("canvas")

// adapted from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRGB(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

export async function exportBlob(iconList, palette, overrideColour, exportResolution) {
	const exportWithSheet = exportResolution <= 64

	let zip = new JSZip()
	let modManagerFolder = zip.folder("ModManagerIcons")

	let context = exportIconCanvas.getContext("2d")
	exportIconCanvas.width = exportResolution
	exportIconCanvas.height = exportResolution

	let sheetContext = exportSheetCanvas.getContext("2d")

	if(exportWithSheet) {
		exportSheetCanvas.width = iconList.length * exportResolution
		exportSheetCanvas.height = exportResolution

		sheetContext.clearRect(0, 0, iconList.length * exportResolution, exportResolution)
	}

	let iconPromises = []

	context.save()
	try {
		let index = 0
		for(const iconData of iconList) {
			let colour = iconData.colour
			if(overrideColour != null) {
				colour = overrideColour
			}
			let rgbColour = hexToRGB(palette.colours[colour])

			context.clearRect(0, 0, exportResolution, exportResolution)
			render.renderIcon(context, iconData.icon, 0, 0, exportResolution, rgbColour)

			if(exportWithSheet) {
				render.renderIcon(sheetContext, iconData.icon, index * exportResolution, 0, exportResolution, rgbColour)
			}

			iconPromises[index] = new Promise(resolve => exportIconCanvas.toBlob(resolve))

			index++
		}
	} finally {
		context.restore()
	}

	let iconBlobs = await Promise.all(iconPromises)

	for(let iconIndex=0; iconIndex < iconList.length; iconIndex++) {
		modManagerFolder.file("explorer-icon-" + iconIndex + ".png", iconBlobs[iconIndex])
	}

	if(exportWithSheet) {
		let iconsheetBlob = await new Promise(resolve => exportSheetCanvas.toBlob(resolve))
		zip.file("ClassImages.png", iconsheetBlob)
	}

	let zipBlob = await zip.generateAsync({type: "blob"})
	return zipBlob
}