var request = require('request');
var doxdox = require('doxdox');

var express = require('express');
var server = express();

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var mongoURI = process.env.MONGOHQ_URL || 'mongodb://localhost:27017/doxdox';

var repos;

MongoClient.connect(mongoURI, function(err, db) {

    repos = db.collection('repos');

});

var rawgit_url = 'https://raw.githubusercontent.com/';

server.use(express.static(__dirname + '/static'));

server.get('/:username/:repo', function (req, res) {

    repos.findOne({ url: req.url }, function (err, docs) {

        if (!docs) {

            docs = {
                url: req.url,
                content: '',
                date: new Date()
            };

            request.get({
                url: rawgit_url + req.params.username + '/' + req.params.repo + '/master/package.json',
                json: true
            }, function (e, r, body) {

                var config = {
                    title: body.name,
                    description: body.description,
                    layout: 'bootstrap'
                };

                var file = body.main;

                request.get({
                    url: rawgit_url + req.params.username + '/' + req.params.repo + '/master/' + body.main
                }, function (e, r, body) {

                    body = doxdox.parseScripts([{
                        name: file,
                        contents: body
                    }], null, config);

                    docs.content = encodeURIComponent(body);

                    repos.insert(docs, function () {

                        res.send(body);

                    });

                });

            });

        } else {

            res.send(decodeURIComponent(docs.content));

        }

    });

});

server.listen(process.env.PORT || 5000);
