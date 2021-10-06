// adapted from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRGB(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function urlToImage(url) {
	let image = new Image();
	image.src = url;
	return image;
}

const ICON_COLOURS = {
	platinum: {
		red: hexToRGB("BF4040"),
		yellow: hexToRGB("D68D1F"),
		green: hexToRGB("169C44"),
		blue: hexToRGB("006FB2"),
		purple: hexToRGB("AF38CD"),
		grey: hexToRGB("3F3F3F"),
	},
	graphite: {
		red: hexToRGB("FF6666"),
		yellow: hexToRGB("FFBC57"),
		green: hexToRGB("26D964"),
		blue: hexToRGB("4CBCFF"),
		purple: hexToRGB("E066FF"),
		grey: hexToRGB("EBEBEB"),
	},
};

const INPUT_ICON_COLOURS = ICON_COLOURS.platinum;

const ICONSET_URL = "/Vanilla-Dev/icons/icons.svg";
const ICON_SIZE_PX = 16;
const EXPORT_SIZE_PX = 16;
const PREVIEW_ICON_PADDING = 4;

let iconsetImage;
let iconsetIsLoaded = false;

let previewCanvasContext = document.querySelector("#preview").getContext("2d");

let currentTheme = "platinum";
let currentStyle = "colourful";

let iconSetSize = 0;

let iconColourMap = {};

let previewGridWidth = 0;
let previewGridHeight = 0;

function recomputePreviewGridSize() {
	console.log("Recomputing preview grid size...");
	previewGridWidth = 1;
	while(previewGridWidth * previewGridWidth < iconSetSize) {
		previewGridWidth++;
	}
	previewGridHeight = Math.ceil(iconSetSize / previewGridWidth);
	console.log("Preview grid size is " + previewGridWidth + "x" + previewGridHeight);
}

function loadIconSetImage() {
	iconsetImage = urlToImage(ICONSET_URL);

	function onLoaded() {
		console.log("Loaded icon set successfully");
		iconSetSize = Math.floor(iconsetImage.width / ICON_SIZE_PX);
		console.log("Icon set contains " + iconSetSize + " icons");

		document.querySelector("#page-loading").className = "done";
		iconsetIsLoaded = true;

		recomputePreviewGridSize();
		render();
	}

	console.log("Loading icon set from " + iconsetImage.src);

	if(iconsetImage.complete) {
		onLoaded()
	} else {
		iconsetImage.onload = onLoaded;
	}
}

function computePreviewLayout(viewportWidth, viewportHeight) {
	let previewGridDimensionMax = Math.max(previewGridWidth, previewGridHeight);
	let viewportMin = Math.min(viewportWidth, viewportHeight);

	let iconScale = 1;
	let iconExtents = ICON_SIZE_PX + PREVIEW_ICON_PADDING;

	while(iconExtents * previewGridDimensionMax * 2 < viewportMin) {
		iconScale *= 2;
		iconExtents *= 2;
	}

	return {
		scale: iconScale,
		extents: {
			width: previewGridWidth*iconExtents - PREVIEW_ICON_PADDING*iconScale,
			height: previewGridHeight*iconExtents - PREVIEW_ICON_PADDING*iconScale
		}
	}
}

let previewBufferContext = document.createElement("canvas").getContext("2d");
let exportBufferContext = document.createElement("canvas").getContext("2d");

