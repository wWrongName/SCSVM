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
        console.log(this.getContract(contractIds[0]))
        // contractIds.forEach(contractId => {
        //     let contract = this.getContract(contractId)
        //     let nextFunction = this.getNextFunction(contract)
        //     while (nextFunction) {
        //         this.embedFunctions(nextFunction)
        //         this.detect(nextFunction)
        //         nextFunction = this.getNextFunction(contract)
        //     }
        // })
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

    getExternalCalls (functionTree) {
        let extCalls = []
        this.treeSearch(functionTree, (partOfAST) => {
            return partOfAST.expression && partOfAST.expression.expression &&
                   partOfAST.expression.expression.expression && partOfAST.names &&
                   partOfAST.expression.expression.expression.nodeType === "Identifier" &&
                   partOfAST.expression.expression.expression.typeDescriptions &&
                   partOfAST.expression.expression.expression.typeDescriptions.typeString !== "msg" &&
                   partOfAST.expression.expression.memberName === "sender" &&
                   partOfAST.expression.memberName === "call" &&
                   partOfAST.names.indexOf("value") !== -1
        }, extCalls)
        return extCalls
    }

    getIfStatement (functionTree) {
        return this.treeSearch(functionTree, (partOfAST) => {
            return partOfAST.nodeType === "IfStatement" &&
                   partOfAst.revealedIfStatement !== true
        }, undefined, partOfAst => {
            partOfAst.revealedIfStatement = true
        })
    }

    revealCondition (ifStatement) {
        return this.treeSearch(ifStatement, (partOfAST) => {
            return partOfAST.nodeType === "IfStatement"
        })
    }

    compareSrc (src0, src1) {
        let points0 = src0.split(":")
        let points1 = src1.split(":")
        if (Number(points0[0]) === Number(points1[0]))
            return Number(points0[1]) > Number(points1[1])
        return Number(points0[0]) > Number(points1[0])
    }

    detectDangerousExternalCalls (condition, linkedAssignments, externalCalls) {
        linkedAssignments.forEach(assignment => {
            externalCalls.forEach(externalCall => {
                if (this.compareSrc(condition.src, externalCall.src) && this.compareSrc(externalCall.src, assignment.src))
                    this.collectData(`Found reentrancy (${condition.src} - ${assignment.src})`)
            })
        })
    }

    detect (functionTree) {
        let externalCalls = this.getExternalCalls(functionTree)
        let ifStatement = this.getIfStatement(functionTree)
        while (ifStatement) {
            let condition = this.revealCondition(ifStatement)
            let linkedAssignments = this.getLinkedAssignments(functionTree, condition)
            this.detectDangerousExternalCalls(condition, linkedAssignments, externalCalls)
            ifStatement = this.getIfStatement(functionTree)
        }
    }
}

module.exports = Reentrancy
