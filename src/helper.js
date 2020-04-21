const Busboy = require('busboy')
const _ = require('lodash')
const cp = require('child_process')
const fs = require('fs');

exports.extractFormData = async (req) => {
    return new Promise(async (resolve, reject) => {
        var busboy = new Busboy({ headers: req.headers });
        let documentData = {}

        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            console.log("getting file")
            let buff = ''
            file.on('data', (data) => {
                buff += data
            });
            file.on('end', () => {
                console.log({buff})
                documentData[fieldname] = buff
            })
        });

        busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            documentData[fieldname] = val
        });

        busboy.on('finish', function () {
            if (_.isEmpty(documentData)) {
                reject("Was not able to parse the FormData correctly")
            } else {
                resolve(documentData)
            }
        });

        req.pipe(busboy);
    })
}

exports.executeChildProcess = (cmd_exec) => {
    return new Promise((resolve, reject) => {
        let child = cp.exec(cmd_exec, { maxBuffer: 1024 * 1024 * 50 })
        child.on('exit', function (exit_code) {
            if (exit_code === 0) {
                resolve(exit_code)
            } else {
                reject(exit_code)
            }
        });
    })
}

exports.deleteFile = (path) => {
    try {
        fs.unlinkSync(path)
        console.log(path + ' was deleted successfully')
    } catch (err) {
        console.error(err)
    }
}