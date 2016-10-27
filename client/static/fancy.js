var RESULTS = {};
var NUMPAGES = 0;
var NUMHITS=0;
var TOOK="";
var CENTER_BOX = null;
var getParams = function(){
	var params = {};

	if (location.hash) {
	    var parts = location.hash.substring(2).split('&');

	    for (var i = 0; i < parts.length; i++) {
		var nv = parts[i].split('=');
		if (!nv[0]) continue;
		if (!nv[1]) continue;
		params[nv[0]] = nv[1];
	    }
	}
	return params;
}

$( document ).ready(function() {
	CENTER_BOX = $("#centerBox");
	if (CENTER_BOX.val()){
		moveBoxToCorner();
	}
	populateControls();
	queryLotus();
});

var populateControls = function(){
	var params = getParams();
	if (params.q) {
		if (decodeURIComponent(params.q)!=$("#centerBox").val()){
			moveBoxToCorner();//make sure we've got a proper layout to show the results
			$("#centerBox").val(decodeURIComponent(params.q));
		}
		// Langtag
		if (params.langtag && params.langtag!=$("#lang").val())
		{
			$("#lang").val(params.langtag.substring(0,2));
		} else if (params.langtag==""){
			$("#lang").val("");
		}
		// Match
		if (params.match && params.match!=$("#matcher").val() && $("#matcher option[value='" + params.match + "']").length > 0)
		{
			$("#matcher").val(params.match);
		} 
		//else {
		//	$("#matcher").val("phrase");
		//}
		// Rank
		if (params.rank && params.rank!=$("#ranker").val() && $("#ranker option[value='" + params.rank + "']").length > 0)
		{
			$("#ranker").val(params.rank);
		}
		//else 
		//	$("#ranker").val("lengthnorm");
	}
}

var populateHash = function(){
	location.hash = "?q=" + encodeURIComponent($("#centerBox").val()) + "&match=" + $("#matcher").val() + "&rank=" + $("#ranker").val() + "&langtag=" + $("#lang").val();
}

$(window).on('hashchange', function() {
	populateControls();
//  add hash text to the field (ONLY when hash text is different than current value)
//do not exec query

//put this all in a different function. and call this function to document.ready as well
});

$("#centerBox").keyup(function(event){
    if(event.keyCode == 13){
        $("#searchButton").click();
    } else if ($("#centerBox").val()){
	populateHash();
        //location.hash = "?q=" + encodeURIComponent($("#centerBox").val());
    } else {
	location.hash = "";
    }
});

$("#matcher").keyup(function(event){
    if(event.keyCode == 13){
        $("#searchButton").click();
    }
});

$("#matcher").change(function(){
	populateHash();
});

$("#ranker").keyup(function(event){
    if(event.keyCode == 13){
        $("#searchButton").click();
    }
});

$("#ranker").change(function(){
        populateHash();
});

$("#lang").keyup(function(event){
    if(event.keyCode == 13){
        $("#searchButton").click();
    } else if ($("#centerBox").val()){
        populateHash();
    } else {
        location.hash = "";
    }
});


//$("#centerBox").keydown(function(event){
//	location.hash = "q=" + $("#centerBox").val();
//});


var showHideSettings=function(){
	if ($("#expertUI").is(":visible")) {
		$(".brown").attr("title", "Show expert panel");
		$("#expertUI").hide();
	}
	else {
		$(".brown").attr("title", "Hide expert panel")
                $("#expertUI").show();
	}
}

var moveBoxToCorner=function(){
	$("body").removeClass("centered").addClass("cornered");
	$("#navBarBox").val($("#centerBox").val());
};

var changePage=function(toThis){
	queryPage(toThis);
}

