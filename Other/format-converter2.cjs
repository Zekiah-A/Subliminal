// This script attempts to update all poem JSONs from the old, HTML-based format to the new format
const fs = require("fs")
const path = require("path")

const poemPaths = [
    "../Volume-1/Parodies-And-Adaptations",
    "../Volume-1/Really-Stupid-Stuff",
    "../Volume-1/War-And-Phrenics",
    "../Volume-2/Idiots",
    "../Volume-2/Sublime-And-Revelation",
    "../Volume-2/Tales-And-Tomes",
    "./"
]

function escapeString(str) {
    return str.replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\f/g, '\\f')
        .replace(/"/g, '\\"');
}

function convertPoemContent(oldPoemContent) {
    const lines = oldPoemContent.split("\uE001")
    const newPoemContent = `{"type":"fragment","styles":[],"children":[${lines
        .map(
            (line) =>
            `${line.trim() ? `{"type":"text","content":"${escapeString(line)}"},` : ''}{"type":"newline","count":1}`
        )
        .join(',')}]}`

    return JSON.parse(newPoemContent)
}  

for (let poemPath of poemPaths) {
    const directory = fs.opendirSync(poemPath)

    let file = null
    while ((file = directory.readSync()) !== null) {
        if (!file.name.endsWith(".json")) {
            continue
        }
        let poemData = JSON.parse(fs.readFileSync(path.join(poemPath, file.name)))
        if (typeof poemData.poemContent === "object") {
            let contentString = JSON.stringify(poemData.poemContent)
            // Dumb optimisations, should catch most cases
            contentString = contentString.replaceAll(
                `{"type":"newline","count":1},{"type":"newline","count":1}`,
                `{"type":"newline","count":2}`)
            contentString = contentString.replaceAll(
                `{"type":"newline","count":2},{"type":"newline","count":1}`,
                `{"type":"newline","count":3}`)
            contentString = contentString.replaceAll(
                    `{"type":"newline","count":2},{"type":"newline","count":2}`,
                    `{"type":"newline","count":4}`)
            poemData.poemContent = JSON.parse(contentString)

            console.log("🟨 Poem", file.name, "already converted, now prettified and optimised")
            fs.writeFileSync(path.join(poemPath, file.name), JSON.stringify(poemData, null, 4))
            continue
        }
        poemData.poemContent = convertPoemContent(poemData.poemContent)

        console.log("✅ Completed poem", file.name)
        fs.writeFileSync(path.join(poemPath, file.name), JSON.stringify(poemData))
    }

    directory.closeSync()
}
console.log("All poems sucessfully updated!")
