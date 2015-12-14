
var express = require('express');
var app = express();
var async = require('async');
var request = require('request');
var SparqlClient = require('sparql-client');
var fs = require('fs');
var query_url = 'http://localhost:9200/lotus/_search';

function unique_subjects(callback){
        var data={"query": { "aggs": { "rsrces": {"terms": { "field": "triple.subject", "size": "0"} }}}, "size": size};
        request({url: query_url, method: 'POST', json: true, headers: { "content-type": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
                logRequest(error, response.statusCode.toString(), JSON.stringify(data), body["took"], body["hits"]["total"]);
                if (!error && response.statusCode == 200)
                {
                        callback(body["took"], body["hits"]["total"], body["hits"]["hits"].map(function(o){
                                o["_source"]["triple"]["docid"]=o["_source"]["docid"];
                                o["_source"]["triple"]["score"]=o["_score"];
                                return o["_source"]["triple"];
                        }));
                }
        });
}

// Q1 and Q4
function lookup_terms(q, size, langtag, callback){
	if (langtag)
                var data={ "query": { "bool": { "must": [{ "match": { "string": {"query": q, "minimum_should_match": "50%"}}}, { "term": {"langtag": langtag }}] }}, "size": size};
	else
		var data={"query": { "match": { "string": {"query": q, "minimum_should_match": "50%"} }}, "size": size};
	request({url: query_url, method: 'POST', json: true, headers: { "content-type": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
                logRequest(error, response.statusCode.toString(), JSON.stringify(data), body["took"], body["hits"]["total"]);
		if (!error && response.statusCode == 200)
		{
			callback(body["took"], body["hits"]["total"], body["hits"]["hits"].map(function(o){
				o["_source"]["triple"]["docid"]=o["_source"]["docid"];
				o["_source"]["triple"]["score"]=o["_score"];
				return o["_source"]["triple"];
			}));
		}
	});
}

// Q2 and Q3
function lookup_phrase(q, size, langtag, callback){
	var slop=3;
	if (langtag)
                var data={ "query": { "bool": { "must": [{ "match_phrase": { "string": {"query": q, "slop": slop}}}, { "term": {"langtag": langtag }}] }}, "size": size};
	else
		var data={"query": { "match_phrase": { "string": {"query": q, "slop": slop }}}, "size": size};
	request({url: query_url, method: 'POST', json: true, headers: { "content-type": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
                logRequest(error, response.statusCode.toString(), JSON.stringify(data), body["took"], body["hits"]["total"]);
		if (!error && response.statusCode == 200)
		{
                        callback(body["took"], body["hits"]["total"], body["hits"]["hits"].map(function(o){
                                o["_source"]["triple"]["docid"]=o["_source"]["docid"];
                                o["_source"]["triple"]["score"]=o["_score"];
                                return o["_source"]["triple"];
			}));
		} 
	});
}

// Q5
function conjunct_terms(q, size, langtag, callback){
	
        if (langtag)
		var data = {"query": {"bool": { "must": [{"common": {"string": {"query": q, "cutoff_frequency": 0.85, "low_freq_operator": "and"}}}, { "term": {"langtag": langtag }}]}}, "size": size};
	else
		var data = {"query": {"common": {"string": {"query": q, "cutoff_frequency": 0.85, "low_freq_operator": "and"}}}, "size": size};
        request({url: query_url, method: 'POST', json: true, headers: { "content-type": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
                logRequest(error, response.statusCode.toString(), JSON.stringify(data), body["took"], body["hits"]["total"]);
                if (!error && response.statusCode == 200)
                {
                        callback(body["took"], body["hits"]["total"], body["hits"]["hits"].map(function(o){
                                o["_source"]["triple"]["docid"]=o["_source"]["docid"];
                                o["_source"]["triple"]["score"]=o["_score"];
                                return o["_source"]["triple"];
                        }));
                } 
        });
}

// Q6
function lookup_fuzzy_terms(q, size, langtag, fuzziness_level, callback){
	if (langtag)
        	var data={"query": {"bool": { "must": [{ "match": { "string": { "query": q, "fuzziness": fuzziness_level, "operator": "and"} } }, { "term": {"langtag": langtag}}]}}, "size": size};
	else
        	var data={"query": { "match": { "string": { "query": q, "fuzziness": fuzziness_level, "operator": "and"} } }, "size": size};
        request({url: query_url, method: 'POST', json: true, headers: { "content-type": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
		logRequest(error, response.statusCode.toString(), JSON.stringify(data), body["took"], body["hits"]["total"]);
                if (!error && response.statusCode == 200)
                {
                        callback(body["took"], body["hits"]["total"], body["hits"]["hits"].map(function(o){
                                o["_source"]["triple"]["docid"]=o["_source"]["docid"];
                                o["_source"]["triple"]["score"]=o["_score"];
                                return o["_source"]["triple"];
                        }));
                }       
	});
}

var logRequest = function(error, statusCode, reqJson, took, numhits) {
	fs.appendFile('reqs.txt', new Date().toISOString() + ' | ' +  error + ' | ' + statusCode + ' | ' + reqJson + ' | ' + took + ' | ' + numhits + '\n', function (err){
	});
}

/*
function lookup_bool(q, size, langtag, callback){
	if (langtag!="")
        	var data={ "query": { "bool": { "must": { "match_phrase": { "string": q}}, "should": { "term": {"langtag": langtag }} }}};
	else
		var data={"query": { "match": { "string": q, "operator": "and" } }, "size": size};
	console.log(data);
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
*/

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
    res.sendFile('index.html', {root:'./client'});
});

app.get('/main.js', function(req, res){
    res.sendFile('main.js', {root:'./client'});
});

app.get('/teal-lotus.ico', function(req, res){
    res.sendFile('teal-lotus.ico', {root:'./client'});
});

app.get('/teal-lotus.svg', function(req, res){
    res.sendFile('teal-lotus.svg', {root:'./client'});
});

app.get('/cssload.css', function(req, res){
    res.sendFile('cssload.css', {root:'./client'});
});

app.get('/phrase', function(req, res){
	lookup_phrase(req.param('pattern'), req.param('size') || 10, req.param('langtag') || "", function(took, hits, cands){
                res.send({"took": took, "numhits": hits, "hits": cands});
	});
});

app.get('/terms', function(req, res){
        lookup_terms(req.param('pattern'), req.param('size') || 10, req.param('langtag') || "", function(took, hits, cands){
                res.send({"took": took, "numhits": hits, "hits": cands});
        });
});

app.get('/conjunct', function(req, res){
        conjunct_terms(req.param('pattern'), req.param('size') || 10, req.param('langtag') || "", function(took, hits, cands){
                res.send({"took": took, "numhits": hits, "hits": cands});
        });
});

app.get('/fuzzyconjunct', function(req, res){
        lookup_fuzzy_terms(req.param('pattern'), req.param('size') || 10, req.param('langtag') || "", req.param('fuzziness') || 1, function(took, hits, cands){
                res.send({"took": took, "numhits": hits, "hits": cands});
        });
});

app.listen(8080);
