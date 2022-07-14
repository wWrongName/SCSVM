const Reentrancy = require("./detectors/Reentrancy")


class SCSVM {
    constructor (AST) {
        let initEntryFile = () => {
            let keys = Object.keys(AST)
            if (keys)
                return keys[0]
            else
                console.warn(`Can't find entry point in AST`)
        }

        this.entryFile = initEntryFile()
        this.detectors = [
            new Reentrancy(AST),
        ]
    }

    prerequisites () {
        return {success : true}
    }

    analyse (swc=[]) {
        if (typeof swc === "number")
            swc = [swc]
        this.detectors.forEach(detector => {
            if (!swc.length || (swc.length && swc.indexOf(detector.swc)))
                detector.analyse(this.entryFile)
            else
                console.silly(`Skip detector: ${detector.name}, swc: ${detector.swc}`)
        })
    }
}

module.exports = SCSVM