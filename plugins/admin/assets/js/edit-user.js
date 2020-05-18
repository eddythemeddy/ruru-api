(function(){

	var _frmChangePass = $('#form-change-password'),
        _btn = _frmChangePass.find('button[type="submit"]'),
        _frmUser = $('#form-save-user'),
        _btnUser = _frmUser.find('button[type="submit"]'),
        _doc = $(document);

	var _init = () => {

        _validate.init();
        _submit.init();
        _validatePass.init();
        _submitPass.init();
    }


	_doc.on('change','.user-status',function(){
		
		let active = 0;

		if($(this).prop("checked") == true){
			active = 1;
		}

		$.ajax({
            dataType: "json",
            type: "POST",
            data: {
                updateUserStatus: true,
                status: active 
            },
            beforeSend: function() {
            	$('.pgn-wrapper').remove();
            },
            success: function(data) {
            	if(data.r == 'danger') {
            		if(active == 0) {
            			$('.user-status').prop('checked', true);
            		} else {
            			$('.user-status').prop('checked', false);
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
                _submit.action.notify(d.type, d.message);
                _submit.action.buttonOn();
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

	var _validatePass = {
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
                password: {
                    required: true,
                    minlength: 5,
                    // passwd: "(/^(?=.*[a-z])[A-Za-z0-9\d=!\-@._*]+$/)"
                },
                passwordConf: {
                    required: true,
                    equalTo: "#password"
                }
            },
            messages: {
                password: {
                    minlength: "Your password must be at least 5 characters",
                    // passwd: "At least 1 number, 1 upper and 1 lowercase character"
                },
                passwordConf: {
                    required: "Please re enter your password",
                    equalTo: "Your passwords do not match",
                    // passwd: "At least 1 number, 1 upper and 1 lowercase character"
                }
            },
        },
        init: function(){
            _frmChangePass.validate(this.options);
        }
    };

    var _submitPass = {        
        init: function(){
            _frmChangePass.ajaxForm(this.options);
        },
        options: {
            url: location.href,
            type: 'POST',
            dataType: 'json',
            beforeSubmit: function(arr, form, options){
                _submitPass.action.buttonOff(),
                $("#passConf").focusout();
                return _frmChangePass.valid(); //call the validate plugin
            },
            success: function(d) {
	            _submitPass.action.notify(d.type, d.message);
	            _submitPass.action.buttonOn();
	            _frmChangePass[0].reset();
            },
            error: function(d){
                _submitPass.action.buttonOn();
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