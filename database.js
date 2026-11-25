const { DatabaseSync } = require('node:sqlite')
const path = require('node:path')

module.exports = new DatabaseSync(path.join(__dirname, 'valhalla.db'))
