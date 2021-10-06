// Vanilla Icon Exporter v2
// MIT License (c) Elttob 2021

import * as render from "./render.js"

const PALETTE_TRANSITION_TIME = 0.4

let previewCanvas = document.querySelector("#preview")

let prevPalette = null
let nextPalette = null
let paletteTransitionStart = 0

let iconList = null

// adapted from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRGB(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function ease(x) {
	let y = 1 - x*x
	y *= y * y
	return 1 - y
}

/**
 * Returns the icon palette as rendered, including blended transitional states.
 */
function getCurrentPalette() {
	let currentPalette
	let blendRatio = (Date.now() - paletteTransitionStart) / (1000 * PALETTE_TRANSITION_TIME)

	if(blendRatio >= 1) {
		currentPalette = nextPalette
	} else {
		blendRatio = ease(blendRatio)
		currentPalette = {}
		Object.keys(nextPalette).forEach(key => {
			let prevColour = prevPalette[key]
			let nextColour = nextPalette[key]
			
			currentPalette[key] = {
				r: (nextColour.r - prevColour.r) * blendRatio + prevColour.r,
				g: (nextColour.g - prevColour.g) * blendRatio + prevColour.g,
				b: (nextColour.b - prevColour.b) * blendRatio + prevColour.b
			}
		})
	}

	return currentPalette
}

/**
 * Transitions to a palette, translating it from the 'palettes.json' format into
 * raw RGB values in the process.
 */
export function setPalette(palette, overrideColour = null, instant = false) {
	paletteTransitionStart = instant ? 0 : Date.now()
	prevPalette = nextPalette
	nextPalette = {}

	Object.keys(palette.colours).forEach(key => {
		let realColour = overrideColour
		if(realColour == null) {
			realColour = key
		}
		nextPalette[key] = hexToRGB(palette.colours[realColour])
	})
}

/**
 * Clears and re-renders the contents of the preview canvas.
 */
function renderPreview() {
	let currentPalette = getCurrentPalette()
	let context = previewCanvas.getContext("2d")

	context.clearRect(0, 0, previewCanvas.width, previewCanvas.height)

	let gridSize = 1
	while(gridSize * gridSize < iconList.length) {
		gridSize++
	}

	let gridCellSizePx = 20
	while(
		gridCellSizePx*2 * (gridSize + 1) < previewCanvas.width
		&& gridCellSizePx*2 * (gridSize + 1) < previewCanvas.height
	) {
		gridCellSizePx *= 2
	}

	let gridWidthPx = gridCellSizePx * gridSize
	let gridHeightPx = gridCellSizePx * Math.ceil(iconList.length / gridSize)
	let gridTopPx = (previewCanvas.height - gridHeightPx) / 2
	let gridLeftPx = (previewCanvas.width - gridWidthPx) / 2
	gridTopPx = Math.floor(gridTopPx)
	gridLeftPx = Math.floor(gridLeftPx)

	let gridCellPaddingPx = gridCellSizePx / 20

	let gridCellX = 0
	let gridCellY = 0
	for(let icon of iconList) {
		render.renderIcon(
			context, 
			icon.icon, 
			gridLeftPx + gridCellX*gridCellSizePx + gridCellPaddingPx, 
			gridTopPx + gridCellY*gridCellSizePx + gridCellPaddingPx,
			gridCellSizePx * 16/20,
			currentPalette[icon.colour]
		)
		gridCellX++
		if(gridCellX == gridSize) {
			gridCellX = 0
			gridCellY++
		}
	}
}


/**
 * Initialises the preview canvas.
 */
 export function init(icondata) {
	iconList = icondata
	const previewCanvas = document.querySelector("#preview")

	function updateCanvasSize() {
		let dpi = window.devicePixelRatio
		previewCanvas.width = previewCanvas.clientWidth * dpi
		previewCanvas.height = previewCanvas.clientHeight * dpi

		renderPreview()
	}

	updateCanvasSize()
	window.addEventListener('resize', updateCanvasSize)

	let previouslyAnimating = false

	function onRenderStep() {
		let isAnimating = Date.now() - paletteTransitionStart <= 1000*PALETTE_TRANSITION_TIME

		// if we aren't animating this frame, but was last frame, we render one
		// last time to make sure the colours are completely blended
		if(isAnimating || previouslyAnimating) {
			renderPreview()
		}
		
		previouslyAnimating = isAnimating
		requestAnimationFrame(onRenderStep)
	}

	requestAnimationFrame(onRenderStep)
}