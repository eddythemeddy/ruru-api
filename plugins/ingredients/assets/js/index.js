(function() {

	var _ingredientTable = $('#ingsTable');

	function _init(){
		_dataTables.init();
	}

	_dataTables = {
		init: () => {
			$.fn.dataTable.ext.classes.sPageButton = 'btn btn-xs';
			$.fn.dataTable.ext.classes.sFilter = 'data-table-filter';
			$.fn.dataTable.ext.classes.sPageButtonActive = 'btn-primary';
			$.fn.dataTable.ext.classes.sPagePrevious = 'flaticon flaticon-chevron-left no-border';
			$.fn.dataTable.ext.classes.sPageNext = 'flaticon flaticon-chevron-right no-border';
			_ingredientTable.DataTable(_dataTables.options);
		},
		options: {
	        columns: [
	            { data: "prettyName" },
	            { data: "categories" }
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
	            data: function ( d ) {
	                d.fetchIngredients = "myValue";
	            }
	        },
	        initComplete: function(settings, json) {
	        	$('h6.data-tables-header').html(json.iTotalRecords + ' ingredient' + (json.iTotalRecords > 1 ? 's' : ''));
			}
	    }
	}

	return {
		init: _init()	
	}
})();