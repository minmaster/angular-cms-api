'use strict';

var mongoose = require('mongoose'),
    errorHandler = require('./Errors'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = mongoose.model('User'),
    jwt = require('jsonwebtoken');

var _ = require('lodash');

// Use local strategy
passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(email, password, done) {
        User.findOne({
            email: email
        }, function(err, user) {

            console.log(user);
            console.log(user.authenticate(password));

            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    message: 'Unknown user or invalid password'
                });
            }
            if (!user.authenticate(password)) {
                return done(null, false, {
                    message: 'Unknown user or invalid password'
                });
            }

            return done(null, user);
        });
    }
));

// Serialize sessions
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// Deserialize sessions
passport.deserializeUser(function(id, done) {
    User.findOne({
        _id: id
    }, '-salt -password', function(err, user) {
        done(err, user);
    });
});



exports.signup = function(req, res) {


    delete req.body.roles;

    // Init Variables
    var user = new User(req.body);
    var message = null;

    // Add missing user fields
    user.provider = 'local';
    user.displayName = user.firstName + ' ' + user.lastName;

    // Then save the user
    user.save(function(err) {

        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            // Remove sensitive data before login
            user.password = undefined;
            user.salt = undefined;

            req.login(user, function(err) {
                if (err) {
                    res.status(400).send(err);
                } else {
                    res.json(user);
                }
            });
        }
    });
};

/**
 * Signin after passport authentication
 */
exports.signin = function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err || !user) {
            res.status(400).send(info);
        } else {
            // Remove sensitive data before login
            user.password = undefined;
            user.salt = undefined;

            req.login(user, function(err) {
                if (err) {
                    res.status(400).send(err);
                } else {

                    var token = jwt.sign(user, secretToken, { expiresInMinutes: 60 });

                    res.json({ user : user, token: token});
                }
            });
        }
    })(req, res, next);
};

/**
 * Signout
 */
exports.signout = function(req, res) {
    req.logout();
    res.status(200).send({status: 'OK'});
};


/**
 * Require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).send({
            message: 'User is not logged in'
        });
    }

    next();
};


/**
 * Require login routing middleware
 */
exports.checkLogin = function(req, res) {
    res.status(200).send({ message: 'User logged'})
};


/**
 * User authorizations routing middleware
 */
exports.hasAuthorization = function(roles) {
    var _this = this;

    return function(req, res, next) {
        _this.requiresLogin(req, res, function() {
            if (_.intersection(req.user.roles, roles).length) {
                return next();
            } else {
                return res.status(403).send({
                    message: 'User is not authorized'
                });
            }
        });
    };
};
