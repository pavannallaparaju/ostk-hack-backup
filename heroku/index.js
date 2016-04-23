/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

var bodyParser = require('body-parser');
var express = require('express');
var request = require('request');
var app = express();

var token = 'CAAN5AZBqpZBJ4BAJCIVM45n1FVxPxTlJAxU3Qg2yuBxEQYZAclZA60TRAUrZBGD55rWVvoy1HgO2LZC39PZC25JbyuqAEAK9PoxyAN12TwBZAGJf6KMeH0bTlFEhUVKRZBCfhZAXDhdmtCoFIoeJtIWiQvKyyReGwaFxcC6HMVtD0rKJgot8wMas666dZAZB0KjwTw6ZCDqp6xIy2OgZDZD';
var wit_token = 'AYRCHHK7DROD74UQ57VIDRKGRIFS7ET3';

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));

app.use(bodyParser.json());

app.get('/', function(req, res) {
    console.log(req);
    res.send('It works!');
});

app.get(['/facebook', '/instagram'], function(req, res) {
    if (req.param('hub.mode') == 'subscribe' && req.param('hub.verify_token') == 'token') {
        res.send(req.param('hub.challenge'));
    } else {
        res.sendStatus(400);
    }
});

/**
 * 
 * @param sender
 * @param text
 */
function sendTextMessage(sender, text) {
    var messageData = {
        text: text
    };
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: token
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: messageData
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message:', error);
        } else if (response.body.error) {
            console.log('Error:', response.body.error);
        }
    });
}

function sendSearchResults(results,sender) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: token
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: results
        }
        }, function(error, response, body) {
        if (error) {
            console.log('Error sending message:', error);
        } else if (response.body.error) {
            console.log('Error:', response.body.error);
        }
    });
}

function searchResults(keyword, sender) {
    request({
        url: 'https://ostk-hack-boot.herokuapp.com/search'+keyword,
        method: 'GET',
        headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }, function(error, response, body) {
        if (error) {
            console.log('Error sending message:', error);
        } else if (response.body.error) {
            console.log('Error:', response.body.error);
        } else {
          var jsonObj = JSON.parse(response.body);
          if(jsonObj.errorMessage){
          var messageData = {
                  attachment: jsonObj.attachment
              };
            sendTextMessage(sender, jsonObj.errorMessage);
            sendSearchResults(messageData,sender);
          }else{
            sendSearchResults(response.body,sender);
          }
        }
    });
}

//Processes the natural language and logs the information for now
function processThroughWit(text, sender){
    request({
        url: 'https://api.wit.ai/message?v=20141022&q='+text,
        method: 'GET',
        headers: {
                'Authorization': 'Bearer AYRCHHK7DROD74UQ57VIDRKGRIFS7ET3',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }, function(error, response, body) {
        if (error) {
            console.log('Error sending message to wit:', error);
        } else if (response.body.error) {
            console.log('Wit Error:', response.body.error);
        } else {
          var jsonObj = JSON.parse(response.body);
            console.log('=========================');
            console.log(response.body,sender);
            console.log('=========================');
        }
    });
}

app.post('/facebook', function(req, res) {
    console.log('Facebook request body:', req.body);
    var messaging_events = req.body.entry[0].messaging;
    for (var i = 0; i < messaging_events.length; i++) {
        var event = req.body.entry[0].messaging[i],
            sender = event.sender.id; // TODO unresolved variable "sender"
        if (event.message && event.message.text) {
            var text = event.message.text;
            // Handle a text message from this sender
            sendTextMessage(sender, 'echo: ' + text.substring(0, 200));
            //processThroughWit(text, sender);
            searchResults('?keyword='+text,sender);
            console.log('SENDER : '+sender);   // TODO unresolved variable "sender"
            console.log(text);
        }else if(event.postback){
          text = event.postback.payload;
           searchResults(text,sender);
          continue;
        }
    }
    res.sendStatus(200);
});

app.post('/instagram', function(req, res) {
    console.log('Instagram request body:', req.body);
    // Process the Instagram updates here
    res.sendStatus(200);
});

app.listen();
