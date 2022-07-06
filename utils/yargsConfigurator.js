const yargs = require("yargs/yargs")
const helpers = require("yargs/helpers")

const yargsConfig = yargs(helpers.hideBin(process.argv))

let yargsConfigurator = {
    init : function (argsSet) {
        yargsConfig.version(false)
        Object.keys(argsSet).forEach(argName => {
            yargsConfig.option(argName, argsSet[argName])
        })
        yargsConfig.parse()
        return this
    },
    argv : () => yargsConfig.argv
}

module.exports = yargsConfigurator