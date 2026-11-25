const { randomBytes, timingSafeEqual } = require('node:crypto')
const { findUser } = require('../repositories/users')
const { createSession } = require('../sessions')
const { scryptAsync } = require('../credentials')

const dummySalt = randomBytes(16).toString('hex')
const dummyHash = Buffer.alloc(64)

class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid username or password')
    this.name = 'InvalidCredentialsError'
  }
}

async function login(username, password) {
  const user = findUser(username)
  let salt = dummySalt
  let expectedHash = dummyHash

  if (user) {
    const parts = user.password_hash.split(':')
    if (parts.length !== 3 || parts[0] !== 'scrypt' ||
        !/^[a-f0-9]{32}$/i.test(parts[1]) || !/^[a-f0-9]{128}$/i.test(parts[2])) {
      throw new Error('Invalid stored password hash')
    }
    salt = parts[1]
    expectedHash = Buffer.from(parts[2], 'hex')
  }

  const hash = await scryptAsync(password, salt, 64)
  if (!timingSafeEqual(hash, expectedHash) || !user) {
    throw new InvalidCredentialsError()
  }

  return { token: createSession(user.id) }
}

module.exports = { login, InvalidCredentialsError }
