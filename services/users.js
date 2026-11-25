const { randomBytes } = require('node:crypto')
const users = require('../repositories/users')
const { createSession } = require('../sessions')
const { scryptAsync } = require('../credentials')

async function createUser(username, password) {
  const salt = randomBytes(16).toString('hex')
  const hash = await scryptAsync(password, salt, 64)
  const passwordHash = `scrypt:${salt}:${hash.toString('hex')}`

  const id = users.insertUser(username, passwordHash)
  const token = createSession(id)
  
  return { id, username, token }
}

function listUsers() {
  return users.listUsers()
}

module.exports = { createUser, listUsers, UsernameTakenError: users.UsernameTakenError }
