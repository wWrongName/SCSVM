const winston = require('winston')
const path = require("path")

const yargsConfigurator = require(path.join(__dirname, "./utils/yargsConfigurator"))
const argsSet = require(path.join(__dirname, "./utils/args.json"))
const config = require(path.join(__dirname, "config.js"))

const SCSVM = require("./SCSVM/SCSVM")


class Interface {
    constructor (config)  {
        let initLogger = () => {
            this.logger = winston.createLogger({
                level: this.config.log.level,
                format: winston.format.combine(
                    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                    winston.format.printf(printfInfo => {
                        return `[${printfInfo.level.toUpperCase()}][${printfInfo.timestamp}] - ${printfInfo.message}`
                    })
                ),
                transports: [
                    new winston.transports.File({ filename: this.config.log.path }),
                    new winston.transports.Console
                ]
            })
        }

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

        let mergeConfig = () => {
            this.config = config
            getKeys().forEach(argName => {
                let argObj = getArgObj(argName)
                if (argObj !== undefined && argObj.type === typeof argv[argName])
                    setNewParam(argObj.configPath, argv[argName])
            })
        }

        const argv = yargsConfigurator.init(argsSet).argv()
        mergeConfig()
        initLogger()

        this.scsvm = new SCSVM()
    }
}

const scsvmInterface = new Interface(config)
