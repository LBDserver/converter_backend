const express = require('express')
// const https = require('https')
const fs = require('fs')
const bodyParser = require('body-parser')
const compression = require('compression')
const helmet = require('helmet')
const multer = require('multer')
const path = require('path')

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
    convertTo,
    convertMultiple
} = require('./convertor')

// const privateKey = fs.readFileSync(process.cwd() + '/config/mkcert-key.key', 'utf8')
// const certificate = fs.readFileSync(process.cwd() + '/config/mkcert-cert.crt', 'utf8')
// const credentials = {key: privateKey, cert: certificate}

const app = express()
app.use(bodyParser.json())
// app.use(compression())
// app.use(helmet())

app.get('/test', (req, res) => {
    return res.send('it works!')
})
// app.post('/IFCtoOWL', upload.single('ifcFile'), convertTo)
// app.post('/IFCtoLBD', upload.single('ifcFile'), convertTo)
// app.post('/IFCtoDAE', upload.single('ifcFile'), convertTo)
// app.post('/IFCtoGLTF', upload.single('ifcFile'), convertTo)

app.post('/convert', upload.single('ifcFile'), convertMultiple)


// const httpsServer = https.createServer(credentials, app)

// httpsServer.listen(4800, () => {
//     console.log('HTTPS server is up on port '+ 4800)
// })

app.listen(4800, () => {
    console.log('HTTP server is up on port ' + 4800)
})