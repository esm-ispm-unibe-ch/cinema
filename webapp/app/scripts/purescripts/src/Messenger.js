//module Messenger
"use strict";
  
var Messages = require('../../../messages.js').Messages;

exports.confirmImpl = function (title, message, success) {
  return new Promise (function(resolve,reject) {
    Messages.alertify().confirm
      ( title
      , message
      , function () {
        Messages.alertify().message(success);
        resolve(true);
    }, function () {reject(false);});
  }).then(function(res){
    console.log("result",res);
  }).catch(function(reason){
    console.log("error in confirmation promise",reason);
  });
}
