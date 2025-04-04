'use strict';

var nodemailer = require('nodemailer');
var ejs = require('ejs');



/**
 * Email constructor function.
 *
 * @constructor
 * @param {Object} config
 */
var Email = module.exports = function(config) {
  if (!(this instanceof Email)) {return new Email(config); }
  this.template = require(config.emailTemplate);
  this.transport = config.emailType ? require(config.emailType) : null;
  this.config = config;
};



/**
 * Send email with nodemailer.
 *
 * @private
 * @param {String} type
 * @param {String} username
 * @param {String} email
 * @param {Function} done
 */
Email.prototype.send = function(type, username, email, done) {
  var config = this.config;
  var that = this;

  var subject = config[type].subject;
  var title = config[type].title;
  var text = config[type].text;

  this.template(title, text, function(err, html) {
    if (err) {return done(err); }

    // default local variables
    var locals = {
      appname: config.appname,
      link: that.link,
      username: username
    };

    // add options
    var options = {
      from: config.emailFrom,
      to: email,
      subject: ejs.render(subject, locals),
      html: ejs.render(html, locals)
    };

    // send email with nodemailer

    var transport = that.transport ? that.transport(config.emailSettings) : config.emailSettings.transporter;
    var sendMail = function(transportToUse) {
      var transporter = nodemailer.createTransport(transportToUse);
      transporter.sendMail(options, function(error, res){
        if(error) {return done(error); }
        transporter.close(); // shut down the connection pool, no more messages
        done(null, res);
      });
    };

    // Handle case where transport might be a function returning a promise
    if (typeof transport === 'function') {
      Promise.resolve(transport()).then(sendMail).catch(done);
    } else {
      sendMail(transport);
    }
  });

};



/**
 * Send signup email.
 *
 * @param {String} username
 * @param {String} email
 * @param {String} token
 * @param {Function} done
 */
Email.prototype.signup = function(username, email, token, done) {
  var c = this.config;
  var route;
  if(c.signup.customLink) {
    route = c.signup.customLink;
  } else {
    route = c.rest ? '/rest' + c.signup.route : c.signup.route;
  }
  this.link = '<a href="' + c.url + route + '/' + token + '">' + c.emailSignup.linkText + '</a>';
  this.send('emailSignup', username, email, done);
};



/**
 * Send signup email again.
 *
 * @param {String} username
 * @param {String} email
 * @param {String} token
 * @param {Function} done
 */
Email.prototype.resend = function(username, email, token, done) {
  var c = this.config;
  var route;
  if(c.signup.customLink) {
    route = c.signup.customLink;
  } else {
    route = c.rest ? '/rest' + c.signup.route : c.signup.route;
  }
  this.link = '<a href="' + c.url + route + '/' + token + '">' + c.emailResendVerification.linkText + '</a>';
  this.send('emailResendVerification', username, email, done);
};



/**
 * Send email to email address owner with notice about signup.
 *
 * @param {String} username
 * @param {String} email
 * @param {Function} done
 */
Email.prototype.taken = function(username, email, done) {
  this.send('emailSignupTaken', username, email, done);
};



/**
 * Send email with link for new password.
 *
 * @param {String} username
 * @param {String} email
 * @param {String} token
 * @param {Function} done
 */
Email.prototype.forgot = function(username, email, token, done) {
  var c = this.config;
  var route;
  if(c.forgotPassword.customLink) {
    route = c.forgotPassword.customLink;
  } else {
    route = c.rest ? '/rest' + c.forgotPassword.route : c.forgotPassword.route;
  }
  this.link = '<a href="' + c.url + route + '/' + token + '">' + c.emailForgotPassword.linkText + '</a>';
  this.send('emailForgotPassword', username, email, done);
};
