/*
 * Simulates both the client and server side of an Oauth flow.
 */

const debug = require('debug')('app')
const config = require('config')
const request = require('async-request')
const OAuth = require('express-oauth-server')

/*
 * Setup webserver
 */

const express = require('express')
const app = express()
app.locals.pretty = true

const requestLogger = require('morgan')
app.use(requestLogger('dev' || 'combined'))

// make forms easier to access
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// static
app.use(express.static('public'))

// routing

const session = require('express-session')
app.use(session({secret: config.secret, cookie: { maxAge: config.maxAge }}))

const MemoryStore = require('./memorystore')
const model = new MemoryStore()


/*
 * Pages/endpoints
 */


// Index page

app.get('/', (req, res) => res.render('index.pug'))

// Client Application

app.get('/clientapp/home', (req, res) => {
  res.render('client_home.pug', {
    client_id: config.client.client_id,
    scope: config.client.scope,
  })
})


app.get('/clientapp/callback', async (req, res) => {
  let access_token = await getAccessTokenFromCode(req.query.code)
  let params = {
    code: req.query.code,
    client_id: config.client.client_id,
    client_secret: config.client.client_secret,
    redirect_uri: config.client.redirect_uri,
    access_token: access_token,
  }
  res.render('client_callback.pug', params)
})

app.get('/clientapp/usetoken', async (req, res) => {
  let accessToken = req.query.access_token
  let resp = await request('http://localhost:3000/api/user_data', {
    headers: {  'Authorization' : 'Bearer ' + accessToken }
  })
  res.render('client_use_token.pug', { body: resp.body, accessToken: accessToken })
})


// Authorization Server

const oauth = new OAuth({
  model: model,
  grants: ['password', 'authorization_code'],
  debug: true,
  requireClientAuthentication: {password: false},
})

// Session based user login

app.post('/login', (req, res) =>  {
  let post = req.body
  let user = model.getUser(post.user, post.password)
  if (user) {
    debug('login user: ', user.username)
    req.session.user = user
    res.redirect(req.header('Referer'))
  } else {
    res.send('Bad username/password')
  }
})

app.get('/logout', (req, res) =>  {
  req.session.destroy()
  res.send('logged out')
})


// require users to login first
app.use('/oauth/authorize', sessionBasedLogin)

app.get('/oauth/authorize', oauth.authorize({
  // Can inject our own login mechanism into authorization endpoint
  authenticateHandler: {
    handle: req => req.session.user
  }
}))

app.post('/oauth/token', oauth.token())


// Resource Server
// Need a valid authentication code to access these

app.use('/api/user_data', oauth.authenticate())

app.use('/api/user_data', (req, res) => res.send('User Data'))


/*
 * Utils
 */

async function getAccessTokenFromCode(code) {
  let formData = {
    client_id: config.client.client_id,
    client_secret: config.client.client_secret,
    redirect_uri: config.client.redirect_uri,
    grant_type: 'authorization_code',
    code: code
  }

  let response = await request('http://localhost:3000/oauth/token', {
    method: 'POST',
    data: formData,
    headers: {  'Content-Type' : 'application/x-www-form-urlencoded' },
  })
  let access_token = JSON.parse(response.body)['access_token']
  return access_token
}

// Uses standard session cookies to store if the user is logged in.
function sessionBasedLogin(req, res, next) {
  if ((req.session && req.session.user)) {
    next()
  } else {
    res.render('login.pug', {
      username: config.sample_user.username,
      password: config.sample_user.password,
    })
  }
}


/*
 * Serve
 */

app.listen(
  config.port,
  () => debug(`Example app listening on port ${config.port}`)
)


