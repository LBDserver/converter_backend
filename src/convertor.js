const { extractFormData, executeChildProcess, deleteFile } = require('./helper')
const fs = require('fs')
const conversionOrder = require('./conversionOrder.json')

exports.saveToFile = async (req, res, next) => {
    return extractFormData(req)
        .then((data) => {
            return fs.writeFile('./base-files/_placeholderIFC.ifc', data.ifcFile, (err) => {
                if (err) throw err;
                if (data.baseUri) {
                    req.baseUri = data.baseUri
                } else {
                    req.baseUri = ''
                }
                next()
            })
        })
        .catch((error) => { return res.status(500).json({ error: "Unable to parse the formData." }) })
}

exports.convertTo = async (req, res, next) => {
    let conversionType = req.originalUrl.substring(1)
    conversionType = conversionType.toLowerCase()
    let modes = conversionOrder[conversionType]
    let order = []
    modes.forEach((mode) => {
        const { command, fileNameConversion } = switcher(mode, req.baseUri)
        order.push({ command, fileNameConversion, mode })
    })

    let IfcPlaceholder = process.cwd() + '/base-files/' + '_placeholderIFC.ifc'
    let createdFiles = [IfcPlaceholder]

    // this returns the value, while for in returns index???
    // order.forEach(b => console.log('b', b))

    // weird, returns index instead of value... (async forEach does not work...) 
    for (const conversion in order) {
        try {
            console.log('converting to', order[conversion]["mode"].substring(5))
            const myResult = await executeChildProcess(order[conversion]["command"])
            const placeholder = process.cwd() + '/base-files/' + order[conversion]["fileNameConversion"]
            createdFiles.push(placeholder)
        } catch (error) {
            next(error)
        }
    }

    return res.sendFile(createdFiles[createdFiles.length - 1], () => {
        // remove the createdFiles
        createdFiles.forEach(file => {
            try {
                deleteFile(file)
            } catch (error) {
                console.log(error)
            }
        })
    })
}

// this could be coded in a more concise way... Maybe also via JSON per conversion type?
const switcher = (originalUrl, baseURI) => {
    let converter, placeholder, fileNameConversion, c
    placeholder = process.cwd() + '/base-files/_placeholderIFC.ifc'
    switch (originalUrl) {
        case 'IFCtoOWL':
            prefix = 'java -jar'
            c = '/cli/IFCtoRDF/IFCtoRDF-0.4-SNAPSHOT.jar'
            fileNameConversion = '_placeholderOWL.owl'
            baseFile = '/base-files/_placeholderIFC.ifc'
            baseURI = ''
            break;
        case 'IFCtoLBD':
            prefix = 'java -jar'
            c = '/cli/IFCtoLBD/IFCtoLBD.jar'
            fileNameConversion = '_placeholderLBD.ttl'
            baseFile = '/base-files/_placeholderIFC.ifc'
            break;
        case 'IFCtoDAE':
            prefix = ''
            c = '/cli/IfcConvert'
            fileNameConversion = '_placeholderDAE.dae'
            baseFile = '/base-files/_placeholderIFC.ifc'
            baseURI = '--use-element-guids'
            break;
        case 'IFCtoGLTF':
            prefix = ''
            c = '/cli/COLLADA2GLTF_linux/COLLADA2GLTF-bin'
            fileNameConversion = '_placeholderGLTF.gltf'
            baseFile = '/base-files/_placeholderDAE.dae'
            baseURI = ''
            break;
        case 'IFCtoXML':
            prefix = ''
            c = '/cli/IfcConvert'
            fileNameConversion = '_placeholderXML.xml'
            baseFile = '/base-files/_placeholderIFC.ifc'
            baseURI = ''
            break;
        default:
            break;
    }

    converter = process.cwd() + c
    placeholder = process.cwd() + baseFile

    const command = prefix + ' ' + converter + ' ' + placeholder + ' ' + baseURI + ' ' + process.cwd() + '/base-files/' + fileNameConversion
    console.log(command)
    return { command, fileNameConversion }
}

