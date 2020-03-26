const express = require('express')
const https = require('https')
const fs = require('fs')
const bodyParser = require('body-parser')

const {
    saveToFile,
    convertTo
} = require('./convertor')

const privateKey = fs.readFileSync(process.cwd() + '/config/mkcert-key.key', 'utf8')
const certificate = fs.readFileSync(process.cwd() + '/config/mkcert-cert.crt', 'utf8')
const credentials = {key: privateKey, cert: certificate}

const app = express()
const port = process.env.PORT
app.use(bodyParser.json())

app.post('/IFCtoOWL', saveToFile, convertTo)
app.post('/IFCtoLBD', saveToFile, convertTo)
app.post('/IFCtoDAE', saveToFile, convertTo)
app.post('/IFCtoGLTF', saveToFile, convertTo)
app.post('/IFCtoXML', saveToFile, convertTo)

const httpsServer = https.createServer(credentials, app)

httpsServer.listen(4800, () => {
    console.log('HTTPS server is up on port '+ 4800)
})