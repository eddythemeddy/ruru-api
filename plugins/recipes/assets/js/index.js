(function() {

	var _recipeTable = $('#recipesTable'),
		_tableObj = null;

	function _init(){
		_dataTables.init();
		// $(document).on('change','.filter-active',function(){
		// 	_tableObj.ajax.reload();
		// })
		$(document).on('click', 'td.details-control, td.name-control', function () {
	        var tr = $(this).closest('tr');
	        var row = _tableObj.row( tr );
	 
	        if ( row.child.isShown() ) {
	            // This row is already open - close it
	            row.child.hide();
	            tr.removeClass('shown');
	        }
	        else {
	            // Open this row
	            row.child( _format(row.data()) ).show();
	            tr.addClass('shown');
	        }
	    } );
	}

	const _format = (d) => {
    	let html  = '<div class="child-table-container">';
    		html += '<br/><h6 class="bold inline pull-left m-t-0">' + d.name + ' Variations</h6>' + d.newSubBtn;
    		html += '<br/>';
    		html += '<table class="table table-condensed no-border">';
			html += '<tr>';
			html += '<th>Type</th>';
			html += '<th class="text-center">Price</th>';

    	$.each(d.ings, function(i,e) {
			html += '<th class="text-center">' + e.ingName + '</th>';
    	});

    	html += '</tr>';

    	$.each(d.subRecipes, function(i,e) {
    		html += '<tr>';
	        html += '<td>' + e.typePretty + '</td>';
	        html += '<td class="text-center">' + e.price + '</td>';
	        $.each(e.ings,function(o,p) {
	        	html += '<td class="text-center">' + p.weight + '</td>';	
	        })
    		html += '</tr>';
    	});
	        
	    html += '</table>';
	    html += '</div>';

	    return html;
	}

	_dataTables = {
		init: () => {
			$.fn.dataTable.ext.classes.sPageButton = 'btn btn-xs';
			$.fn.dataTable.ext.classes.sFilter = 'data-table-filter';
			$.fn.dataTable.ext.classes.sPageButtonActive = 'btn-primary';
			$.fn.dataTable.ext.classes.sPagePrevious = 'flaticon flaticon-chevron-left no-border';
			$.fn.dataTable.ext.classes.sPageNext = 'flaticon flaticon-chevron-right no-border';
			_tableObj = _recipeTable.DataTable(_dataTables.options);
		},
		options: {
			order: [
				[ 1, 'desc' ]
			],
	        columns: [
	            {
	                className: 'v-align-middle details-control text-center',
	                orderable: false,
	                data: null,
	                defaultContent: ''
	            },
	            { data: "name", class: 'v-align-middle name-control bold' },
	            { data: "description", class: "v-align-middle text-left" },
	            { data: "category", class: "v-align-middle text-left" },
	            { data: "editBtn", class: "v-align-middle text-center", orderable: false }
	        ],
			columnDefs: [{
				orderable: false, 
				targets: [0] 
			}],
	        stripeClasses: [ 
		        'even', 
		        'odd' 
	        ],
			language: {
				paginate: {
					previous: "<",
					next: ">"
				},
				lengthMenu: "Per Page _MENU_",
			},
			dom: '<"top"fi>rt<"bottom"pl><"clear">',
		    serverSide: true,
		    processing: false,
		    paging: true,
			pageLength: 10,
	        ajax: {
	            url: location.href,
            	type: "POST",
	            data: function ( d, callback) {
	                d.loadRecipes = 1;
	                // // d.status = $('.filter-active').val();
	            },
				dataSrc: function (json) {
					$('h6.data-tables-header').html(json.iTotalRecords + ' Recipe' + (json.iTotalRecords > 1 ? 's' : ''));
					return json.data;
				}
	        },
	        initComplete: function(settings, json) {
	        // 	$('<label class="pull-right m-l-20 m-r-10">Status<br/>' +
			      //   '<select class="filter-active">' +
				     //    '<option value="0">Active</option>' +
				     //    '<option value="1">Inactive</option>' +
			      //   '</select>' + 
			      // '</label>').appendTo(".dataTables_length");
			}
	    }
	}

	return {
		init: _init()	
	}
})();