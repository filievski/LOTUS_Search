var RESULTS = {};
var NUMPAGES = 0;
var NUMHITS=0;
var TOOK="";

$("#centerBox").keyup(function(event){
    if(event.keyCode == 13){
        $("#searchButton").click();
    }
});

var moveBoxToCorner=function(){
	$("body").removeClass("centered");
	$("#navBarBox").val($("#centerBox").val());
};

var changePage=function(toThis){
	queryPage(toThis);
}

var formatNumber=function(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

var generateResult=function(source){
	return '<div class="result"><div class="title">' + source["string"] + '</div><div class="subject">' + source["subject"] + '</div><div class="subjectDescr"><a href="http://ldf.lodlaundromat.org/' + source["docid"] + '">SOURCE</a></div></div>';
}

var queryPageOne=function(){
	queryLotus();
}

var queryPage=function(page){
	//var page=$("#pages").val();
	renderPage(page);
	if (page>1)
        	$(".info").append("<label>Page " + page + " of about " + NUMHITS + " results (" + TOOK + " seconds) </label>");
	else
		$(".info").append("<label>About " + NUMHITS + " results (" + TOOK + " seconds)</label>");
}

var addLinks=function(current){
	$(".pages").empty();
	var minPage=Math.max(current-5, 1);
	var maxPage=Math.max(10, current+4);
	if (maxPage>NUMPAGES){
		maxPage=NUMPAGES;
	}
	for (var j=minPage; j<=maxPage; j++){
		if (current!=j){
			$(".pages").append('<li><a class="page" href="#" onclick=changePage(' + j + ')>' + j + '</a></li>');
		} else {
                        $(".pages").append('<li><a class="page active" href="#">' + j + '</a></li>');
		}
	}
}

var renderPage=function(numPage){
	$(".results").empty();
	$(".info").empty();
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
		RESULTS={};
                var reqUrl="http://lotus.lodlaundromat.org/retrieve?size=5000&noblank=true&predicate=label&uniq=true&string=" + string;
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
