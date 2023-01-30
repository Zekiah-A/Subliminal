// Neural network poem process worker
importScripts("https://unpkg.com/brain.js")

self.addEventListener('message', (event) => {
    const network = new brain.recurrent.LSTM()

    network.train([event.data], {
        log: (error) => console.log(error),
        iterations: 2000
    })    

    self.postMessage(JSON.stringify(network.toJSON()))
})