var formatNumber=function(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

var generateResult=function(source){
	return '<div class="result"><div class="title">' + source["string"] + '</div><div class="subject"><a href=' + source["subject"] + '>' + source["subject"] + '</a></div><div class="subjectDescr"><a href="http://ldf.lodlaundromat.org/' + source["docid"] + '?subject=' + source["subject"] + '">SOURCE DATA</a> | <a href="http://lodlaundromat.org/resource/' + source["docid"] + '">METADATA</a></div></div>';
}

var queryPageOne=function(){
	moveBoxToCorner();//make sure we've got a proper layout to show the results
	queryLotus();
}

var cleanAll=function(){
	$(".results").empty();
	$(".info").empty();
	$(".pages").empty();
}

var queryPage=function(page){
	//var page=$("#pages").val();
	cleanAll();
	renderPage(page);
	if (page>1)
        	$(".info").append("<label>Page " + page + " of about " + NUMHITS + " results (" + TOOK + " seconds) </label>");
	else
		$(".info").append("<label>About " + NUMHITS + " results (" + TOOK + " seconds)</label>");
}

var addLinks=function(current){
	if (RESULTS.length) {
	var minPage=Math.max(current-5, 1);
	var maxPage=Math.max(10, current+4);
	if (maxPage>NUMPAGES){
		maxPage=NUMPAGES;
	}
	for (var j=minPage; j<=maxPage; j++){
		if (current!=j){
			$(".pages").append('<li><a class="page" href="javascript:void(0)" onclick=changePage(' + j + ')>' + j + '</a></li>');
		} else {
                        $(".pages").append('<li><a class="page active" href="#">' + j + '</a></li>');
		}
	}
	}
}

var renderPage=function(numPage){
	var hits=RESULTS.slice((numPage-1)*10, numPage*10-1);
	for (var i=0; i<hits.length; i++){
		var resultDiv=generateResult(hits[i]);
		$(".results").append(resultDiv);
	}
        addLinks(numPage);
}

var queryLotus=function(){
        var string=$("#centerBox").val();
        if (string!=""){
		cleanAll();
		RESULTS={};
		var retrieveUrl = "/retrieve";
                var reqUrl= retrieveUrl + "?size=5000&noblank=true&predicate=label&uniq=true&string=" + string + "&match=" + $("#matcher").val() + "&rank=" + $("#ranker").val() + "&langtag=" + $("#lang").val();
		var redirectUrl = "/?size=5000&noblank=true&predicate=label&uniq=true&string=" + string + "&match=" + $("#matcher").val() + "&rank=" + $("#ranker").val() + "&langtag=" + $("#lang").val();
                $.get(reqUrl, function(response, status){
                        NUMPAGES=parseInt((response["returned"]-1)/10)+1;
			NUMHITS=formatNumber(response["numhits"]);
                        var hits=response["hits"];
			RESULTS=hits;
			renderPage(1);
			TOOK=(response["took"]/1000).toFixed(2);
                        $(".info").append("<label>About " + NUMHITS + " results (" + TOOK + " seconds)</label>");
                })
        }
}


/*
var queryLotus=function(page){
	var string=$("#centerBox").val();
	var rendered=[];
	if (string!=""){
		$(".results").empty();
		$(".info").empty();
		var reqUrl="http://lotus.lodlaundromat.org/retrieve?start=" + (page-1)*10 + "&size=10&noblank=true&predicate=label&string=" + string;
		$.get(reqUrl, function(response, status){
			var hits=response["hits"];
			for (var i=0; i<hits.length; i++){
				console.log(hits[i]["subject"]);
				if (rendered.indexOf(hits[i]["subject"].toLowerCase())==-1){
					var resultDiv=generateResult(hits[i]);
					$(".results").append(resultDiv);
					//rendered.push(hits[i]["subject"].toLowerCase());
				}
			}
			if (page==1){
				$(".info").append("<label>About " + response["numhits"] + " results (" + (response["took"]/1000).toFixed(2) + " seconds)</label>");
			} else {
                                $(".info").append("<label>Page " + page + " of about " + response["numhits"] + " results (" + (response["took"]/1000).toFixed(2) + " seconds)</label>");				
			}
			var numPages=parseInt((response["numhits"]-1)/10)+1;
			addLinks(numPages, page);
		})
	}
}
*/
