var LOGIN = (function(){

    var _frm = $('#form-create-ingredient'),
        _btn = _frm.find('button[type="submit"]'),
        ingredientsArr = [],
        totalWeight = 0,
        totalPrice = 0,
        totalExpense = 0,
        totalProfit = 0;

    function _init() {

        _validate.init();
        _submit.init();

        $('.select-2').select2({
            minimumResultsForSearch: -1
        });

        $(document).on('change', '#price', function() {
            _updateCalculations();
        });

        $(document).on('change','input[name^="price_"]',function() {
            _updateCalculations();
        });
    };

    var _updateCalculations = function() {

        var totalWeight  = 0,
            totalExpense = 0,
            productPrice = $('#price').val() == '' ? 0 : $('#price').val(),
            totalProfit = 0;

        if(productPrice == '' || productPrice < 0 || productPrice.match("^0")) {
            $('#price').val(1);
        }

        $('input[name^="price_"]').each(function(i,e) {

            var th = $(this);

            if(th.val() == '' || th.val() < 0 || th.val().match("^0")) {
                th.val(1);
            }

            var priceOfIng  = th.data('ppw'),
                priceOfIng  = parseFloat(priceOfIng).toFixed(2),
                weightOfIng = th.val(),
                weightOfIng = weightOfIng == '' ? 0 : parseFloat(weightOfIng);

            totalExpense = totalExpense + (weightOfIng * priceOfIng);
            totalWeight  = totalWeight + weightOfIng;
        });

        totalProfit = parseFloat(productPrice) - totalExpense;

        $('#expense span.label').text('$' + parseFloat(totalExpense).toFixed(2)),
        $('#weight span.label').text(parseFloat(totalWeight) + 'g'),
        $('#profit span').text('$' + parseFloat(totalProfit).toFixed(2));
    }

    var _validate = {
        options: {
            ignore: [],
            errorElement: 'span',
            errorPlacement: function(error, element) {
                console.log(error);
                if(error.length > 0) {
                    if($(element).attr('name') == 'ingredientsArray') {
                        alert('Please add some ingredients');
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
                price: {
                    required: true,
                    number: true,
                    min: 1
                },
                'loss_variable': {
                    required: true,
                    number: true,
                    min: 0,
                    max: 100
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
                // _submit.action.buttonOff(),
                // $('.alert.form-notification').remove();
                return _frm.valid(); //call the validate plugin
            },
            success: function(d) {
                if(d.r == "fail") {
                    _submit.action.notify(d.type, d.message);
                    _submit.action.buttonOn();
                } else if(d.r == "success") {
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