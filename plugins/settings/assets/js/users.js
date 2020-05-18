(function() {

	var _ingredientTable = $('#usersTable'),
		_doc = $(document);

	function _init(){
		_dataTables.init();
	}

	_doc.on('change','.user-status',function(){
		let active = 0,
			id = $(this).data('id');
		if($(this).prop("checked") == true){
			active = 1;
		}

		$.ajax({
            dataType: "json",
            type: "POST",
            data: {
                updateUserStatus: id,
                status: active 
            },
            beforeSend: function() {
            	$('.pgn-wrapper').remove();
            },
            success: function(data) {
            	if(data.r == 'danger') {
            		if(active == 0) {
            			$('.user-status[data-id="' + id + '"]').prop('checked', true);
            		} else {
            			$('.user-status[data-id="' + id + '"]').prop('checked', false);
            		}

            	}
                $('body').pgNotification({
                    style: 'flip',
                    message: data.message,
                    position: 'top-right',
                    timeout: 0,
                    type: data.type
                }).show(),
                setTimeout(function(){
                    $('.pgn-wrapper').remove();
                },3000);
            }
        });

	});

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
	            { data: "name" },
	            { data: "username" },
	            { data: "email" },
	            { data: "status", class: "text-center" },
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
	                d.fetchUsers = 1;
	            }
	        },
	        initComplete: function(settings, json) {
	        	$('h6.data-tables-header').html(json.iTotalRecords + ' Users');
	        	$('[data-init-plugin="switchery"]').each(function() {
		            var el = $(this);
		            new Switchery(el.get(0), {
		                color: (el.data("color") != null ?  $.Pages.getColor(el.data("color")) : $.Pages.getColor('success')),
		                size : (el.data("size") != null ?  el.data("size") : "default")
		            });
		        });
			}
	    }
	}

	return {
		init: _init()	
	}
})();