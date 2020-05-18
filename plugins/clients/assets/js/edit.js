(function(){

    let _frm = $('#form-save-channel'),
        _btn = _frm.find('button[type="submit"]'),
        _doc = $(document),
        _autocomplete = null,
        _autocompleteLsr = null,
        _city = $('#city'),
        _address = $('#client-add'),
        _lat = $('#lat'),
        _long = $('#long'),
        _weeklyPlan = $('#weeklyPlan');

    function _init() {
        _validate.init();
        _submit.init();
        _delete.init();
        _places.init();

        $('.select-2').select2({
            minimumResultsForSearch: -1
        });

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

        _doc.on('keyup','#client-add',() =>{
            _city.val('');
            _lat.val('');
            _long.val('');
        });

        _doc.on('change','#isWeekly',function(){
            if($(this).is(':checked')) {
                _weeklyPlan.show();
            } else {
                _weeklyPlan.hide();
                $('[name="days[]"]').prop('checked', false);
                $("[id$='-from']").attr('disabled','disabled').val('00:00').trigger('change');
                $("[id$='-to']").attr('disabled','disabled').val('00:30').trigger('change');
                $("[id$='-eventCheck']").attr('disabled','disabled').val('').trigger('change');
                $("[id$='-eventCheck2']").attr('disabled','disabled').val('').trigger('change');
            }
        });
        
        $('.colorPicker')
            .colorpicker()
            .on('colorpickerChange colorpickerCreate',(e) => {
                if(e.currentTarget.id == "channelColor") {
                    $('.calendar-sample').css('background-color', e.value);
                } else {
                    $('.calendar-text').css('color', e.value);
                }
            });

        _doc.on('change','[name="days[]"]', function(){
            let dayChosen = $(this).val(),
                fromTime = $('#' + dayChosen + '-from'),
                toTime = $('#' + dayChosen + '-to'),
                public = $('#' + dayChosen + '-eventCheck'),
                private = $('#' + dayChosen + '-eventCheck2');
            if(fromTime.is(':disabled')) {
                fromTime.removeAttr('disabled').val('00:00').trigger('change');
            } else {
                fromTime.attr('disabled','disabled').val('00:00').trigger('change');
            }
            if(toTime.is(':disabled')) {
                toTime.removeAttr('disabled').val('00:30').trigger('change');
            } else {
                toTime.attr('disabled','disabled').val('00:30').trigger('change');
            }
            if(public.is(':disabled')) {
                public.removeAttr('disabled').attr('checked','checked');
            } else {
                public.attr('disabled','disabled').removeAttr('checked');
            }
            if(private.is(':disabled')) {
                private.removeAttr('disabled');
            } else {
                private.attr('disabled','disabled').removeAttr('checked');
            }
            
        });

        _doc.on('change',"[id$='-from']",function(){
            var day = $(this).data('day'),
                time = $(this).val();

            $x = 0;
            $('select#' + day + '-to option').each(function(){
                let thisTime = $(this).text();
                if(thisTime <= time) {
                    $(this).attr('disabled','disabled');
                    $(this).removeAttr('selected');
                } else {
                    $(this).removeAttr('disabled');
                    if($x == 0) {
                        $('select#' + day + '-to').val(thisTime).select2().trigger('change')
                    }
                    $x++;
                }
            })
        });

        console.log(days_plan);

        $.each(days_plan,function(i,e){
            $('select#' + i + '-from').val(days_plan[i].start).trigger('change');
            $('select#' + i + '-to').val(days_plan[i].end).trigger('change');
            $('[name="' + i + '-eventType"][value="' + days_plan[i].event_type + '"]').attr('checked','checked');
        });
    }

    const _delete = {
        init: () => {
            $('.delete-channel').on('click',() => {
                $.confirm({
                    title: 'Are you sure?',
                    content: 'Are you sure you want to delete this client? <br/>This cannot be undone.',
                    buttons: {
                        cancel: {
                            btnClass: 'btn-white',
                            text: 'Cancel',
                            action: () => {
                                // $.alert('Confirmed!');
                            }
                        },
                        confirm: {
                            btnClass: 'btn-danger',
                            text: 'Delete',
                            action: () => {
                                _delete.delete();
                            }
                        }
                    }
                });
            })
        },
        delete: () => {
            $.ajax({
                dataType: "json",
                type: "POST",
                data: { delete: 1 },
                success: (data) => {
                    if(data.r == 'success') {
                        window.location = data.redirect;
                    }
                }
            });
        }
    };

    const _places = {
        init: () =>{

            _autocomplete = new google.maps.places.Autocomplete(
                (document.getElementById('client-add')), {
                // types: ['(cities)'],
                languagasde: 'en',
                componentRestrictions: {country: $('#countryDD').val().toLowerCase()}
            });
            _autocompleteLsr = google.maps.event.addListener(_autocomplete, 'place_changed',() => {

                let place = _autocomplete.getPlace();

                if(place.name != '') {

                    let storableLocation = {};

                    for (let ac = 0; ac < place.address_components.length; ac++) {
                        
                       let component = place.address_components[ac];
                        
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
                    _lat.val(place.geometry.location.lat());
                    _long.val(place.geometry.location.lng());
                }
            });
        }
    };

    const _validate = {
        options: {
            ignore: [],
            errorElement: 'span',
            errorPlacement: function (error, element) {
                // console.log($(element).attr('name'),error);
                if($.inArray($(element).attr('name'),['city','lat','long']) !== -1 ) {
                    if($('.locations-err').length == 0) {
                        $('<span class="error locations-err">Please pick a location from the dropdown</span>').insertBefore($('#address'));
                    }
                } else {
                    error.insertBefore(element);
                }
                return false;
            },
            invalidHandler: function (form, validator) {
                if(!validator.numberOfInvalids()) {
                    return;
                }
            },
            rules: {
                name: "required",
                'client-add': "required",
                description: "required",
                country: "required",
                city: "required",
                lat: "required",
                long: "required",
                phone: "required",
                mainContact: "required",
            }
        },
        init: function () {
            _frm.validate(this.options);
        }
    };

    const _runDaysJson = () =>{
        let array = {};
        $.when(
            $('[name="days[]"]:checked').each(() =>{
                let day = $(this).val(),
                    from = $('#' + day + '-from').val(),
                    to = $('#' + day + '-to').val();

                array[day] = {'from': from, 'to': to };
            })
        ).done(() =>{
            $("#weeklyPlanInput").val(JSON.stringify(array));
        });
    };

    const _submit = {
        options: {
            url: location.href,
            type: 'post',
            dataType: 'json',
            beforeSubmit: function (arr, form, options) {
                _submit.action.buttonOff();
                $('.pgn-wrapper').remove();
                return _frm.valid(); //call the validate plugin
            },
            success: function (d) {
                _submit.action.notify(d.type, d.message);
                _submit.action.buttonOn();
            },
            error: function (d) {
                _submit.action.buttonOn();
            }
        },
        init: function () {
            _frm.ajaxForm(this.options);
        },
        action: {
            buttonOn: function () {
                _btn.removeClass('disabled').removeAttr('disabled');
            },
            buttonOff: function () {
                _btn.addClass('disabled').attr('disabled','disabled');  
            },
            notify: (type, message) => {
                $('body').pgNotification({
                    style: 'flip',
                    message: message,
                    position: 'top-right',
                    timeout: 0,
                    type: type
                }).show(),
                setTimeout(() =>{
                    $('.pgn-wrapper').remove();
                },3000);
            }
        }
    };

    return {
        init: _init()
    };

})();