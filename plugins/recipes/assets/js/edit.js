var LOGIN = (function(){

    var _frm = $('#form-create-recipe'),
        _btn = _frm.find('button[type="submit"]');

    function _init() {
        _validate.init();
        _submit.init();
        _delete.init();

        $(document).on('click', '.ingredient-item span.remove', function() {

            var ingId = $(this).parent().data('ing-id'),
                newArr = [];

            $.when(
                $.each(ingredientsArr,function(i,e){
                    if(e.id != ingId) {
                        // ingredientsArr.splice(i);
                        newArr.push(e);
                    }
                })
            ).done(function(){
                ingredientsArr = newArr;
                if(newArr.length == 0) {
                    $('#ingredientsArray').val('');
                }
            }).then(function(){
                $('[data-ing-id="' + ingId + '"]').parent().remove();
                if(newArr.length > 0) {
                  $('#ingredientsArray').val(JSON.stringify(newArr));
                } else {
                    $('#ingredientsArray').val('');
                }

            });
        });

        $(document).on('click','#add-ingredient', function() {
            //check if ingredient is there already
            var ingredient = $('#ingredient').find(":selected").text(),
                ingredientId = $('#ingredient').val(),
                ingredientClass = '',
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

                    $('#ingredient-holder')
                    .append('<div class="block full-width p-t-5 p-b-5" style="height: 40px; border-top: 1px dotted #CCC;">'+
                        '<a style="margin-bottom:10px!important; padding-top: 10px;" ' +
                        'class="full-width ingredient-item font-montserrat fs-12 inline-block" data-ing-value="' + ingredient + '"  data-ing-id="' + ingredientId + '">' + 
                        '<strong class="pull-left">' + ingredient + '</strong>' +
                        '<span class="remove pull-right fs-12 p-l-10 p-r-5 inline-block">' +
                            '<i class="flaticon flaticon-round-minus"></i>' +
                        '</span>'+
                        '</a></div>');

                    $('#ingredientsArray').val(JSON.stringify(ingredientsArr));
                }
                _frm.valid()
            })
        });
    }

    var _delete = {
        init: function() {
            $('.delete-recipe').on('click',function(){
                var r = confirm("Are you sure you want to delete this ingredient? \nThis cannot be undone.");
                if (r == true) {
                    _delete.delete();
                }
            })
        },
        delete: function() {            
            $.ajax({
                dataType: "json",
                type: "POST",
                data: { delete: 1 },
                success: function(data) {
                    if(data.r == 'success') {
                        window.location = data.redirect;
                    }
                }
            });
        }
    };

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
                _submit.action.notify(d.type, d.message);
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
                }).show();
            }
        }
    };

    return {
        init: _init()
    };
})();