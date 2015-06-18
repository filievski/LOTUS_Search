
var express = require('express');
var app = express();
var async = require('async');
var request = require('request');

function get_candidate_strings(q, callback){
	data = {"query": { "match": { "addr": q}}};	
	request({url: 'http://localhost:9200/addresses/_search', method: 'POST', json: true, headers: { "content-type": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
		if (!error && response.statusCode == 200)
		{
			console.log(body);
			callback(body);
		} else{
			console.log("ERROR" + error);
		}
	});
}

function get_fuzzy_candidate_strings(q, callback){
	data={"query": {
		"fuzzy_like_this": {
		    "addr": {
			"like_text" :         q,
			"boost":                2.0
		    }
		}
	    }};
      
	request({url: 'http://localhost:9200/addresses/_search', method: 'POST', json: true, headers: { "content-type": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
                if (!error && response.statusCode == 200)
                {
                        console.log(body);
                        callback(body);
                } else{
                        console.log("ERROR" + error);
                }
        });
}

function query_anytime(word, func){
	func(word + "!");
}

app.get('/', function(req, res){
	res.send('hello world');
});

app.get('/candidates', function(req, res){
	get_candidate_strings(req.param('query'), function(cands){
		res.send(cands);
	});
});

app.get('/fuzzycandidates', function(req, res){
        get_fuzzy_candidate_strings(req.param('query'), function(cands){
                res.send(cands);
        });
});

app.listen(8080);
