var LOGIN = (function(){

    var _frm = $('#form-create-recipe'),
        _btn = _frm.find('button[type="submit"]'),
        ingredientsArr = [],
        totalWeight = 0,
        totalPrice = 0,
        totalProfit = 0;

    function _init() {
        _validate.init();
        _submit.init();

        $(document).on('click', '.ingredient-item span.remove', function() {

            var ingId = $(this).parent().data('ing-id'),
                newArr = [];

            $.when(
                $.each(ingredientsArr,function(i,e){
                    if(e.id != ingId) {
                        newArr.push(e);
                    }
                })
            ).done(function() {
                ingredientsArr = newArr;
                if(newArr.length == 0) {
                    $('#ingredientsArray').val('');
                }
            }).then(function(){
                $('[data-ing-id="' + ingId + '"]').remove();
                if(newArr.length > 0) {
                  $('#ingredientsArray').val(JSON.stringify(newArr));
                } else {
                    $('#ingredientsArray').val('');
                }

            });
        });


        $(document).on('click','#add-ingredient', function() {
            //check if ingredient is there already
            var ingredient = $('#ingredient').find(":selected").text()
                ingredientId = $('#ingredient').val()
                ingredientClass = 'ingredient-item m-b-10 block btn btn-info btn-sm btn-notification-style text-left',
                error = false;

            if($('#ingredient-weight').val() == '' || $('#ingredient-weight').val() <= 0) {
                alert('Please enter the proper weight for this recipe!');
                $('#ingredient-weight').val(0)
                error = true;
            }

            $.when(
                $.each(ingredientsArr,function(i,e) {
                    if(e.id == ingredientId) {
                        alert('Sorry this ingredient is already there!');
                        error = true;
                    }

                })
            ).done(function() {
                if(!error) {

                    ingredientsArr.push({
                        'id': ingredientId
                    });

                    console.log(ingredientsArr);

                    $('#ingredient-holder')
                    .append('<a style="margin-bottom:10px!important; padding-top: 10px;" ' +
                        'class="' + ingredientClass + '" data-ing-value="' + ingredient + '"  data-ing-id="' + ingredientId + '">' + 
                        '<strong class="text-white">' + ingredient + '</strong><br/>' +
                        '<span class="remove text-white" style="position:absolute; top:0; right:5px;">x</span></a>');

                    $('#ingredientsArray').val(JSON.stringify(ingredientsArr));
                }
                _frm.valid()
            })
        });
    }

    var _validate = {
        options: {
            ignore: [],
            errorElement: 'span',
            errorPlacement: function(error, element) {
                if(error.length > 0) {
                    if($(element).attr('name') == 'ingredientsArray') {
                        error.insertBefore($('#ingredient'));
                    } else {
                        error.insertBefore(element);
                    }
                }
                return false;
            },
            invalidHandler: function(form, validator) {
                if(!validator.numberOfInvalids()) {
                    return;
                }
            },
            rules: {
                ingredientsArray: "required",
                name: "required",
                category: "required",
                description: "required"
            },
            messages: {
                ingredientsArray: {
                    required: "Please enter at least one ingredient"
                }
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
                $('.page-content-wrapper').pgNotification({
                    style: 'flip',
                    message: message,
                    position: 'top-right',
                    timeout: 0,
                    type: type
                }).show();
            }
        }
    };

    return {
        init: _init()
    };
})();