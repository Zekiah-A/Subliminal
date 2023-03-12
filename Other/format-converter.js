// This script attempts to update all poem JSONs from the old, HTML-based format to the new format
const fs = require("fs")
const path = require("path")

const poemPaths = [
    "../Volume-1/Parodies-And-Adaptations",
    "../Volume-1/Really-Stupid-Stuff",
    "../Volume-1/War-And-Phrenics",
    "../Volume-2/Idiots",
    "../Volume-2/Sublime-And-Revelation",
    "../Volume-2/Tales-And-Tomes"
]

for (let poemPath of poemPaths) {
    const directory = fs.opendirSync(poemPath)

    let file = null
    while ((file = directory.readSync()) !== null) {
        let poemData = JSON.parse(fs.readFileSync(path.join(poemPath, file.name)))
        poemData.poemContent = poemData.poemContent
            .replaceAll("<b>", '\x00\x04\x00')
            .replaceAll("<strong>", '\x00\x04\x00')
            .replaceAll("<em>", '\x00\x05\x00')
            .replaceAll("<i>", '\x00\x05\x00')
            .replaceAll("<code>", '\x00\x06\x00')
            .replaceAll("<sup>", '\x00\x07\x00')
            .replaceAll("<sub>", '\x00\x08\x00')
            .replaceAll("<br>", '\x01')
            .replaceAll("\n", "")
            .replaceAll(/(&nbsp;|<([^/>]+)>)/ig, "") // Remove all other HTML
            .replaceAll(/(&nbsp;|<(\/[^>]+)>)/ig, '\x02') // Replace all HTMl closes

        console.log("✅ Completed poem " + file.name)
        fs.writeFileSync(path.join(poemPath, file.name), JSON.stringify(poemData))
    }

    directory.closeSync()
}
console.log("All poems sucessfully updated!")
