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
    let _contract = {
        body : {},
        state : {}
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

    let _getContractState = () => {
        let state = _traverseNodes(_contract.body, (partOfAST) => {
            if (typeof partOfAST === "object") {
                let condition = partOfAST.nodeType === "VariableDeclaration" &&
                                partOfAST.stateVariable === true
                if (condition)
                    return partOfAST
            }
        })
        return !state ? {} : state
    }

    let _getContractTree = (id) => {
        let contract = _traverseNodes(_AST.body, (partOfAST) => {
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

    let _getInstantObj = () => {
        let res = _bodyPtrs.reduce((prev, cur, index) => {
            return index === 0 ? prev : prev[cur]
        }, _bodyPtrs[0])
        return res === [] ? null : res
    }

    let _getInstantIndex = () => _indexes[_indexes.length - 1]

    let _updIndex = (newIndex) => {
        _indexes[_indexes.length - 1] = newIndex
    }

    let _ptrsPush = (bodyPtr, index) => {
        _bodyPtrs.push(bodyPtr)
        _indexes.push(index)
    }

    let _ptrsPop = () => {
        _bodyPtrs.pop()
        _indexes.pop()
    }

    let _handleConditions = (key, index, len, handler) => {
        _ptrsPush(key, 0)
        let el = _getInstantObj()
        let res = handler(el)
        if (res !== undefined)
            return res
        if (typeof el === "object")
            return // save _bodyPtrs (go into object)

        if (typeof el !== "object" && index !== len - 1) {
            _ptrsPop()
            _updIndex(_getInstantIndex() + 1)
            return // delete 1 ptr (save object location)
        }
        if (typeof el !== "object" && index === len - 1) {
            _ptrsPop()
            _ptrsPop()
            _updIndex(_getInstantIndex() + 1)
            // delete 2 ptrs (exit from traversed object)
        }
    }

    let _bodyPtrs = []
    let _indexes = []

    let _clearTraversePtrs = () => {
        _bodyPtrs = []
        _indexes = []
    }

    let _traverseNodes = (body, handler) => {
        if (typeof body !== "object")
            return
        _ptrsPush(body, 0)

        let instantObj = _getInstantObj()
        let keys = Object.keys(instantObj)
        let i = _getInstantIndex()
        while (instantObj) {
            let res = _handleConditions(keys[i], i, keys.length, handler)
            if (res !== undefined) {
                _clearTraversePtrs()
                return res
            }
            i = _getInstantIndex()
            instantObj = _getInstantObj()
            keys = Object.keys(instantObj)
            while (i === keys.length) {
                _ptrsPop() // delete 1 ptr (exit from traversed object)
                i = _getInstantIndex()
                if (i === undefined) {
                    _clearTraversePtrs()
                    return
                }
                _updIndex(++i)
                instantObj = _getInstantObj()
                keys = Object.keys(instantObj)
            }
        }
        _clearTraversePtrs()
    }

    /* ================================================================== */

    this.getAST = () => _AST
    this.getContract = () => _contract

    this.getInfo = () => {
        let name = `Detector info:\n\tName: ${_info.name} detector\n`
        let swc = `\tSWC: ${_info.swc}\n`
        let description = `\tDescription: ${_info.description}`
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

    this.setContract = (id) => {
        _contract.body = _getContractTree(id)
        _contract.state = _getContractState()
    }
}

module.exports = TDetector