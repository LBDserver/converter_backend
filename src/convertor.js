const { extractFormData, executeChildProcess, deleteFile } = require('./helper')
const fs = require('fs')
const conversionOrder = require('./conversionOrder.json')
const zip = require('express-zip')

// exports.convertTo = async (req, res, next) => {
//     let conversionType = req.originalUrl.substring(1)
//     conversionType = conversionType.toLowerCase()
//     const modes = conversionOrder[conversionType]

//     let order = []

//     modes.forEach((mode) => {
//         const { command, fileExtension } = switcher(mode, req.baseUri, req.file.path)
//         order.push({ command, mode, fileExtension })
//     })

//     let IfcPlaceholder = `${process.cwd()}/${req.file.path}`
//     let createdFiles = [IfcPlaceholder]

//     for (const conversion of order) {
//         try {
//             console.log('converting to', conversion.mode.substring(5))
//             const perform = await executeChildProcess(conversion.command)
//             const placeholder = `${process.cwd()}/${req.file.path}.${conversion.fileExtension}`
//             createdFiles.push(placeholder)
//         } catch (error) {
//             next(error)
//         }
//     }

//     return res.sendFile(createdFiles[createdFiles.length - 1], () => {
//         createdFiles.forEach(file => {
//             try {
//                 deleteFile(file)
//             } catch (error) {
//                 console.log(error)
//             }
//         })
//     })
// }

convert = async (file, conversionType, baseUri) => {
    return new Promise (async (resolve, reject) => {
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

exports.convertMultiple = async (req, res, next) => {
    const filepath = req.file.path
    let conversions = JSON.parse(req.body.conversions)
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
        let final = []
        let included = []
        parts.forEach(p => {
            p.forEach(c => {
                if (!included.includes(c)) {
                    let name = c.split('/')[c.split('/').length - 1]
                    final.push({ path: c, name })
                    included.push(c)
                }
            })
        })
        res.zip(final)
    } catch (error) {
        // console.log('error', error)
        next(error)
    }
}

const switcher = (originalUrl, baseUri, base) => {
    let command, fileExtension
    switch (originalUrl) {
        case 'IFCtoOWL':
            command = `java -jar ${process.cwd()}/cli/IFCtoRDF/IFCtoRDF-0.4-SNAPSHOT.jar ${process.cwd()}/${base} ${process.cwd()}/${base}.ttl`
            fileExtension = 'ttl'
            break;
        case 'IFCtoLBD':
            command = `java -jar ${process.cwd()}/cli/IFCtoLBD/IFCtoLBD.jar ${process.cwd()}/${base} ${baseUri} ${process.cwd()}/${base}.lbd.ttl`
            fileExtension = 'lbd.ttl'
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

    return { command, fileExtension }
}

