(function() {

	var _compsTable = $('#compsTable');

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
			_compsTable.DataTable(_dataTables.options);
		},
		options: {
	        columns: [
	            { data: "name" },
	            { data: "address" },
	            { data: "phone_number" },
	            { data: "active", class: "text-center" }
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
	                d.fetchCompanies = 1;
	            }
	        },
	        initComplete: function(settings, json) {
	        	$('h6.data-tables-header').html(json.iTotalRecords + ' companies');
			}
	    }
	}

	return {
		init: _init()	
	}
})();