const winston = require('winston')
const path = require("path")
const child_process = require("child_process")

const yargsConfigurator = require(path.join(__dirname, "./utils/yargsConfigurator"))
const argsSet = require(path.join(__dirname, "./utils/args.json"))
const config = require(path.join(__dirname, "config.js"))

const SCSVM = require("./SCSVM/SCSVM")

const HEADER = `
┌───────────────
        Run SCSVM module
                    ───────────────┘
`


class Interface {
    constructor (config)  {
        let initLogger = () => {
            const logger = winston.createLogger({
                level: this.config.log.level,
                format: winston.format.combine(
                    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                    winston.format.printf(printfInfo => {
                        if (printfInfo.message === HEADER)
                            return HEADER
                        return `⌞ ${printfInfo.level.toUpperCase()}${printfInfo.level.length === 4 ? " " : ""} ⌝ [${printfInfo.timestamp}] - ${printfInfo.message}`
                    })
                ),
                transports: [
                    new winston.transports.File({ filename: this.config.log.path }),
                    new winston.transports.Console
                ]
            })
            console.warn  = logger.warn.bind(logger)
            console.info  = logger.info.bind(logger)
            console.debug = logger.debug.bind(logger)
            console.silly = logger.silly.bind(logger)
            console.error = logger.error.bind(logger)
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

        console.info(HEADER)
        console.info(JSON.stringify(this.config))

        this.scsvm = new SCSVM()
    }

    createSolidityCompilerCommand () {
        let dockerRun = `docker run ${this.config.docker.permanent ? "" : "--rm"}`
        let dockerImage = "ethereum/solc", mountFlag = "-v"
        return `${dockerRun} ${mountFlag} ${this.config.contract.path}:${this.config.docker.mount} ${dockerImage}:${this.config.compiler.version} --ast-compact-json ${this.config.docker.mount}${this.config.contract.file}`
    }

    getHeader (stdout) {
        let regex = new RegExp(this.config.stdout_parser.headers.replace('{filename_regexp}', this.config.stdout_parser.filename_regexp))
        let res = stdout.match(regex)
        return res !== null ? res[0] : ""
    }

    revealFileName (header) {
        let filename = header.match(this.config.stdout_parser.filename_regexp)[0].trim()
        console.silly(filename)
        return filename
    }

    memoriseAST (file, AST) {
        this.ASTInfo = {
            file : file,
            ast : JSON.parse(AST)
        }
    }

    parseStdOut (stdout) {
        stdout = stdout.substring(stdout.search(this.config.stdout_parser.init_phrase) + this.config.stdout_parser.init_phrase.length)
        while (stdout.length) {
            let header = this.getHeader(stdout)
            if (!header)
                break

            let fileName = this.revealFileName(header)
            stdout = stdout.substring(stdout.search(header) + header.length, stdout.length)

            header = this.getHeader(stdout)                                     // next header or endOfFile
            let endOfJSON = header ? stdout.search(header) : stdout.length
            this.memoriseAST(fileName, stdout.substring(0, endOfJSON))
        }
    }

    runSolidityCompiler () {
        let command = this.createSolidityCompilerCommand()
        console.silly(command)
        child_process.exec(command, ((error, stdout, stderr) => {
            if (error) {
                console.error(error)
                return
            }
            this.parseStdOut(stdout)
        }))
    }
}

const scsvmInterface = new Interface(config)
scsvmInterface.runSolidityCompiler()
