
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

function retrieve(o, callback){
        // MATCHING
        if (o.match=="terms"){
                var mq=[{ "match": { "string": {"query": o.q, "minimum_should_match": o.minmatch}}}];
        } else if (o.match=="phrase"){
                var mq=[{ "match_phrase": { "string": {"query": o.q, "slop": o.slop}}}];
        } else if (o.match=="conjunct"){
                var mq = [{"common": {"string": {"query": o.q, "cutoff_frequency": o.cutoff, "low_freq_operator": "and"}}}];
        } else { //Fuzzy
                var mq = [{ "match": { "string": { "query": o.q, "fuzziness": o.fuzziness, "operator": "and"} } }];
        }

        // RANKING

        if (o.rank in numeric_ranks){ // Relational ranking
                key=numeric_ranks[o.rank];
		//if (key=="degree" || key=="r2d")
		//	query_url='https://' + configuration.auth + '@lotus.lucy.surfsara.nl/lotus22/_search';
		var must=mq;
			if (o.langtag!="dontcare") must.push({"term": {"langtag": o.langtag }});
                var data={ "query": { "function_score": { "query": {"bool": {"must": must}} , "field_value_factor": { "field": key }, "boost_mode": "replace" } }, "size": o.size, "from": o.start };


		if (o.subject){
			data["query"]["function_score"]["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.subject", "query": o.subject}});
		}
		if (o.predicate){
			//data.query.function_score.query.bool.must.push()
			data["query"]["function_score"]["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.predicate", "query": o.predicate}});
		} 
		if (o.noblank){
			data["query"]["function_score"]["query"]["bool"]["must_not"]= [{"query_string": {"default_field": "lit.subject","query": "http://lodlaundromat.org/.well-known/genid"}}];
		}


        }
	else if (o.rank=="mix"){
		var must=mq;
		if (o.langtag!="dontcare") must.push({"term": {"langtag": o.langtag }});
		var func=[];
		//var scorers={"length":0.5, "timestamp":0.1, "tr": 0.4};
		var keys=Object.keys( o.scorers );
		for( var i = 0,length = keys.length; i < length; i++ ) {
			func.push({"field_value_factor": {"field": keys[i], "factor": o.scorers[keys[i]]}}); 
		}
//		for (var scorer in scorers){
//			func.push({"field_value_factor": {"field": scorers, "factor": scorers[scorer]}});	
//		}		
		var data={ "query": { "function_score": { "query": {"bool": {"must": must}} , "functions": func, "boost_mode": "replace", "score_mode": "sum" } }, "size": o.size};	
                if (o.subject){
                        data["query"]["function_score"]["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.subject", "query": o.subject}});
                }
                if (o.predicate){
                        data["query"]["function_score"]["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.predicate", "query": o.predicate}});
                }
                if (o.noblank){
                        data["query"]["function_score"]["query"]["bool"]["must_not"]= [{"query_string": {"default_field": "lit.subject","query": "http://lodlaundromat.org/.well-known/genid"}}];
                }

	}
	else { // Content-based ranking
                if (o.rank=="proximity") {
                	var must=mq;
                        if (o.langtag!="dontcare") must.push({"term": {"langtag": o.langtag }});
                        rq={ "match_phrase": { "string": {"query": o.q, "slop": o.slop}}};
                        var data={"query":{"bool":{"must": must, "should": rq }}, "size": o.size, "from": o.start};
                }
                else if (o.rank=="psf"){
			var must=mq;
				if (o.langtag!="dontcare") must.push({"term": {"langtag": o.langtag }});
				//if (subject!="") must.push({"term": {"subject": subject }});
				//if (predicate!="") must.push({"term": {"predicate": "http://era.rkbexplorer.com/id/title" }});
                        var data={"query": {"bool":{"must": must}}, "size": o.size, "from": o.start};
                        //} else
                        //        var data={"query": mq, "size": size};
                }

		if (o.subject){
			data["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.subject", "query": o.subject}});
		}
		if (o.predicate){
			data["query"]["bool"]["must"].push({"query_string": {"default_field": "lit.predicate", "query": o.predicate}});
		} 
		if (o.noblank){
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
	// Set default values for the hyperparameters
	slop=1;
        minmatch="70%";
        fuzziness_level=1;
        cutoff_freq=0.001;
	if (!req.param('string')) return res.send('Please supply a string parameter');
	//var ip = req.headers['x-forwarded-for'] || 
	//     req.connection.remoteAddress || 
	//     req.socket.remoteAddress ||
	//     req.connection.socket.remoteAddress;
	try{

		// Prepare the more complex parameters
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
	
		// Fill the object with all needed data for the request
		var object={};
		object.q=req.param('string');
		object.langtag=l;
		object.start=req.param('start') || 0;
		object.size=req.param('size') || 10;
		object.match=req.param('match') || 'phrase';
		object.rank=req.param('rank') || 'psf';
		object.slop=req.param('slop') || slop;
		object.minmatch=req.param('minmatch') || minmatch;
		object.cutoff=req.param('cutoff') || cutoff_freq;
		object.fuziness=req.param('fuzziness') || fuzziness_level;
		object.subject=req.param('subject');
		object.predicate=req.param('predicate');
		object.noblank=(req.param('noblank')=="true");
		object.scorers=scorers;
		
		retrieve(object, function(took, hits, cands){

			if (req.param('uniq')=='true')
			{
				cands=uniqBy(cands, 'subject');
			} 
			res.send({"took": took, "numhits": hits, 'returned': cands.length, 'hits': cands});
		});
	} catch(e){
		res.send("Server Error.");
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
