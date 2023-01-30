const brain = require('brain.js')
const stdin = process.openStdin()
const fs = require("fs")

let network = new brain.recurrent.LSTM()

// Load the trained network data from JSON file.
const networkState = JSON.parse(fs.readFileSync("state.json", "utf-8"))
network = network.fromJSON(networkState)

console.log("Model loaded, enter text to evaluate:")
process.stdout.write(">> ")

stdin.addListener("data", function(input) {
    let text = input.toString().trim()
    console.log(network.run(text))
    process.stdout.write(">> ")
})