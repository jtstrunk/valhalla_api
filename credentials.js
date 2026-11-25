const { scrypt } = require('node:crypto')
const { promisify } = require('node:util')

const scryptAsync = promisify(scrypt)
const credentialsSchema = {
  body: {
    type: 'object',
    required: ['username', 'password'],
    additionalProperties: false,
    properties: {
      username: { type: 'string', minLength: 1, maxLength: 64 },
      password: { type: 'string', minLength: 8, maxLength: 128 }
    }
  }
}

module.exports = { scryptAsync, credentialsSchema }
