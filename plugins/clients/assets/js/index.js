(function() {

	var _ingredientTable = $('#channelsTable'),
		_tableObj = null;

	function _init(){
		_dataTables.init();
		$(document).on('change','.filter-active',function(){
			_tableObj.ajax.reload();
		})
	}

	_dataTables = {
		init: () => {
			$.fn.dataTable.ext.classes.sPageButton = 'btn btn-xs';
			$.fn.dataTable.ext.classes.sFilter = 'data-table-filter';
			$.fn.dataTable.ext.classes.sPageButtonActive = 'btn-primary';
			$.fn.dataTable.ext.classes.sPagePrevious = 'flaticon flaticon-chevron-left no-border';
			$.fn.dataTable.ext.classes.sPageNext = 'flaticon flaticon-chevron-right no-border';
			_tableObj = _ingredientTable.DataTable(_dataTables.options);
		},
		options: {
	        columns: [
	            { data: "nameEdited" },
	            { data: "address" },
	            { data: "phone", class: "text-right" },
	            { data: "repeats", class: "text-center" }
	        ],
	        stripeClasses: [ 'even', 'odd' ],
			language: {
				paginate: {
					previous: "<",
					next: ">"
				},
				lengthMenu: "Per Page _MENU_",
			},
			columnDefs: [{
				orderable: false, 
				targets: 2 
			}],
			dom: '<"top"fi>rt<"bottom"pl><"clear">',
		    serverSide: true,
		    processing: false,
		    paging: true,
			pageLength: 10,
	        ajax: {
	            url: location.href,
            	type: "POST",
	            data: function ( d, callback) {
	                d.fetchClients = 1;
	                d.status = $('.filter-active').val();
	            },
				dataSrc: function (json) {
					$('h6.data-tables-header').html(json.iTotalRecords + ' Client' + (json.iTotalRecords > 1 ? 's' : ''));
					return json.data;
				}
	        },
	        initComplete: function(settings, json) {
	        	$('<label class="pull-right m-l-20 m-r-10">Status<br/>' +
			        '<select class="filter-active">' +
				        '<option value="0">Active</option>' +
				        '<option value="1">Inactive</option>' +
			        '</select>' + 
			      '</label>').appendTo(".dataTables_length");
			}
	    }
	}

	return {
		init: _init()	
	}
})();