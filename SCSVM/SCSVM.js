const path = require("path")

const argsSet = require(path.join(__dirname, "./utils/args.json"))
const yargsConfigurator = require(path.join(__dirname, "./utils/yargsConfigurator"))


class SCSVM {
    constructor (config) {
        yargsConfigurator.init(argsSet)
        const argv = yargsConfigurator.argv()

        let getKeys = () => {
            return Object.keys(argv).reduce((prev, cur, index) => {
                if (cur !== "_" && cur.indexOf("$") === -1)
                    prev.push(cur)
                return prev
            }, [])
        }

        let setNewParam = (configPath, newVal) => {
            let path = configPath.split(".")
            let tmpPointer = this.config
            path.forEach((prop, index) => {
                if (path.length - 1 === index)
                    tmpPointer[prop] = newVal
                else
                    tmpPointer = tmpPointer[prop]
            })
        }

        let getArgObj = (searchedValue) => {
            let args = Object.keys(argsSet)
            let foundArg = args.find(arg => arg === searchedValue)
            if (foundArg !== undefined)
                return argsSet[foundArg]

            for (let i = 0; i < args.length; i++) {
                if (argsSet[args[i]].alias === searchedValue)
                    return argsSet[args[i]]
            }
        }

        this.config = config
        getKeys().forEach(argName => {
            let argObj = getArgObj(argName)
            if (argObj !== undefined && argObj.type === typeof argv[argName])
                setNewParam(argObj.configPath, argv[argName])
        })

        console.log(this.config)
    }
}

module.exports = SCSVM