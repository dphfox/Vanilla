function showModalDialog(dialogId) {
	let dialogs = document.querySelectorAll("dialog");
	for(let dialog of dialogs) {
		dialog.open = dialog.id == dialogId;
	}
}