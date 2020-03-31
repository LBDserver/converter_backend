const { extractFormData, executeChildProcess, deleteFile } = require('./helper')
const fs = require('fs')
const conversionOrder = require('./conversionOrder.json')

exports.convertTo = async (req, res, next) => {
    let conversionType = req.originalUrl.substring(1)
    conversionType = conversionType.toLowerCase()
    let modes = conversionOrder[conversionType]

    let order = []

    modes.forEach((mode) => {
        const {command, fileExtension} = switcher(mode, req.baseUri, req.file.path)
        order.push({ command, mode, fileExtension })
    })

    let IfcPlaceholder = `${process.cwd()}/${req.file.path}`
    let createdFiles = [IfcPlaceholder]

    for (const conversion of order) {
        try {
            console.log('converting to', conversion.mode.substring(5))
            const perform = await executeChildProcess(conversion.command)
            const placeholder = `${process.cwd()}/${req.file.path}.${conversion.fileExtension}`
            createdFiles.push(placeholder)
        } catch (error) {
            next(error)
        }
    }

    return res.sendFile(createdFiles[createdFiles.length - 1], () => {
        createdFiles.forEach(file => {
            try {
                deleteFile(file)
            } catch (error) {
                console.log(error)
            }
        })
    })
}

const switcher = (originalUrl, baseUri, base) => {
    baseUri = 'http://www.lbdserver.com/igent/'
    let command, fileExtension
    switch (originalUrl) {
        case 'IFCtoOWL':
            command = `java -jar ${process.cwd()}/cli/IFCtoRDF/IFCtoRDF-0.4-SNAPSHOT.jar ${process.cwd()}/${base} ${process.cwd()}/${base}.ttl`
            fileExtension = 'ttl'
            break;
        case 'IFCtoLBD':
            command = `java -jar ${process.cwd()}/cli/IFCtoLBD/IFCtoLBD.jar ${process.cwd()}/${base} ${baseUri} ${process.cwd()}/${base}.ttl`
            fileExtension = 'ttl'
            break;
        case 'IFCtoDAE':
            command = `${process.cwd()}/cli/IfcConvert ${process.cwd()}/${base} --use-element-guids ${process.cwd()}/${base}.dae`
            fileExtension = 'dae'
            break;
        case 'IFCtoGLTF':
            command = `${process.cwd()}/cli//COLLADA2GLTF_linux/COLLADA2GLTF-bin ${process.cwd()}/${base}.dae ${process.cwd()}/${base}.gltf`
            fileExtension = 'gltf'
            break;
        default:
            break;
    }

    return {command, fileExtension}
}

