// This script attempts to update all poem JSONs from the old, HTML-based format to the new format
const fs = require("fs")
const path = require("path")

const poemPaths = [
	"../volume-1/parodies-and-adaptations",
	"../volume-1/really-stupid-stuff",
	"../volume-1/war-and-phrenics",
	"../volume-2/idiots",
	"../volume-2/sublime-and-revelation",
	"../volume-2/tales-and-tomes"
]

for (let poemPath of poemPaths) {
	const directory = fs.opendirSync(poemPath)

	let file = null
	while ((file = directory.readSync()) !== null) {
		let poemData = JSON.parse(fs.readFileSync(path.join(poemPath, file.name)))
		poemData.poemContent = poemData.poemContent
			.replaceAll("<b>", '\uE000\uE004\uE000')
			.replaceAll("<strong>", '\uE000\uE004\uE000')
			.replaceAll("<em>", '\uE000\uE005\uE000')
			.replaceAll("<i>", '\uE000\uE005\uE000')
			.replaceAll("<code>", '\uE000\uE006\uE000')
			.replaceAll("<sup>", '\uE000\uE007\uE000')
			.replaceAll("<sub>", '\uE000\uE008\uE000')
			.replaceAll("<br>", '\uE001')
			.replaceAll("\n", "")
			.replaceAll(/(&nbsp;|<([^/>]+)>)/ig, "") // Remove all other HTML
			.replaceAll(/(&nbsp;|<(\/[^>]+)>)/ig, '\uE002') // Replace all HTMl closes

		console.log("✅ Completed poem " + file.name)
		fs.writeFileSync(path.join(poemPath, file.name), JSON.stringify(poemData))
	}

	directory.closeSync()
}
console.log("All poems sucessfully updated!")
