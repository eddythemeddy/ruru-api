(function() {

    var _doc = $(document),
        _autocomplete = null,
        _autocompleteLsr = null,
        _city = $('#city'),
        _address = $('#company-add'),
        _lat = $('#lat'),
        _long = $('#long'),
        _timezone = $('#timezone'),
        _timezoneHour = $('#timezoneHour'),
        _timezoneHourSpace = $('#timezoneHourSpace'),
        _frm = $('#form-save-company'),
        _btn = _frm.find('button[type="submit"]');

    function _init() {
        _validate.init();
        _submit.init();
        _places.init();

        _doc.on('change','#countryDD',function(){
            _address.attr('disabled','disabled');
            if($(this).val() != '') {
                _address.removeAttr('disabled');
            }
            $('.pac-container').remove();
            _city.val('');
            _address.val('');
            _lat.val('');
            _long.val('');
            _places.init();
        });

        _doc.on('keyup','#company-add',() =>{
            _city.val('');
            _lat.val('');
            _long.val('');
        });
    }

    const _parse = (num) => {
        let preFix = (num < 0) ? '' : '+';
        return preFix + 
            ('0' + Math.floor(num) % 24).slice(-2) + ':' + 
            ((num % 1)*60 + '0').slice(0, 2) + ' GMT';
    }

    const _places = {
        init: () =>{

            _autocomplete = new google.maps.places.Autocomplete(
                (document.getElementById('company-add')), {
                // types: ['(cities)'],
                languagasde: 'en',
                componentRestrictions: {country: $('#countryDD').val().toLowerCase()}
            });
            _autocompleteLsr = google.maps.event.addListener(_autocomplete, 'place_changed',() => {

                var place = _autocomplete.getPlace();
                if(place.name != '') {

                    var lat = place.geometry.location.lat(),
                        lng = place.geometry.location.lng(),
                        storableLocation = {};          

                    $.getJSON("https://maps.googleapis.com/maps/api/timezone/json?location=" + lat + "," + lng + "&key=AIzaSyAz7mGS7lno6k5bCh7_gZEKFMzWDZ5kngE&timestamp=1331161200&sensor=false", function(result){
                        var offsetMoment = moment.duration(result.rawOffset).asHours();

                        _timezone.val(result.timeZoneId),
                        _timezoneHour.val(_parse(offsetMoment * 1000));
                        _timezoneHourSpace.html(_parse(offsetMoment * 1000));
                    });

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

                    _city.val(storableLocation.city);
                    _lat.val(lat);
                    _long.val(lng);
                }
            });
        }
    };

    const _validate = {
        options: {
            ignore: [],
            errorElement: 'span',
            errorPlacement: function(error, element) {

                console.log($(element).attr('name'));
                
                if($.inArray($(element).attr('name'),['city','lat','long']) !== -1 ) {
                    if($('.locations-err').length == 0) {
                        $('<span class="error locations-err">Please pick a location from the dropdown</span>').insertBefore($('#company-add'));
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
                country: "required",
                "company-add": "required",
                city: "required",
                lat: "required",
                email: {
                    required: true,
                    email: true,
                },
                long: "required",
                phone: "required",
                timezone: "required"
            },
            messages: {
                timezone: {
                    required: "Please pick an address first"
                }
            }
        },
        init: function() {
            _frm.validate(this.options);
        }
    };

    const _submit = {
        options: {
            url: location.href,
            type: 'post',
            dataType: 'json',
            beforeSubmit: function(arr, form, options) {
                _submit.action.buttonOff();
                $('.pgn-wrapper').remove();
                return _frm.valid(); //call the validate plugin
            },
            success: function(d) {
                _submit.action.notify(d.r, d.message);
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
    }
})();