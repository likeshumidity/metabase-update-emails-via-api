#! /usr/bin/env node

import * as dotenv from 'dotenv'
import fs from 'fs'
import { parse } from 'csv-parse'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import axios from 'axios'

dotenv.config()

const args = yargs(hideBin(process.argv)).argv


// Create a session with Metabase admin user POST /api/session
const createAdminSessionToken = async ({baseUrl, username, password}) => {
  const request = await axios({
    method: 'post',
    url: '/api/session',
    baseURL: baseUrl,
    data: {
      username,
      password
    }
  })

  return request.data.id
}

const sessionToken = await createAdminSessionToken({
  baseUrl: process.env['METABASE_BASE_URL'],
  username: process.env['METABASE_ADMIN_USER'],
  password: process.env['METABASE_ADMIN_PASS']
})


// Get a list of active users GET /api/user
const getActiveUsers = async ({baseUrl, sessionToken}) => {
  const request = await axios({
    method: 'get',
    url: '/api/user',
    baseURL: baseUrl,
    headers: {
      'X-Metabase-Session': sessionToken
    }
  })

  return request.data.data
}


const activeUsers = await getActiveUsers({
  baseUrl: process.env['METABASE_BASE_URL'],
  sessionToken: sessionToken
})


// Load list of email addresses with matching user info
const loadEmailsAndUsers = async (emaillistCsv, users) => {
  const emails = []
  const parser = fs
    .createReadStream(emaillistCsv)
    .pipe(parse({
      from_line: 2  // Skips header row
    }))

  for await (const row of parser) {
    let [emailOriginal, emailNew] = row
    emails.push({
      emailOriginal,
      emailNew,
      user: users.filter(user => {
        return user.email == emailOriginal
      })
    })
  }

  return emails
}

const emails = await loadEmailsAndUsers(args.emaillist, activeUsers)


// Update email addresses PUT /api/user/:id
const updateAccount = async ({baseUrl, sessionToken, account}) => {
  console.info(`Attempting to update ${account.emailOriginal} to ${account.emailNew}`)

  if (account.user.length != 1) {
    console.warn(`SKIPPING: Expected 1 user record per email, found ${account.user.length} for ${account.emailOriginal}`)
    console.warn(`user object: ${account.user}`)
    return {
      status: null,
      statusText: `Skipped ${account.emailOriginal}`
    }
  }

  return axios({
    method: 'put',
    url: `/api/user/${account.user[0].id}`,
    baseURL: baseUrl,
    headers: {
      'X-Metabase-Session': sessionToken
    },
    data: {
      email: account.emailNew
    }
  })
}

console.log((await Promise.all(emails.map(account => {
  return updateAccount({
    baseUrl: process.env['METABASE_BASE_URL'],
    sessionToken,
    account
  })
}))).map(response => {
  return {
    status: response.status,
    statusText: response.statusText
  }
}))
