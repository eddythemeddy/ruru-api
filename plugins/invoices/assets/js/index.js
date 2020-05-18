(function() {

    var _invoiceTable = $('#invoiceTable'),
        _tableObj = null;

    function _init(){
        _dataTables.init();
        $(document).on('change','.filter-active', function(){
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
            _tableObj = _invoiceTable.DataTable(_dataTables.options);
        },
        options: {
            order: [
                [ 1, 'desc' ]
            ],
            columns: [
                { data: "eventIdPretty", class: "text-left v-align-middle" },
                { data: "datePretty", class: "text-left v-align-middle"},
                { data: "client", class: "text-center v-align-middle"},
                { data: "event_progress", class: "text-center v-align-middle"},
                { data: "total_orders", class: "text-center v-align-middle", title: "# Orders"},
                { data: "totalPrice", class: "text-right v-align-middle"},
                { data: "statusPretty", class: "text-right v-align-middle"}
            ],
            stripeClasses: [ 'even', 'odd' ],
            language: {
                paginate: {
                    previous: "<",
                    next: ">"
                },
                lengthMenu: "Per Page _MENU_",
            },
            dom: '<"top"fi>rt<"bottom"pl><"clear">',
            serverSide: true,
            // searching: false,
            processing: false,
            paging: true,
            pageLength: 10,
            ajax: {
                url: location.href,
                type: "POST",
                data: function ( d, callback) {
                    d.fetchInvoices = 1;
                    d.event_type = $('.filter-active').val();
                },
                dataSrc: function (json) {
                    setTimeout(function(){
                        $.Pages.initTooltipPlugin()
                    },0),
                    $('h6.data-tables-header').html(json.iTotalRecords + ' Invioce' + (json.iTotalRecords > 1 ? 's' : ''));
                    return json.data;
                }
            },
            initComplete: function(settings, json) {
                $('<label class="pull-left m-r-10">Event Type<br/>' +
                    '<select class="filter-active">' +
                        '<option value="">All</option>' +
                        '<option value="public">Public</option>' +
                        '<option value="private">Private</option>' +
                    '</select>' + 
                  '</label><br/>').appendTo("#forecastTable_filter");
            }
        }
    }

    return {
        init: _init()   
    }
})();