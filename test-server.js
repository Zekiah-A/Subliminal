import express from 'express'
import { red, green } from 'ansis/colors'
import * as fs from 'fs'
import path from 'path'
import * as url from 'url'

const app = express()
const port = 3000
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

app.get("*", (req, res) => {    
    let resourcePath = req.path

    if (!resourcePath || resourcePath == "/") {
        // They likely want index.html
        resourcePath = "index.html"
    }
    if (!fs.existsSync(path.join(__dirname, resourcePath))) {
        // Likely an extensionless HTML.
        resourcePath = resourcePath + ".html"
    }
    if (!fs.existsSync(path.join(__dirname, resourcePath))) {
        // Then either this content literally does not exist, or it is intentionally wrong
        // to trigger a redirect from the 404 page. 
        resourcePath = "404.html"
    }

    res.sendFile(path.join(__dirname, resourcePath))
})

app.listen(port, () => {
  console.log(`Development test server listening on port ${green`${port}`}. ${red`Please do not use this in production!`}`)
})