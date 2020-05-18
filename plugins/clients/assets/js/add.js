(function(){

    var _frm = $('#form-create-ingredient'),
        _btn = _frm.find('button[type="submit"]'),
        _doc = $(document),
        _autocomplete = null,
        _autocompleteLsr = null,
        _city = $('#city'),
        _address = $('#client-add'),
        _lat = $('#lat'),
        _long = $('#long');

    function _init() {
        _validate.init();
        _submit.init();
        _places.init();

        $('.select-2').select2();

        _doc.on('change','#countryDD',function(){
            $.when(
                $('.pac-container').remove(),
                _city.val(''),
                _address.val(''),
                _lat.val(''),
                _long.val(''),
                google.maps.event.removeListener(_autocompleteLsr),
                google.maps.event.clearInstanceListeners(_autocomplete)
            ).done(function(){
                _places.init();
            })
        });

        _doc.on('keyup','#client-add',function(){

            _city.val('');
            _lat.val('');
            _long.val('');
        });
    }

    var _places = {
        init: function(){

            _autocomplete = new google.maps.places.Autocomplete(
                (document.getElementById('client-add')), {
                // types: ['(cities)'],
                languagasde: 'en',
                componentRestrictions: {country: $('#countryDD').val().toLowerCase()}
            });
            _autocompleteLsr = google.maps.event.addListener(_autocomplete, 'place_changed', function () {

                var place = _autocomplete.getPlace();
                if(place.name != '') {

                    let storableLocation = {};

                    for (var ac = 0; ac < place.address_components.length; ac++) {
                        
                       var component = place.address_components[ac];
                        
                       if(component.types.includes('sublocality') || component.types.includes('locality')) {
                            storableLocation.city = component.long_name;
                       }
                       else if (component.types.includes('administrative_area_level_1')) {
                            storableLocation.state = component.short_name;
                       }
                       else if (component.types.includes('country')) {
                            storableLocation.country = component.long_name;
                            storableLocation.registered_country_iso_code = component.short_name;
                       }

                    };

                    $('#city').val(storableLocation.city);
                    $('#lat').val(place.geometry.location.lat());
                    $('#long').val(place.geometry.location.lng());
                }
            });
        }
    }

    var _validate = {
        options: {
            ignore: [],
            errorElement: 'span',
            errorPlacement: function(error, element) {
                
                if($.inArray($(element).attr('name'),['city','lat','long']) !== -1 ) {
                    if($('.locations-err').length == 0) {
                        $('<span class="error locations-err">Please pick a location from the dropdown</span>').insertBefore($('#address'));
                    }
                } else {
                    error.insertBefore(element);
                }
                return false;
            },
            invalidHandler: function(form, validator) {
                if(!validator.numberOfInvalids()) {
                    return;
                }
            },
            rules: {
                name: "required",
                description: "required",
                country: "required",
                city: "required",
                lat: "required",
                long: "required",
                phone: "required",
                mainContact: "required",
            }
        },
        init: function() {
            _frm.validate(this.options);
        }
    };

    var _submit = {
        options: {
            url: location.href,
            type: 'post',
            dataType: 'json',
            beforeSubmit: function(arr, form, options) {
                _submit.action.buttonOff(),
                $('.pgn-wrapper').remove();
                return _frm.valid(); //call the validate plugin
            },
            success: function(d) {
                if(d.r == "fail") {
                    _submit.action.notify(d.type, d.message);
                    _submit.action.buttonOn();
                } else {
                    window.location = d.redirect;
                }
                _submit.action.buttonOn();
            },
            error: function(d) {
                _submit.action.buttonOn();
            }
        },
        init: function() {
            _frm.ajaxForm(this.options);
        },
        action: {
            buttonOn: function() {
                _btn.removeClass('disabled').removeAttr('disabled');
            },
            buttonOff: function() {
                _btn.addClass('disabled').attr('disabled','disabled');  
            },
            notify: function(type, message) {
                $('body').pgNotification({
                    style: 'flip',
                    message: message,
                    position: 'top-right',
                    timeout: 0,
                    type: type
                }).show(),
                setTimeout(function(){
                    $('.pgn-wrapper').remove();
                },3000);
            }
        }
    };

    return {
        init: _init()
    };
})();