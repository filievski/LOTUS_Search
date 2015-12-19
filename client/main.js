//
// Pipelining function for DataTables. To be used to the `ajax` option of DataTables
//

var requestPageLimit = 100;
$.fn.dataTable.pipeline = function ( opts ) {
    // Configuration options
    var conf = $.extend( {
        pages: 2,     // number of pages to cache
        url: '',      // script url
        data: null,   // function or object with parameters to send to the server
                      // matching how `ajax.data` works in DataTables
        method: 'GET' // Ajax HTTP method
    }, opts );
 
    // Private variables for storing the cache
    var cacheLower = -1;
    var cacheUpper = null;
    var cacheLastRequest = null;
    var cacheLastJson = null;
 
    return function ( request, drawCallback, settings ) {
        var ajax          = false;
        var requestStart  = request.start;
        var drawStart     = request.start;
        console.log(request.length);
        console.log(request.start);
        var requestLength = request.length;
        var requestEnd    = requestStart + requestLength;
         
        if ( settings.clearCache ) {
            // API requested that the cache be cleared
            ajax = true;
            settings.clearCache = false;
        }
//        else if ( cacheLower < 0 || requestStart < cacheLower || requestEnd > cacheUpper ) {
        else if ( requestStart % requestPageLimit == 0) {
            // outside cached data - need to make a request
            ajax = true;
        }
         
        // Store the request for checking next time around
        cacheLastRequest = $.extend( true, {}, request );
 
        if ( ajax ) {
            // Need data from the server
            if ( requestStart < cacheLower ) {
                requestStart = requestStart - (requestLength*(conf.pages-1));
 
                if ( requestStart < 0 ) {
                    requestStart = 0;
                }
            }
             
            cacheLower = requestStart;
            cacheUpper = requestStart + (requestLength * conf.pages);
            request.uri = $('#uri').val();
            request.limit = requestPageLimit;
            request.page = (requestStart / requestPageLimit) + 1;
            // Provide the same `data` options as DataTables.
            
            settings.jqXHR = $.ajax( {
                "type":     conf.method,
                "url":      conf.url,
                "data":     request,
                "dataType": "json",
                "cache":    false,
                "success":  function ( apiResult ) {
                    console.log(arguments);
                    var json = apiResultToDataTable(apiResult);
                    cacheLastJson = $.extend(true, {}, json);
 
                    if ( cacheLower != drawStart ) {
                        json.data.splice( 0, drawStart-cacheLower );
                    }
                    json.data.splice( requestLength, json.data.length );
                     
                    drawCallback( json );
                },
                "error": function(jqXhr, testStatus, errorThrown) {
                    if (opts.error) {
                        opts.error(jqXhr.responseText || errorThrown);
                    }
                }
            } );
        } else {
            json = $.extend( true, {}, cacheLastJson );
            json.draw = request.draw; // Update the echo for each response
            json.data.splice( 0, requestStart-cacheLower );
            json.data.splice( requestLength, json.data.length );
            
            drawCallback(json);
        }
    }
};
 

function apiResultToDataTable(apiResult) {
//    datatable.recordsFiltered
    var datatable = {
            recordsFiltered : apiResult.totalResults,
        data : [],

    };
    apiResult.results.forEach(function(val) {
        datatable.data.push([ val , val ]);
    });
    return datatable;
};
// Register an API method that will empty the pipelined data, forcing an Ajax
// fetch on the next draw (i.e. `table.clearPipeline().draw()`)
$.fn.dataTable.Api.register('clearPipeline()', function() {
    return this.iterator('table', function(settings) {
        settings.clearCache = true;
    });
});





var dTables = {};

var destroy = function(type) {
    if (dTables[type]) {
        var table = $('#' + type + 'Table').DataTable();
        table.destroy();
        delete dTables[type];
        $("#" + type + "Table tr").remove();
    }
}

var initDt = function(formEl) {
    $('input[placeholder]')
	.each(function(){ensureInputValue($(this))})
    	//trigger keyup so pre gets updated
	.trigger('keyup');
    formEl = $(formEl);
    var type = formEl.attr('apiType');
    destroy(type);
    var oTable = $('#jsontable');
    oTable.hide();

        var uri = '/retrieve?string=' + encodeURIComponent($('#r2dUri').val()) + "&match=" + $("#matching").val() + "&rank=" + $("#ranking").val() + "&size=" + $("#recordsize").val() + "&langtag=" + encodeURIComponent($("#langtag").val());
		$("#circularG").show();
$.get( uri, function( hitsdata ) {
		var hits=hitsdata["hits"];
 		//$("#stats").html("Took <strong>" + data["took"] + "</strong> ms for <strong>" + data["hits"]["total"] + "</strong> records.");
		var h='<thead><th>Results</th><th></th></thead><tbody>';
		$("#circularG").hide();
 		$("#stats").html("Took <strong>" + hitsdata["took"] + "</strong> ms for <strong>" + hitsdata["numhits"] + "</strong> records.");
		for (var i=0; i<hits.length; i++){
			h+="<tr><td>S: <a href=\"" + hits[i]["subject"] + "\">" + hits[i]["subject"] + "</a><br/>P: <a href=\"" + hits[i]["predicate"] + "\">" + hits[i]["predicate"] + "</a><br/>O: <strong>" + hits[i]["string"] + "</strong></td><td><a role=\"button\" class=\"btn btn-default\" href=\"http://ldf.lodlaundromat.org/" + hits[i]["docid"] + "\" target=\"_blank\">Show document</a><br/><br/><a role=\"button\" class=\"btn btn-default\" href=\"http://lodlaundromat.org/resource/" + hits[i]["docid"] + "\" target=\"_blank\"> Show metadata</a></td></tr>";
		}
		h+="</tbody>";
		oTable.html(h);
		oTable.show();
		console.log(hits);
    });
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var getUriString = function() {
    	return '/retrieve?string=' + encodeURIComponent($('#r2dUri').val()) + "&match=" + $("#matching").val() + "&rank=" + $("#ranking").val() + "&size=" + $("#recordsize").val() + "&langtag=" + encodeURIComponent($("#langtag").val());
}
var ensureInputValue = function(el) {
    if (el.val().length > 0) {
        return el.val();
    } else {
        el.val(el.attr('placeholder'));
        el.keyup();
        return el.val();
    }
}
var handleEvents = function() {
    $('input[placeholder]').keydown(function(e) {
        if (e.keyCode == '38' || e.keyCode == '40' || e.keyCode == '37' || e.keyCode == '39'){
            //arrow button
            ensureInputValue($(this));
        } else if (event.which == 13) {
            //enter
        } else {
            destroy($(this).closest('[apiType]').attr('apiType'));
        }
    });
    $('pre[preFor]').each(function(i, el) {
        var el = $(el);
	var preFor = el.attr('preFor');
	var preFors = preFor.split(' ');
	preFors.forEach(function(preId) {
		$('#' + preId).keyup(function() {
           		el.text(getUriString());
        	});
		$('#' + preId).change(function() {
			el.text(getUriString());
		});
	});
        //initialize
        el.text(getUriString());
    })
    
}

$(document).ready(function() {
    handleEvents();
	$('.selectpicker').selectpicker();
} );
