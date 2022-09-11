let traverseObject = require("../utils/traverseObject")
let _ = require("lodash")


let TDetector = function (info, ASTs) {

    /* ================================================================== */
    const requiredProps = ["swc", "name", "description"]
    let _info = {}
    let _ASTs = ASTs
    let _AST = {
        body : {},
        contracts : []
    }

    if (!info) {
        console.debug(`Can't init detector. Constructor arg 'info' is missing`)
        return
    }
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
    /* ================================================================== */

    let _collectContractState = (contract, accumulator) => {
        let state = traverseObject(contract, (partOfAST) => {
            if (typeof partOfAST === "object") {
                let condition = partOfAST.nodeType === "VariableDeclaration" &&
                                partOfAST.stateVariable === true
                if (condition) {
                    return partOfAST
                }
            }
        }, accumulator)
        if (Array.isArray(accumulator) && accumulator.length)
            return accumulator
        else
            return !state ? {} : state
    }

    let _getContractTree = (id) => {
        let contract = traverseObject(_AST.body, (partOfAST) => {
            if (typeof partOfAST === "object") {
                let condition = partOfAST.nodeType === "ContractDefinition" &&
                                partOfAST.contractKind === "contract" &&
                                partOfAST.id === id
                if (condition)
                    return partOfAST
            }
        })
        return !contract ? {} : contract
    }

    let _getContracts = () => {
        if (_AST.body.exportedSymbols === undefined) {
            console.warn(`Lack of contracts in the ${_AST.absolutePath}`)
            _AST.body.exportedSymbols = {}
            return _AST.body.exportedSymbols
        }
        let resObj = _.cloneDeep(_AST.body.exportedSymbols)
        return Object.keys(_AST.body.exportedSymbols).map(contract => {
            return resObj[contract][0]
        })
    }

    /* ================================================================== */

    this.getAST = () => _AST

    this.getInfo = () => {
        let name = `Detector info:\n\tName: ${_info.name} detector\n`
        let swc = `\tSWC: ${_info.swc}\n`
        let description = `\tDescription: ${_info.description}`
        // get data from 
        return name + swc + description
    }

    this.setAST = (file) => {
        let files = Object.keys(_ASTs)
        if (files.indexOf(file) === -1) {
            console.warn(`AST of ${file} was not found`)
            return
        }
        _AST.body = _ASTs[file]
        _AST.contracts = _getContracts()
    }

    this.getContract = (id) => {
        let body = _getContractTree(id)
        let state = []
        // _collectContractState(body, state)
        return {
            body : body,
            state : state
        }
    }

    this.treeSearch = (body, condition, accumulator, additions) => {
        let res = traverseObject(body, (partOfAST) => {
            if (typeof partOfAST === "object") {
                if (condition(partOfAST)) {
                    additions(partOfAST)
                    return partOfAST
                }
            }
        }, accumulator)
        return !res ? {} : res
    }

    this.collectData = (data) => {
        if (!_info.detectors)
            _info.detectors = {}
        if (!_info.detectors[_info.swc])
            _info.detectors[_info.swc] = []
        _info.detectors[_info.swc].push(data)
    }
}

module.exports = TDetector