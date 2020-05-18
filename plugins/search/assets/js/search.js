var REGISTER = (function(){

    var _frm = $('#register-form'),
        _btn = _frm.find('button[type="submit"]');

    function _init(){

        $('#searchFilters').scroll(function() {
            var currPos = $('#searchFilters').scrollLeft();
            if(currPos) {
                $(".no-search,.with-search").select2('close');
            }
        });

        $(".no-search").select2({
            minimumResultsForSearch: -1,
            dropdownAutoWidth: 'true'
        });

        $(".with-search").select2({
            dropdownAutoWidth: 'true',
            // dropdownCssClass: 'location-dropdown
            // dropdownCssClass: "custom-dropdown"
        });

        $('.search-text').keypress(function (e) {

            var key = e.which;

            if(key == 13) {
                _runSearch();
                return false;  
            }
        });

        $(document).on('change','.search-select, #search-type',function(){
            _runSearch();
        });
    }

    var _runSearch = function(){
        var address = {};

        $('[data-def]').each(function(){
            address[$(this).data('def')] = $(this).val();
        });

        var url = '/search/results/' + $('#search-type').val();
        var searchText = $('.search-text').val();
        var currentUrl = window.location.href;

        url += '?p=' + searchText;

        $.each(address,function(i,e){
            url += '&' + i + '=' + e;
        })

        window.location.href = url;
    }

    return {
        init: _init()
    }
})();