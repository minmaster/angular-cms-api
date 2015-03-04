'use strict';

var express = require('express');
var mongoose = require('mongoose');
var requireDir = require('require-dir');
var bodyParser = require('body-parser');
var passport = require('passport');
var methodOverride = require('method-override');

var Models = requireDir('./models');
var Controllers = requireDir('./controllers');

global.CONFIG = require('./config.json');

var ENVIROMENT = global.CONFIG.server;

var app = express();

var db = mongoose.connect(CONFIG[ENVIROMENT].db, function(err) {
    if (err) {
        console.error('\x1b[31m', 'Could not connect to MongoDB!');
        console.log(err);
    }
});


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json({ strict : false}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    next();
});


app.route('/users/signup').post(Controllers.Users.signup);
app.route('/users/signin').get(Controllers.Users.signin);
app.route('/users/logout').get(Controllers.Users.signout);


// Article Controllers
app.route('/articles').get(Controllers.Articles.list).post(Controllers.Users.requiresLogin, Controllers.Articles.create);
app.route('/articles/:articleId').get(Controllers.Articles.read)
    .put(Controllers.Users.requiresLogin, Controllers.Articles.hasAuthorization, Controllers.Articles.update)
    .delete(Controllers.Users.requiresLogin, Controllers.Articles.hasAuthorization, Controllers.Articles.delete);

// Finish by binding the article middleware
app.param('articleId', Controllers.Articles.articleByID);


app.listen(CONFIG[ENVIROMENT].port);
console.log('listen in port '+CONFIG[ENVIROMENT].port);

