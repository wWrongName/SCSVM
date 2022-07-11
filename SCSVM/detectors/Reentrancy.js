const TDetector = require("./TDetector")

const { reentrancy } = require("./detectors.json")


class Reentrancy extends TDetector {
    constructor (AST) {
        super(reentrancy, AST)
        require("fs").writeFileSync("tmp.json", JSON.stringify(AST, null, "    "))
    }

    analyse () {
    }
}

module.exports = Reentrancy
