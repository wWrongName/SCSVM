let TDetector = function (info, AST) {
    if (!info) {
        console.debug(`Can't init detector. Constructor arg 'info' is missing`)
        return
    }

    const requiredProps = ["swc", "name", "description"]
    let _info = {}
    let _AST = AST

    if (!info.swc || !Number.isInteger(info.swc)) {
        console.debug(`Can't init detector. The 'swc' property is missing`)
        return null
    }
    for (let prop of requiredProps) {
        if (!info[prop])
            console.warn(`The '${prop}' property is missing`)
        else
            _info[prop] = info[prop]
    }

    this.getInfo = () => {
        return `Detector info:\n\tName: ${_info.name} detector\n\tSWC: ${_info.swc}\n\tDescription: ${_info.description}`
    }
}

module.exports = TDetector