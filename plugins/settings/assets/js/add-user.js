(function(){

	var _frmUser = $('#form-add-user'),
        _btnUser = _frmUser.find('button[type="submit"]');

	var _init = () => {

        _validate.init();
        _submit.init();
    }

    var _validate = {
        options: {
            ignore: [],
            errorElement: 'span',
            errorPlacement: function(error, element) {
            	error.insertBefore(element);
            },
            invalidHandler: function(form, validator) {

                if(!validator.numberOfInvalids()){
                    return;
                }
            },
            rules: {
                firstname: {
                    required: true,
                    minlength: 3
                },            
                password: {
                    required: true,
                    minlength: 5,
                    // passwd: "(/^(?=.*[a-z])[A-Za-z0-9\d=!\-@._*]+$/)"
                },
                lastname: {
                    required: true,
                    minlength: 3
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
                }
            },
            messages: {
                password: {
                    minlength: "Your password must be at least 5 characters",
                    // passwd: "At least 1 number, 1 upper and 1 lowercase character"
                },
                username: {
                    remote: jQuery.validator.format("Sorry, \"{0}\" is already taken.")
                },
                email: {
                    remote: "Sorry this email is already in use!"
                }
            },
        },
        init: function(){
            _frmUser.validate(this.options);
        }
    };

    var _submit = {
        
        init: function(){
            _frmUser.ajaxForm(this.options);
        },
        options: {
            url: location.href,
            type: 'POST',
            dataType: 'json',
            beforeSubmit: function(arr, form, options){
                _submit.action.buttonOff();
                return _frmUser.valid(); //call the validate plugin
            },
            success: function(d) {
                if(d.r == 'success') {
                    window.location.href = d.link;
                } else {
                    _submit.action.notify(d.type, d.message);
                    _submit.action.buttonOn();
                }
            },
            error: function(d){
                _submit.action.buttonOn();
            }
        },
        action: {
            buttonOn: function(){
                _btnUser.removeClass('disabled').removeAttr('disabled');
            },
            buttonOff: function(){
                _btnUser.addClass('disabled').attr('disabled','disabled');  
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