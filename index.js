'use strict';

var express = require('express');
var mongoose = require('mongoose');
var requireDir = require('require-dir');
var bodyParser = require('body-parser');
var passport = require('passport');
var methodOverride = require('method-override');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

var Models = requireDir('./libs/models');
var Controllers = requireDir('./libs/controllers');

global.CONFIG = require('./config.json');
global.secretToken = 'secret-token-sssh';

var ENVIROMENT = global.CONFIG.server;

var app = express();

var db = mongoose.connect(CONFIG[ENVIROMENT].db, function(err) {
    if (err) {
        console.error('\x1b[31m', 'Could not connect to MongoDB!');
        console.log(err);
    }
});

var PORT = process.env.PORT || CONFIG[ENVIROMENT].port;

app.use(require('express-domain-middleware'));


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json({ strict : false}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});



app.use(function errorHandler(err, req, res, next) {
    console.log('error on request %d %s %s', process.domain.id, req.method, req.url);
    console.log(err.stack);
    res.send(500, "Something bad happened. :(");
    if(err.domain) {
        //you should think about gracefully stopping & respawning your server
        //since an unhandled error might put your application into an unknown state
    }
});



app.route('/').get(function(req, res) { res.status(404).send({ 'error' : 'not found'})});


app.route('/users/signup').post(Controllers.Users.signup);
app.route('/users/signin').post(Controllers.Users.signin);
app.route('/users/logout').get(Controllers.Users.signout);
app.route('/users/check').get(expressJwt({secret: secretToken}), Controllers.Users.checkLogin);


// Article Controllers
app.route('/articles').get(Controllers.Articles.list).post(Controllers.Users.requiresLogin, Controllers.Articles.create);
app.route('/articles/:articleId').get(Controllers.Articles.read)
    .put(Controllers.Users.requiresLogin, Controllers.Articles.hasAuthorization, Controllers.Articles.update)
    .delete(Controllers.Users.requiresLogin, Controllers.Articles.hasAuthorization, Controllers.Articles.delete);

// Finish by binding the article middleware
app.param('articleId', Controllers.Articles.articleByID);

app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.send(401, 'invalid token...');
    }
});




app.listen(PORT);
console.log('listen in port '+PORT);

module.exports = app;

