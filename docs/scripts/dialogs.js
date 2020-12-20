function showModalDialog(dialogId) {
	let dialogs = document.querySelectorAll(".dialog");
	for(let dialog of dialogs) {
		if(dialog.id == dialogId) {
			dialog.classList.add("open");
		} else {
			dialog.classList.remove("open");
		}
	}
}