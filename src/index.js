const express = require('express')
// const https = require('https')
const fs = require('fs')
const bodyParser = require('body-parser')
const compression = require('compression')
const helmet = require('helmet')
const multer = require('multer')
const path = require('path')
const cors = require('cors')

const storage = multer.diskStorage({
    destination: function (req, file, next) {
        next(null, 'base-files');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.ifc');
    }
})

const upload = multer({
    storage: storage
});


const {
    convertMultiple,
    convertOne
} = require('./convertor')

// const privateKey = fs.readFileSync(process.cwd() + '/config/mkcert-key.key', 'utf8')
// const certificate = fs.readFileSync(process.cwd() + '/config/mkcert-cert.crt', 'utf8')
// const credentials = {key: privateKey, cert: certificate}

const app = express()
app.use(bodyParser.json())
app.use(compression())
app.use(helmet())
app.use(cors())

app.get('/test', (req, res) => {
    return res.send('it works!')
})
app.post('/ifcowl', upload.single('ifcFile'), convertOne)
app.post('/lbd', upload.single('ifcFile'), convertOne)
app.post('/dae', upload.single('ifcFile'), convertOne)
app.post('/gltf', upload.single('ifcFile'), convertOne)

app.post('/convert', upload.single('ifcFile'), convertMultiple)


// const httpsServer = https.createServer(credentials, app)

// httpsServer.listen(4800, () => {
//     console.log('HTTPS server is up on port '+ 4800)
// })

app.listen(4800, () => {
    console.log('process.platform', process.platform)
    console.log('HTTP server is up on port ' + 4800)
})
