
var express = require('express');
var app = express();
var async = require('async');
var request = require('request');
var SparqlClient = require('sparql-client');

var query_url = 'http://localhost:9200/laundrospot/_search';

function lookup_simple(q, callback){
	data={"query": { "match": { "string": q } } };
//	data = {"query": { "match": { "lexform": {"query": q}}}};	
	request({url: query_url, method: 'POST', json: true, headers: { "content-type": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
		if (!error && response.statusCode == 200)
		{
			console.log(body);
			callback(body);
		} else{
			console.log("ERROR" + error);
		}
	});
}

function lookup_phrase(q, callback){
        data={"query": {
                "match_phrase": {
                    "string": {
                        "query" :       q,
                        "slop" :     	3
                    }
                }
            }};

        request({url: query_url, method: 'POST', json: true, headers: { "content-type": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
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
		"fuzzy_like_this_field": {
		    "string": {
			"like_text" :         q,
        		"max_query_terms" : 12
		    }
		}
	    }};
      
	request({url: query_url, method: 'POST', json: true, headers: { "content-type": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
                if (!error && response.statusCode == 200)
                {
                        console.log(body);
                        callback(body);
                } else{
                        console.log("ERROR" + error);
                }
        });
}

function get_identical_resources(q, callback){
/*
	query = encodeURIComponent("SELECT * WHERE { GRAPH ?g { ?hello owl:sameAs ?res } } LIMIT 5");
        data = {"query": query};
        request({url: 'http://localhost:8890/sparql', method: 'POST', json: true, headers: { "accept": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
                if (!error && response.statusCode == 200)
                {
                        console.log(body);
                        callback(body);
                } else{
                        console.log("ERROR" + error);
                }
        });

*/
	var endpoint = 'http://localhost:8890/sparql';
        var query = "SELECT ?res WHERE { { <" + q + "> owl:sameAs ?res } UNION { ?res owl:sameAs <" + q + "> } }";
	var client = new SparqlClient(endpoint);
	client.query(query).execute({format: 'resource', resource: 'res'}, function(error, results) {
		callback(results["results"]["bindings"]);
	});
}

function query_anytime(word, func){
	func(word + "!");
}

app.get('/', function(req, res){
	res.send('hello world');
});

app.get('/candidates', function(req, res){
	lookup_simple(req.param('query'), function(cands){
		res.send(cands);
	});
});

app.get('/phrase', function(req, res){
	lookup_phrase(req.param('query'), function(cands){
		res.send(cands);
	});
});

app.get('/fuzzycandidates', function(req, res){
        get_fuzzy_candidate_strings(req.param('query'), function(cands){
                res.send(cands);
        });
});

app.get('/identical', function(req, res){
        get_identical_resources(req.param('query'), function(resources){
                res.send(resources);
        });
});

app.listen(8080);
