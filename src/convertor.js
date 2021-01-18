const { extractFormData, executeChildProcess, deleteFile } = require('./helper')
const fs = require('fs')
const conversionOrder = require('./conversionOrder.json')
const zip = require('express-zip')
var FormData = require('form-data');
const { format } = require('url');

convert = async (file, conversionType, baseUri) => {
    return new Promise(async (resolve, reject) => {
        const modes = conversionOrder[conversionType.toLowerCase()]
        let order = []

        modes.forEach((mode) => {
            const { command, fileExtension } = switcher(mode, baseUri, file)
            order.push({ command, mode, fileExtension })
        })

        let IfcPlaceholder = `${process.cwd()}/${file}`
        let createdFiles = [IfcPlaceholder]


        try {
            for (const conversion of order) {
                console.log('converting to', conversion.mode.substring(5))
                console.log('conversion', conversion)
                const perform = await executeChildProcess(conversion.command)
                console.log(conversion.mode.substring(5), 'done')
                const placeholder = `${process.cwd()}/${file}.${conversion.fileExtension}`
                createdFiles.push(placeholder)
            }
        } catch (error) {
            reject(error)
        }

        resolve(createdFiles)
    })
}

exports.convertOne = async (req, res, next) => {
    const filepath = req.file.path
    const baseUri = req.body.base
    const type = req.originalUrl.substring(1)
    let result = await convert(filepath, type, baseUri)

    const resultLocation = result[result.length - 1]
    fs.readFile(resultLocation, (err, data) => {
        if (err) {
          throw err;
        }
        // const form = new FormData();
        // form.append('file', data);
        res.status(200).send(data)
        result.forEach(f => deleteFile(f))
        
      });



    // try {
    //     let parts = await convert(filepath, conversion, baseUri)
    //     console.log('parts', parts)
    //     let included = []
    //     let final = []
    //     parts.forEach(p => {
    //         p.forEach(c => {
    //             if (!included.includes(c)) {
    //                 let name = c.split('/')[c.split('/').length - 1]
    //                 final.push({ path: c, name })
    //                 included.push(c)
    //             }
    //         })
    //     })

    //     res.zip(final, () => {
    //         included.forEach(file => {
    //             deleteFile(file)
    //         })
    //     })
    // } catch (error) {
    //     // console.log('error', error)
    //     next(error)
    // }
}

exports.convertMultiple = async (req, res, next) => {
    const filepath = req.file.path
    let splitconversions, conversions
    if (req.body.conversions[0] === '[') {
        conversions = JSON.parse(req.body.conversions)   
    } else {
        conversions = []
        splitconversions = req.body.conversions.split(',')
        splitconversions.forEach(c => {
            c = c.replace(/"/g, '')
            conversions.push(c)
        })
    }

    let baseUri
    if (req.body.baseUri) {
        baseUri = req.body.baseUri
    }

    // conversion to GLTF already requires conversion to DAE (shouldn't be converted twice)
    if (conversions.includes('DAE') && conversions.includes('GLTF')) {
        conversions = conversions.filter(c => {
            return c !== 'DAE'
        })
    }

    try {
        let parts = await Promise.all(conversions.map(type => convert(filepath, type, baseUri)))
        console.log('parts', parts)
        let included = []
        let final = []
        parts.forEach(p => {
            p.forEach(c => {
                if (!included.includes(c)) {
                    let name = c.split('/')[c.split('/').length - 1]
                    final.push({ path: c, name })
                    included.push(c)
                }
            })
        })

        res.zip(final, () => {
            included.forEach(file => {
                deleteFile(file)
            })
        })
    } catch (error) {
        // console.log('error', error)
        next(error)
    }
}

const switcher = (originalUrl, baseUri, base) => {
    let command, fileExtension
    switch (originalUrl) {
        case 'IFCtoOWL':
            command = `java -jar ${process.cwd()}/cli/IFCtoRDF/IFCtoRDF-0.4-SNAPSHOT.jar --baseURI ${baseUri} ${process.cwd()}/${base} ${process.cwd()}/${base}.ttl`
            fileExtension = 'ttl'
            break;
        case 'IFCtoLBD':
            command = `java -jar ${process.cwd()}/cli/IFCtoLBD/IFCtoLBD.jar ${process.cwd()}/${base} ${baseUri} ${process.cwd()}/${base}.lbd.ttl`
            fileExtension = 'lbd.ttl'
            break;
        case 'IFCtoDAE':
            if (process.platform === "linux") {
                command = `${process.cwd()}/cli/IfcConvert ${process.cwd()}/${base} --use-element-guids ${process.cwd()}/${base}.dae`
            } else if (process.platform === "win32") {
                command = `${process.cwd()}/cli/IfcConvert.exe ${process.cwd()}/${base} --use-element-guids ${process.cwd()}/${base}.dae`
            }
            fileExtension = 'dae'
            break;
        case 'IFCtoGLTF':
            if (process.platform === "linux") {
                command = `${process.cwd()}/cli//COLLADA2GLTF/COLLADA2GLTF-bin ${process.cwd()}/${base}.dae ${process.cwd()}/${base}.gltf`
            } else if (process.platform === "win32") {
                command = `${process.cwd()}/cli//COLLADA2GLTF/COLLADA2GLTF-bin.exe ${process.cwd()}/${base}.dae ${process.cwd()}/${base}.gltf`
            }
            fileExtension = 'gltf'
            break;
        default:
            break;
    }

    return { command, fileExtension }
}

