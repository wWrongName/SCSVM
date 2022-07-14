const TDetector = require("./TDetector")

const { reentrancy } = require("./detectors.json")


class Reentrancy extends TDetector {
    constructor (AST) {
        super(reentrancy, AST)
    }

    analyse (entryFile) {
        // this.getInfo()
        this.setAST(entryFile)
        this.setContract(this.getAST().contracts[1])
        console.log(this.getContract())
    }
}

module.exports = Reentrancy
