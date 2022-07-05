const path = require("path")
const config = require(path.join(__dirname, "config.js"))

const SCSVM = require("./SCSVM/SCSVM")

const scsvm = new SCSVM(config)