function colouriseBuffer(context, iconSize, gridWidth, gridSpacing) {
	let bufferWidth = context.canvas.width;
	let bufferHeight = context.canvas.height;
	let bufferImageData = context.getImageData(0, 0, bufferWidth, bufferHeight);
	let pixels = bufferImageData.data;

	for(let iconIndex=0; iconIndex < iconSetSize; iconIndex++) {
		let gridX = iconIndex % gridWidth;
		let gridY = Math.floor(iconIndex / gridWidth);

		let iconColour = iconColourMap[iconIndex];

		if(iconColour == undefined) {
			let colourKeys = Object.keys(INPUT_ICON_COLOURS);

			determineColour:
			for(let localPixelX = 0; localPixelX < iconSize; localPixelX++) {
				for(let localPixelY = 0; localPixelY < iconSize; localPixelY++) {
					let realPixelX = gridX*gridSpacing + localPixelX;
					let realPixelY = gridY*gridSpacing + localPixelY;
					let index = (realPixelY * bufferWidth) + realPixelX;
					index *= 4;

					let alpha = pixels[index + 3];

					if(alpha < 1) {
						continue;
					}

					let pixelRed = pixels[index];
					let pixelGreen = pixels[index + 1];
					let pixelBlue = pixels[index + 2];
					
					let closestColour = null;
					let closestDistance = null;

					colourKeys.forEach(colourName => {
						let colour = INPUT_ICON_COLOURS[colourName];
						let distance =
							Math.abs(pixelRed - colour.r) +
							Math.abs(pixelGreen - colour.g) +
							Math.abs(pixelBlue - colour.b);
						
						if(closestColour == null || distance < closestDistance) {
							closestColour = colourName;
							closestDistance = distance;
						}
					});

					iconColour = closestColour;
					break determineColour;
				}
			}

			iconColourMap[iconIndex] = iconColour;
		}

		if(currentStyle === "mono") {
			iconColour = "grey";
		}

		if(iconColour == undefined) {
			iconColour = "grey";
		}

		let iconColourRGB = ICON_COLOURS[currentTheme][iconColour];

		for(let localPixelX = 0; localPixelX < iconSize; localPixelX++) {
			for(let localPixelY = 0; localPixelY < iconSize; localPixelY++) {
				let realPixelX = gridX*gridSpacing + localPixelX;
				let realPixelY = gridY*gridSpacing + localPixelY;
				let index = (realPixelY * bufferWidth) + realPixelX;
				index *= 4;

				pixels[index] = iconColourRGB.r;
				pixels[index + 1] = iconColourRGB.g;
				pixels[index + 2] = iconColourRGB.b;
			}
		}

	}

	context.putImageData(bufferImageData, 0, 0);
}

function renderPreviewBuffer(previewLayout) {
	console.log("Re-rendering preview buffer...");
	previewBufferContext.canvas.width = previewLayout.extents.width;
	previewBufferContext.canvas.height = previewLayout.extents.height;

	previewBufferContext.save();

	try {

		previewCanvasContext.clearRect(0, 0, previewLayout.extents.width, previewLayout.extents.height);

		// step 1: render icons into buffer

		let previewIconSize = ICON_SIZE_PX * previewLayout.scale;
		let previewGridSpacing = previewLayout.scale * (ICON_SIZE_PX + PREVIEW_ICON_PADDING);

		for(let iconIndex=0; iconIndex < iconSetSize; iconIndex++) {
			let gridX = iconIndex % previewGridWidth;
			let gridY = Math.floor(iconIndex / previewGridWidth);

			previewBufferContext.drawImage(iconsetImage, 
				iconIndex * ICON_SIZE_PX, 0, 
				ICON_SIZE_PX, ICON_SIZE_PX, 

				gridX*previewGridSpacing, gridY*previewGridSpacing, 
				previewIconSize, previewIconSize
			);
		}

		// step 2: colourise all icons

		colouriseBuffer(previewBufferContext, previewIconSize, previewGridWidth, previewGridSpacing);
	} finally {
		previewBufferContext.restore();
	}
	console.log("Rendered preview buffer");
}

function renderExportBuffer() {
	console.log("Re-rendering export buffer");

	exportBufferContext.canvas.width = iconSetSize * EXPORT_SIZE_PX;
	exportBufferContext.canvas.height = EXPORT_SIZE_PX;

	exportBufferContext.save();

	try {

		exportBufferContext.clearRect(0, 0, exportBufferContext.canvas.width, exportBufferContext.canvas.height);

		// step 1: render icons into buffer

		exportBufferContext.drawImage(iconsetImage, 0, 0, iconSetSize * EXPORT_SIZE_PX, EXPORT_SIZE_PX);

		// step 2: colourise all icons

		colouriseBuffer(exportBufferContext, EXPORT_SIZE_PX, iconSetSize, EXPORT_SIZE_PX);
	} finally {
		exportBufferContext.restore();
	}
	console.log("Rendered export buffer");
}

let lastPreviewLayout;
let lastStyle;
let lastTheme;

function render() {
	if(!iconsetIsLoaded) return;

	previewCanvasContext.save();
	try {
		let width = previewCanvasContext.canvas.width;
		let height = previewCanvasContext.canvas.height;

		previewCanvasContext.clearRect(0, 0, width, height);

		if(iconsetIsLoaded) {
			let previewLayout = computePreviewLayout(width, height);

			if(lastPreviewLayout == null 
				|| lastPreviewLayout.scale != previewLayout.scale
				|| lastPreviewLayout.extents.width != previewLayout.extents.width
				|| lastPreviewLayout.extents.height != previewLayout.extents.height
				
				|| lastStyle == null || lastStyle != currentStyle
				
				|| lastTheme == null || lastTheme != currentTheme) {
					renderPreviewBuffer(previewLayout);

					lastPreviewLayout = previewLayout;
					lastStyle = currentStyle;
					lastTheme = currentTheme;
			}

			let previewExtentsX = Math.floor((width - previewLayout.extents.width) / 2);
			let previewExtentsY = Math.floor((height - previewLayout.extents.height) / 2);

			previewCanvasContext.drawImage(previewBufferContext.canvas, previewExtentsX, previewExtentsY);
		}

	} finally {
		previewCanvasContext.restore();
	}
}

