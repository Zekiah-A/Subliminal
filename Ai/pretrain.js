const brain = require("brain.js")
const path = require("path")
const fs = require("fs")

let trainingData = []

const poemPaths = [
    "../Volume-1/Parodies-And-Adaptations",
    "../Volume-1/Really-Stupid-Stuff",
    "../Volume-1/War-And-Phrenics",
    "../Volume-2/Idiots",
    "../Volume-2/Sublime-And-Revelation",
    "../Volume-2/Tales-And-Tomes"
]

const config = JSON.parse(fs.readFileSync("config.json"))


for (let poemPath of poemPaths) {
    const directory = fs.opendirSync(poemPath)

    let file = null
    while ((file = directory.readSync()) !== null) {
        let poemData = JSON.parse(fs.readFileSync(path.join(poemPath, file.name)))
        let sanitised = poemData.poemContent.replaceAll(/(&nbsp;|<([^>]+)>)/ig, " ")

        if (config.exclude.includes(poemData.poemName)) {
            console.log("Excluding " + poemData.poemName)
            continue
        }

        console.log("Loaded poem " + poemData.poemName)
        trainingData.push(sanitised)
    }

    directory.closeSync()
}

// Format training data into something more manageable by AI
trainingData = trainingData.slice(config.poemStart, config.poemEnd)
/*let finalData = []
for (let poem of trainingData) {
    let lines = poem.split("\n")
    for (let line of lines) {
        finalData.push(line)
    }
}*/

console.log("Starting training...")

const network = new brain.recurrent.LSTM()

network.train(trainingData, {
    log: (error) => console.log(error),
    iterations: config.iterations
})

const networkState = network.toJSON()
fs.writeFileSync("state.json",  JSON.stringify(networkState), "utf-8")

// Training with a dataset of around 30 poems, and 4000
// iterations will take around 3 hours on decent hardware.

// Optimum results ~2K iterations