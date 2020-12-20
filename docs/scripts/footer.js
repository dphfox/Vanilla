let footer = document.querySelector('footer')

let quips = [
	"now with extra sugar!",
	"best served with milk!",
	"one of your five a day!",
	"loved by cursors worldwide!",
	"now with 300% less fam!",
	"freshly squeezed!",
	"high in vitamin B!",
	"not material design!",
	"ironically it's a mod!",
	"52.7% less friction!",
	"better than rojo!",
	"made with <3!",
	"britain's finest icons!",
	"batteries probably included!",
	"for roblox nerds everywhere!"
]

let quip = quips[Math.floor(Math.random() * quips.length)]
let thisYear = new Date().getFullYear()

footer.innerText += " " + thisYear + " (" + quip + ")"
