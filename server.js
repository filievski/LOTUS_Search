
var express = require('express');
var app = express();
var request = require('request');
var fs = require('fs');
var configurationFile = 'config.json';
var uniqBy = require('lodash/uniqBy');


var configuration = JSON.parse(
    fs.readFileSync(configurationFile)
);

var query_url = 'https://' + configuration.auth + '@lotus.lucy.surfsara.nl/lotus/_search';

var numeric_ranks = {"degree": "degree", "numdocs": "r2d", "recency": "timestamp", "lengthnorm": "length", "semrichness": "sr", "termrichness": "tr"};

function retrieve(q, langtag, start, size,  matching, ranking, slop, minmatch, cutoff_freq, fuzziness_level, subject, predicate, filterBlankNodes, scorers, callback){
        // MATCHING
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
		var must=mq;
			if (langtag!="dontcare") must.push({"term": {"langtag": langtag }});
                var data={ "query": { "function_score": { "query": {"bool": {"must": must}} , "field_value_factor": { "field": key }, "boost_mode": "replace" } }, "size": size, "from": start };


		if (subject){
			data["query"]["function_score"]["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.subject", "query": subject}});
		}
		if (predicate){
			data["query"]["function_score"]["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.predicate", "query": predicate}});
		} 
		if (filterBlankNodes){
			data["query"]["function_score"]["query"]["bool"]["must_not"]= [{"query_string": {"default_field": "lit.subject","query": "http://lodlaundromat.org/.well-known/genid"}}];
		}


        }
	else if (ranking=="mix"){
		var must=mq;
		if (langtag!="dontcare") must.push({"term": {"langtag": langtag }});
		var func=[];
		//var scorers={"length":0.5, "timestamp":0.1, "tr": 0.4};
		var keys=Object.keys( scorers );
		for( var i = 0,length = keys.length; i < length; i++ ) {
			func.push({"field_value_factor": {"field": keys[i], "factor": scorers[keys[i]]}}); 
		}
//		for (var scorer in scorers){
//			func.push({"field_value_factor": {"field": scorers, "factor": scorers[scorer]}});	
//		}		
		var data={ "query": { "function_score": { "query": {"bool": {"must": must}} , "functions": func, "boost_mode": "replace", "score_mode": "sum" } }, "size": size};	
                if (subject){
                        data["query"]["function_score"]["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.subject", "query": subject}});
                }
                if (predicate){
                        data["query"]["function_score"]["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.predicate", "query": predicate}});
                }
                if (filterBlankNodes){
                        data["query"]["function_score"]["query"]["bool"]["must_not"]= [{"query_string": {"default_field": "lit.subject","query": "http://lodlaundromat.org/.well-known/genid"}}];
                }

	}
	else { // Content-based ranking
                if (ranking=="proximity") {
                	var must=mq;
                        	if (langtag!="dontcare") must.push({"term": {"langtag": langtag }});
                        rq={ "match_phrase": { "string": {"query": q, "slop": slop}}};
                        var data={"query":{"bool":{"must": must, "should": rq }}, "size": size, "from": start};
                }
                else if (ranking=="psf"){
			var must=mq;
				if (langtag!="dontcare") must.push({"term": {"langtag": langtag }});
				//if (subject!="") must.push({"term": {"subject": subject }});
				//if (predicate!="") must.push({"term": {"predicate": "http://era.rkbexplorer.com/id/title" }});
                        var data={"query": {"bool":{"must": must}}, "size": size, "from": start};
                        //} else
                        //        var data={"query": mq, "size": size};
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

        }
	fs.appendFile('logs.txt', JSON.stringify(data) + '\n', function(err){});
	//if (aggregated){
	//	data["aggs"]={"terms": {"field": "lit.subjecit"}};
//	}
        request({url: query_url, method: 'POST', json: true, headers: { "content-type": "application/json" }, body: data}, function(error, response, body) {
               
                if (!error && response.statusCode == 200)
                {
			//if (aggregated){
			//	callback
			//} else {
				callback(body["took"], body["hits"]["total"], body["hits"]["hits"].map(function(o){
					return o["_source"];
				}));
			//}
                }
        });

}



app.get('/', function(req, res){
    res.sendFile('index.html', {root:'./client'});
});

app.get('/eswc', function(req, res){
    res.sendFile('iswc.html', {root:'./client'});
});

app.get('/docs', function(req, res){
    res.sendFile('docs.html', {root:'./client'});
});

app.use('/themes/default/assets/fonts', express.static('client/ldr'));

app.use('/', express.static('client/static'));

app.get('/retrieve', function(req, res){
	slop=1;
        minmatch="70%";
        fuzziness_level=1;
        cutoff_freq=0.85;
	if (req.param('string')){
		//var ip = req.headers['x-forwarded-for'] || 
		//     req.connection.remoteAddress || 
		//     req.socket.remoteAddress ||
		//     req.connection.socket.remoteAddress;
		try{
			if (req.param('langannotator')=='auto')
				var l='a_' + req.param('langtag');
			else if (req.param('langannotator')=='other')
				var l='any';
			else {
				if (req.param('langtag')){
					var l='u_' + req.param('langtag');
				} else {
					var l='dontcare';
				}
			}
			if (req.param('scorers')){
				var scorers=JSON.parse(req.param('scorers'));
			} else {
				var scorers={};
			}
			console.log(req.param('string'));
			retrieve(req.param('string'), l, req.param('start') || 0, req.param('size') || 10, req.param('match') || 'phrase', req.param('rank') || 'psf', req.param('slop') || 1, req.param('minmatch') || '70%', req.param('cutoff') || 0.001, req.param('fuzziness') || 1, req.param('subject'), req.param('predicate'), req.param('noblank')=="true", scorers, function(took, hits, cands){
				

				if (req.param('uniq')=='true')
				{
					cands=uniqBy(cands, 'subject');
				} 
				res.send({"took": took, "numhits": hits, 'returned': cands.length, 'hits': cands});
				//var filtered = lodash(x, 'subject');
				//res.send({"took": took, "numhits": hits, "hits": cands});
			});
		} catch(e){
			res.send("Server Error.");
		}
	} else{
		res.send("Please supply a string parameter");
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
app.listen(8181, function() {
	console.log('started LOTUS nodejs backend');
});
