import express from 'express'
import { red, green } from 'ansis/colors'
import * as fs from 'fs'
import path from 'path'
import * as url from 'url'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import * as https from "node:https"

const argv = yargs(hideBin(process.argv))
    .option("cert", {
        describe: "Path to SSL certificate file",
        type: "string",
    })
    .option('key', {
        describe: "Path to SSL private key file",
        type: "string",
    })
    .help()
    .alias("help", "h")
    .argv

const app = express()
const port = 3000
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

app.get("*", (req, res) => {
    let resourcePath = req.path;

    if (!resourcePath || resourcePath == "/") {
        resourcePath = "index.html";
    }
    if (!fs.existsSync(path.join(__dirname, resourcePath))) {
        resourcePath = req.path + ".html";
    }
    if (!fs.existsSync(path.join(__dirname, resourcePath))) {
        resourcePath = "404.html";
    }

    res.sendFile(path.join(__dirname, resourcePath));
})

if (argv.cert && argv.key) {
    const server = https.createServer({
        key: fs.readFileSync(argv.key),
        cert: fs.readFileSync(argv.cert)
    }, app)

    server.listen(port, () => {
        console.log(`Development test server listening on port ${green`${port}`} over HTTPS. ${red`Please do not use this in production!`}`);
    })
}
else {
    // Otherwise, start the server with HTTP
    app.listen(port, () => {
        console.log(`Development test server listening on port ${green`${port}`} over HTTP. ${red`Please do not use this in production!`}`);
    })
}