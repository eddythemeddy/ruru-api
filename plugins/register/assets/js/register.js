var REGISTER = (function(){

    var _frm = $('#register-form'),
        _btn = _frm.find('button[type="submit"]');

    function _init(){

        $("select").select2({
            minimumResultsForSearch: -1,
            dropdownAutoWidth: 'true',
            width: '100%'
        });

        _validate.init();
        _submit.init();

        $(document).on('change','#user-type',function(i,e){
            if($('#user-type').val() === 'intermediary') {
                $('.intermediary-types').removeClass('hidden');
            } else {
                $('.intermediary-types').addClass('hidden');
            }
        });
    }

    var _validate = {
        options: {
            ignore: [],
            errorElement: 'span',
            errorPlacement: function(error, element) {              
                if (element.attr("name") == "long" || element.attr("name") == "lat" ) {
                    if(!$("#locality-error2").length) {
                        var a = $('<span id="locality-error2" class="error" style="">Must be chosen from list</span>');
                        a.insertBefore($("#locality"));
                    }
                } else {
                    error.insertBefore(element);
                }
            },
            invalidHandler: function(form, validator) {

                if(!validator.numberOfInvalids()){
                    return;
                }
            },
            rules: {
                fname: {
                    required: true,
                    minlength: 3
                },
                lname: {
                    required: true,
                    minlength: 3
                },
                type: {
                    required: true
                },
                'user-type': {
                    required: function(element){
                        return $('#user-type').val() == 'intermediary';
                    }
                },
                email: {
                    email: true,
                    required: true,
                    remote: {
                        url: location.href,
                        type: "post",
                        data: {
                            checkemail: function() {
                                return $( "#email" ).val();
                            }
                        }
                    }
                },
                username: {
                    required: true,
                    alphanumeric: true,
                    remote: {
                        url: location.href,
                        type: "post",
                        data: {
                            checkusername: function() {
                                return $( "#username" ).val();
                            }
                        }
                    }
                },                
                password: {
                    required: true,
                    minlength: 5,
                    // passwd: "(/^(?=.*[a-z])[A-Za-z0-9\d=!\-@._*]+$/)"
                },
                password_confirm: {
                    required: true,
                    equalTo: "#password"
                }
            },
            messages: {
                username: {
                    remote: jQuery.validator.format("Sorry, \"{0}\" is already taken.")
                },
                email: {
                    remote: "Sorry this email is already in use!"
                },
                dob: {
                    required: "Date must be in dd/mm/yyyy",
                    dateITA: "Invalid Date"
                },
                password: {
                    minlength: " Your password must be at least 5 characters",
                    // passwd: "At least 1 number, 1 upper and 1 lowercase character"
                },
                password_confirm: {
                    required: "Please re enter your password",
                    equalTo: " Your passwords do not match",
                    // passwd: "At least 1 number, 1 upper and 1 lowercase character"
                }
            },
        },
        init: function(){
            _frm.validate(this.options);
        }
    };

    var _submit = {
        
        init: function(){
            _frm.ajaxForm(this.options);
        },
        options: {
            url: location.href,
            type: 'POST',
            dataType: 'json',
            beforeSubmit: function(arr, form, options){
                _submit.action.buttonOff();
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
            error: function(d){
                _submit.action.buttonOn();
            }
        },
        action: {
            buttonOn: function(){
                _btn.removeClass('disabled').removeAttr('disabled');
            },
            buttonOff: function(){
                _btn.addClass('disabled').attr('disabled','disabled');  
            },
            notify: function(type, message) {
                _frm.prepend(
                    '<div class="alert alert-' + type + ' form-notification" role="alert">' +
                    '<button class="close" data-dismiss="alert"></button>' + message 
                ),
                setTimeout(function(){
                    $('.alert.form-notification').remove();
                },3000);
            }
        }
    }

    return {
        init: _init()
    }
})();