let exportIconBlobContext = document.createElement("canvas").getContext("2d");
let exportDownloadLink = document.createElement("a");
exportDownloadLink.download = "VanillaIcons.zip";

function exportIcons() {
	showModalDialog('preparing-download');
	renderExportBuffer();

	let iconPromises = [];
	
	exportIconBlobContext.canvas.width = EXPORT_SIZE_PX;
	exportIconBlobContext.canvas.height = EXPORT_SIZE_PX;

	for(let iconIndex = 0; iconIndex < iconSetSize; iconIndex++) {
		exportIconBlobContext.save();
		try {
			exportIconBlobContext.clearRect(0, 0, EXPORT_SIZE_PX, EXPORT_SIZE_PX);
			exportIconBlobContext.drawImage(exportBufferContext.canvas, iconIndex * EXPORT_SIZE_PX, 0, EXPORT_SIZE_PX, EXPORT_SIZE_PX, 0, 0, EXPORT_SIZE_PX, EXPORT_SIZE_PX);
			iconPromises[iconIndex] = new Promise((resolve, reject) => exportIconBlobContext.canvas.toBlob(resolve));
		} finally {
			exportIconBlobContext.restore();
		}
	}

	Promise.all(iconPromises).then((iconBlobs) => {
		exportBufferContext.canvas.toBlob((iconsheetBlob) => {
			let zip = new JSZip();

			zip.file("ClassImages.png", iconsheetBlob);
			let modManagerFolder = zip.folder("ModManagerIcons");

			for(let iconIndex=0; iconIndex < iconSetSize; iconIndex++) {
				modManagerFolder.file("explorer-icon-" + iconIndex + ".png", iconBlobs[iconIndex]);
			}

			zip.generateAsync({type: "blob"}).then((blob) => {
				exportDownloadLink.href = URL.createObjectURL(blob);
				exportDownloadLink.click();
				setTimeout(URL.revokeObjectURL, 5000, exportDownloadLink);
			});

			showModalDialog('how-to-install');
		});
	});
}

{ // theme setting options
	function setTheme(newTheme) {
		document.documentElement.className = "theme-" + newTheme;
		currentTheme = newTheme;
		render();
	}

	setTheme(preferredTheme);

	let themeOptions = document.querySelectorAll("input[name=theme][type=radio]");

	function updateThemeFromOptions() {
		// for some reason, safari wants this here                      ^
		// it throws a fit otherwise, even though it's defined up there |
		let themeOptions = document.querySelectorAll("input[name=theme][type=radio]");
		let newTheme;
		for(let themeOption of themeOptions) {
			if(themeOption.checked) {
				newTheme = themeOption.value;
			}
		}
		console.log("Changing theme to " + newTheme);
		if(newTheme != currentTheme) {
			setTheme(newTheme);
		}
	}

	for(let themeOption of themeOptions) {
		themeOption.checked = themeOption.value == currentTheme;
		themeOption.addEventListener('click', function() {
			updateThemeFromOptions();
		});
	}
}

{ // style setting options
	function setStyle(newStyle) {
		currentStyle = newStyle;
		render();
	}

	setStyle("colourful");

	let styleOptions = document.querySelectorAll("input[name=style][type=radio]");

	function updateStyleFromOptions() {
		// for some reason, safari wants this here                      ^
		// it throws a fit otherwise, even though it's defined up there |
		let styleOptions = document.querySelectorAll("input[name=style][type=radio]");
		let newStyle;
		for(let styleOption of styleOptions) {
			if(styleOption.checked) {
				newStyle = styleOption.value;
			}
		}
		console.log("Changing style to " + newStyle);
		if(newStyle != currentStyle) {
			setStyle(newStyle);
		}
	}

	for(let styleOption of styleOptions) {
		styleOption.checked = styleOption.value == currentStyle;
		styleOption.addEventListener('click', function() {
			updateStyleFromOptions();
		});
	}
}

{
	function updateCanvasSize() {
		let dpi = window.devicePixelRatio;
		previewCanvasContext.canvas.width = previewCanvasContext.canvas.clientWidth * dpi;
		previewCanvasContext.canvas.height = previewCanvasContext.canvas.clientHeight * dpi;

		render();
	}

	updateCanvasSize();

	window.addEventListener('resize', updateCanvasSize);
}

loadIconSetImage();