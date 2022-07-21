// Vanilla Icon Renderer v2
// MIT License (c) Elttob 2021

// Instead of using relative URLs, we're using absolute URLs for portability.
const BASE_URL = "https://elttob.uk/Vanilla/icons/"
// The size of icons on the icon sheet, in pixels
const ICON_SIZE = 16

let iconSheet = null
let isLoaded = false

let renderTemporaryCanvas = document.createElement("canvas")

/**
 * Renders an icon to a canvas, at the specified position and scale.
 * @param {*} destination The destination canvas context to render to
 * @param {*} iconId The ID of the icon to render
 * @param {*} x The X position on the canvas
 * @param {*} y The Y position on the canvas
 * @param {*} size The size to render at
 * @param {*} colour The colour of the icon (as an object with r/g/b fields)
 * @param {*} alpha The transparency of the icon (0-1)
 */
export function renderIcon(destination, iconId, x, y, size, colour = {r: 255, g: 255, b: 255}, alpha = 1) {
	if(!isLoaded) {
		throw new Error("Vanilla icon renderer is not initialised")
	}

	renderTemporaryCanvas.width = size
	renderTemporaryCanvas.height = size

	let context = renderTemporaryCanvas.getContext("2d")

	context.clearRect(0, 0, size, size)
	context.drawImage(iconSheet,
		// source rectangle
		iconId * ICON_SIZE, 0,
		ICON_SIZE, ICON_SIZE,

		// destination rectangle
		0, 0,
		size, size)

	let imageData = context.getImageData(0, 0, size, size)
	let pixels = imageData.data

	for(let index=0; index<pixels.length; index += 4) {
		pixels[index    ] = colour.r
		pixels[index + 1] = colour.g
		pixels[index + 2] = colour.b
		pixels[index + 3] *= alpha
	}

	context.putImageData(imageData, 0, 0)

	destination.drawImage(renderTemporaryCanvas, x, y)
}

/**
 * Initialises the renderer; this loads the icon sheet and metadata needed by
 * the renderer.
 */
export async function init() {
	function loadImage(url) {
		return new Promise((resolve, reject) => {
			let image = new Image()
			image.onload = () => resolve(image)
			image.onerror = reject
			image.src = url
		});
	}

	iconSheet = await loadImage(BASE_URL + "icons.svg")
	isLoaded = true
}

