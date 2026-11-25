const db = require('../database')

const insertStatement = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
const findStatement = db.prepare('SELECT id, password_hash FROM users WHERE username = ?')
const listStatement = db.prepare('SELECT id, username FROM users ORDER BY id')

class UsernameTakenError extends Error {
  constructor() {
    super('Username already exists')
    this.name = 'UsernameTakenError'
  }
}

function insertUser(username, passwordHash) {
  try {
    return insertStatement.run(username, passwordHash).lastInsertRowid
  } catch (err) {
    if (err.code === 'ERR_SQLITE_ERROR' && err.errcode === 2067) {
      throw new UsernameTakenError()
    }
    throw err
  }
}

function findUser(username) {
  return findStatement.get(username)
}

function listUsers() {
  return listStatement.all()
}

module.exports = { insertUser, findUser, listUsers, UsernameTakenError }
