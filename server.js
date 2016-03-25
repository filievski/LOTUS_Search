
var express = require('express');
var app = express();
var request = require('request');
var fs = require('fs');
var configurationFile = 'config.json';

var configuration = JSON.parse(
    fs.readFileSync(configurationFile)
);

var query_url = 'https://' + configuration.auth + '@lotus.lucy.surfsara.nl/lotus/_search';

var numeric_ranks = {"degree": "degree", "numdocs": "r2d", "recency": "timestamp", "lengthnorm": "length", "semrichness": "sr", "termrichness": "tr"};

function retrieve(q, langtag, size,  matching, ranking, slop, minmatch, cutoff_freq, fuzziness_level, ip, subject, predicate, filterBlankNodes, callback){
        // MATCHING
	fs.appendFile("out.txt", filterBlankNodes + "\n");
        if (matching=="terms"){
                var mq=[{ "match": { "string": {"query": q, "minimum_should_match": minmatch}}}];
        } else if (matching=="phrase"){
                var mq=[{ "match_phrase": { "string": {"query": q, "slop": slop}}}];
        } else if (matching=="conjunct"){
                var mq = [{"common": {"string": {"query": q, "cutoff_frequency": cutoff_freq, "low_freq_operator": "and"}}}];
        } else { //Fuzzy
                var mq = [{ "match": { "string": { "query": q, "fuzziness": fuzziness_level, "operator": "and"} } }];
        }

        // RANKING

        if (ranking in numeric_ranks){ // Relational ranking
                key=numeric_ranks[ranking];
		//if (key=="degree" || key=="r2d")
		//	query_url='https://' + configuration.auth + '@lotus.lucy.surfsara.nl/lotus22/_search';
                var data={ "query": { "function_score": { "query": mq , "field_value_factor": { "field": key }, "boost_mode": "replace" } }, "size": size };
        } else { // Content-based ranking
                if (ranking=="proximity") {
                        rq={ "match_phrase": { "string": {"query": q, "slop": slop}}};
                        var data={"query":{"bool":{"must": mq, "should": rq }}, "size": size};
                }
                else if (ranking=="psf"){
			var must=mq;
                        if (langtag!="any"){
				if (langtag!="any") must.push({"term": {"langtag": langtag }});
				//if (subject!="") must.push({"term": {"subject": subject }});
				//if (predicate!="") must.push({"term": {"predicate": "http://era.rkbexplorer.com/id/title" }});
			}
                        var data={"query": {"bool":{"must": must}}, "size": size};
                        //} else
                        //        var data={"query": mq, "size": size};
                }
        }
	if (subject){
		data["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.subject", "query": subject}});
	}
	if (predicate){
                data["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.predicate", "query": predicate}});
        } 
	if (filterBlankNodes){
		data["query"]["bool"]["must_not"]= [{"query_string": {"default_field": "lit.subject","query": "http://lodlaundromat.org/.well-known/genid"}}];
	}
	
	// LANGTAG
//	if (langtag!="any"){
//		var data={"query":{"bool":{"must": [mq, {"term": {"langtag": langtag }}]}}, "size": size};
//	} else
//		var data={"query": mq, "size": size};
        fs.appendFile("out.txt", JSON.stringify(data) + "\n");
        request({url: query_url, method: 'POST', json: true, headers: { "content-type": "application/json" }, body: JSON.stringify(data)}, function(error, response, body) {
               
		console.log(body);
		logRequest(error, response.statusCode.toString(), ip, JSON.stringify(data), body["took"], body["hits"]["total"]);
                if (!error && response.statusCode == 200)
                {
                        callback(body["took"], body["hits"]["total"], body["hits"]["hits"].map(function(o){
        //                        return {"subject": o["_source"]["subject"], "predicate": o["_source"]["predicate"], "object": o["_source"]["string"], "docid": o["_source"]["docid"]};
				return o["_source"];
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

var logRequest = function(error, statusCode, ip, reqJson, took, numhits) {
	fs.appendFile('reqs.txt', new Date().toISOString() + ' | ' +  error + ' | ' + statusCode + ' | ' + ip + '|' + reqJson + ' | ' + took + ' | ' + numhits + '\n', function (err){
	});
}



app.get('/', function(req, res){
    res.sendFile('index.html', {root:'./client'});
});

app.get('/docs', function(req, res){
    res.sendFile('docs.html', {root:'./client'});
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

app.get('/retrieve', function(req, res){
	slop=1;
        minmatch="70%";
        fuzziness_level=1;
        cutoff_freq=0.85;

	if (req.param('string')){
		var ip = req.headers['x-forwarded-for'] || 
		     req.connection.remoteAddress || 
		     req.socket.remoteAddress ||
		     req.connection.socket.remoteAddress;
		retrieve(req.param('string'), req.param('langtag') || 'any', req.param('size') || 10, req.param('match') || 'phrase', req.param('rank') || 'psf', req.param('slop') || 1, req.param('minmatch') || '70%', req.param('cutoff') || 0.001, req.param('fuzziness') || 1, ip, req.param('subject'), req.param('predicate'), req.param('noblank')=="true", function(took, hits, cands){
			res.send({"took": took, "numhits": hits, "hits": cands});
		});
	}
	else{
		res.status(400)        // HTTP status 404: NotFound
   		.send('Error: please set the string parameter!');
	}
});


/*
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
*/
app.listen(8181);
