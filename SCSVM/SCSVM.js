const Reentrancy = require("./detectors/Reentrancy")


class SCSVM {
    constructor (AST) {
        this.detectors = [new Reentrancy(AST)]
    }

    prerequisites () {
        return {success : true}
    }

    analyse (swc=[]) {
        if (typeof swc === "number")
            swc = [swc]
        this.detectors.forEach(detector => {
            if (!swc.length || (swc.length && swc.indexOf(detector.swc)))
                detector.analyse()
            else
                console.silly(`Skip detector: ${detector.name}, swc: ${detector.swc}`)
        })
    }
}

module.exports = SCSVM