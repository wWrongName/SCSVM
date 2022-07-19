const TDetector = require("./TDetector")
const traverseObject = require("../utils/traverseObject")
const _ = require("lodash")

const { reentrancy } = require("./detectors.json")


class Reentrancy extends TDetector {
    constructor (AST) {
        super(reentrancy, AST)
    }

    analyse (entryFile) {
        this.setAST(entryFile)
        let contractIds = this.getAST().contracts

        contractIds.forEach(contractId => {
            let contract = this.getContract(contractId)
            let nextFunction = this.getNextFunction(contract)
            while (nextFunction) {
                this.embedFunctions(nextFunction)
                this.detect(nextFunction)
                nextFunction = this.getNextFunction(contract)
            }
        })
    }

    embedFunctions (functionAST, contract) {
        let functionCall = this.getNextFunctionCall(functionAST), embeddedAST
        while (functionCall) {
            let body = _.cloneDeep(this.getFunctionByName(contract, functionCall.name).body)
            functionCall.embeddedAST = body
            this.embedFunctions(body, contract)
            functionCall = this.getNextFunctionCall(functionAST)
        }
        return functionAST
    }

    getNextFunctionCall (functionTree) {
        return this.treeSearch(functionTree, (partOfAST) => {
            return partOfAST.nodeType === "FunctionCall" &&
                   partOfAST.kind === "functionCall" &&
                   partOfAST.checkedCall !== true
        }, undefined, (partOfAST) => {
            partOfAST.checkedCall = true
        })
    }

    getFunctionByName (contract, name) {
        return this.treeSearch(contract, (partOfAST) => {
            return partOfAST.nodeType === "FunctionDefinition" &&
                   partOfAST.kind === "function" &&
                   partOfAST.name === name
        })
    }

    getNextFunction (contract) {
        return this.treeSearch(contract, (partOfAST) => {
            return partOfAST.nodeType === "FunctionDefinition" &&
                   partOfAST.kind === "function" &&
                   partOfAST.checkedFunction !== true &&
                   (partOfAST.visibility === "public" || partOfAST.visibility === "external")
        }, undefined, (partOfAST) => {
            partOfAST.checkedFunction = true
        })
    }

    getStateModifications (functionTree) {
        let assignments = []
        return this.treeSearch(functionTree, (partOfAST) => {
            return partOfAST.nodeType === "VariableDeclaration" &&
                   partOfAST.stateVariable === true
        }, assignments)
    }

    getExternalCallUsages () {}

    detect (functionTree) {

    }
}

module.exports = Reentrancy
