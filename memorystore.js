
var config = require('config');
var debug = require('debug')('memorystore');


/**
 * Simultates a proper data store.
 */
function InMemoryCache() {

  this.clients = [ {
      clientId : config.client.client_id,
      clientSecret : config.client.client_secret,
      redirectUris : [config.client.redirect_uri],
      grants : [ 'authorization_code' ],
    },
      //// Password based authentication.
      ////  Curently not used, just left for refernce
      //
      //  POST /oauth/token HTTP/1.1
      //  Host: localhost
      //  Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
      //  Content-Type: application/x-www-form-urlencoded
      //
      //  grant_type=password&username=johndoe&password=A3ddj3w
    {
      clientId : 's6BhdRkqt3',
      clientSecret : 'gX1fBat3bV',
      redirectUris : [],
      grants : [ 'password' ],
    },
  ];

  this.users = [ {
      //id : '123',
      username: config.sample_user.username,
      password: config.sample_user.password,
    }
  ];

  // Access tokens given out.
  this.tokens = [];
  // Codes are returned to the clients to request an access token.
  this.authCodes = {};
}

/**
 * used by console.log type functions.
 */
InMemoryCache.prototype.dump = function() {
  console.log('clients', this.clients);
  console.log('users', this.users);
  console.log('tokens', this.tokens);
  console.log('codes', this.authCodes);
};

/**
 * Get client.
 */
InMemoryCache.prototype.getClient = function(clientId, clientSecret) {
  debug('getClient', clientId, clientSecret);
  // TODO: secret?
  var result = this.clients.find(client => client.clientId === clientId) || false;
  debug('getClient', result);
  return result
};


/**
 * Save token.
 */
InMemoryCache.prototype.saveToken = function(token, client, user) {
  debug('saveToken', token, client, user);
  token.client = client;
  token.user = user;
  this.tokens.push(token);
  return token;
};

/**
 * Get access token.
 */
InMemoryCache.prototype.getAccessToken = function(bearerToken) {
  debug('getAccessToken', bearerToken);
  var result = this.tokens.find(token => token.accessToken === bearerToken) || false;
  debug('getAccessToken', result);
  return result
};

/**
 * Get refresh token.
 */
InMemoryCache.prototype.getRefreshToken = function(bearerToken) {
  debug('getRefreshToken', bearerToken);
  var result = this.tokens.find(token => token.refreshToken === bearerToken) || false;
  debug('getRefreshToken', result);
  return result
};


/**
 * Normally used by grant-type password authentication, here also used
 * by our session based login.
 */
InMemoryCache.prototype.getUser = function(username, password) {
  debug('getUser', username, password);
  var result = this.users.find(user => {
    return user.username === username && user.password === password
  }) || false;
  debug('getUser', result);
  return result;
};

InMemoryCache.prototype.saveAuthorizationCode = function(code, client, user) {
  debug('saveAuthorizationCode', code, client, user);
  code.user = user;
  code.client = client;
  this.authCodes[code.authorizationCode] = code;
  return code;
};

InMemoryCache.prototype.getAuthorizationCode = function(code) {
  debug('getAuthorizationCode', code);
  var result = this.authCodes[code];
  debug('getAuthorizationCodes', result);
  return result;
};

/**
 * Authorization codes are deleted after first use because there should be no
 * reason for them to be called twice.
 */
InMemoryCache.prototype.revokeAuthorizationCode = function(code) {
  debug('revokeAuthorizationCode', code);
  delete this.authCodes[code];
  return true;
};

module.exports = InMemoryCache;
