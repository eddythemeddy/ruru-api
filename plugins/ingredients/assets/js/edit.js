var LOGIN = (function(){

    var _frm = $('#form-ingredient'),
        _btn = _frm.find('button[type="submit"]'),
        _frmModal = $('#form-modal-ingredient'),
        _btnModal = _frm.find('button[type="submit"]'),
        _tableOverlay = $('.table-overlay'),
        _varTables = $('#ingredient-variations'),
        _modal = $('#modalSlideUp'),
        _modalShopInput = $('#shop'),
        _modalBrandInput = $('#brand'),
        _modalPackageInput = $('#package'),
        _modalWeightInput = $('#weight'),
        _modalPriceInput = $('#price'),
        _modalPPGInput = $('#ppg-modal'),
        _modalVariationIdInput = $('#variation-id'),
        _openVariation = $('.open-variation');

    function _init() {

        $('.select2').each(function(e){
            $(this).select2({
                minimumResultsForSearch: -1
            });
        });

        _modalVariationIdInput.val('');

        _validate.init();
        _submit.init();
        _delete.init();
        _loadVariations.init();
    }

    const _loadVariations = {
        call: () => {
            $.ajax({
                dataType: "json",
                type: "POST",
                data: { loadVariations: 1 },
                beforeSubmit: () => {
                    _tableOverlay.show();
                },
                success: (data) => {
                    setTimeout(() => {
                        _tableOverlay.hide();
                        _varTables.find('tbody').append(_loadVariations.build(data));
                    },700);
                }
            });
        },
        init: () => {
            $.when(
                _varTables.find('tbody').html('')
            ).done(function(){
                _loadVariations.call();
            });
        },
        build: (data) => {

            let html = '';

            $.each(data, function(i,e) {
                html += '<tr>';
                html += '<td class="text-left"><a href="#" class="open-variation" data-id="' + e.id + '">' + e.store_name + ' - ' + e.brand_name + '/' + e.container_type + '</a></td>';
                html += '<td class="text-left">' + e.container_weight + ' gms</td>';
                html += '<td class="text-left">$' + parseFloat(e.price).toFixed(2) + '</td>';
                html += '<td class="text-left">$' + parseFloat(e.price_per_gram).toFixed(4) + '</td>';
                html += '</tr>';
            });

            return html;
        }
    }

    var _delete = {
        init: () => {
            $('.delete-ingredient').on('click', () => {
                $.confirm({
                    title: 'Are you sure?',
                    content: 'Are you sure you want to delete this ingredient? <br/>This cannot be undone.',
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
    }

    $('#btnToggleSlideUpSize').click(function() {
         _modal.modal('show');
        _frmModal.find('button').text('Add Variation');
    });

    $(document).on('show.bs.modal','#modalSlideUp', function () {
        _validate2.init();
        _submit2.init();
    });

    $(document).on('hidden.bs.modal','#modalSlideUp', function () {
        _frmModal[0].reset(),
        _modalPPGInput.html('$0.00');
        _modalVariationIdInput.val('')
    });

    $(document).on('click','.open-variation', function () {
        let id = $(this).data('id');
        _frmModal.find('button').text('Save Variation');
        $.when(
            _modalVariationIdInput.val($(this).attr('data-id'))
        ).then(() => {
            _loadSingle.init(id);
        }).done(() => {
            _modal.modal('show');
        })
    });

    const _loadSingle = {
        init: function(id) {            
            $.ajax({
                dataType: "json",
                type: "POST",
                data: { loadSingleVariation: id },
                beforeSubmit: () => {

                },
                success: (data) => {
                    _loadSingle.loadForm(data);
                }
            });
        },
        loadForm: (data) => {
            $.when(
                _modalShopInput.val(data.store_name),
                _modalBrandInput.val(data.brand_name),
                _modalPackageInput.val(data.container_type),
                _modalWeightInput.val(data.container_weight),
                _modalPriceInput.val(data.price)
            ).done(function(){
                _calculatePricePergram();
            })
        }
    }

    var _validate = {
        options: {
            ignore: [],
            errorElement: 'span',
            errorPlacement:(error, element) => {
                if(error.length > 0) {
                    error.insertBefore(element);
                }
                return false;
            },
            invalidHandler:(form, validator) => {
                if(!validator.numberOfInvalids()) {
                    return;
                }
            },
            rules: {
                name: "required",
                description: "required",
                categories: "required",
                ppg: {
                    required: "required",
                    number: true
                }
            }
        },
        init: () => {
            _frm.validate(this.options);
        }
    };

    var _submit = {
        options: {
            url: location.href,
            type: 'post',
            dataType: 'json',
            beforeSubmit: (arr, form, options) => {
                _submit.action.buttonOff(),
                $('.pgn-wrapper').remove();
                return _frm.valid(); //call the validate plugin
            },
            success: (d) => {
                _submit.action.notify(d.type, d.message);
                _submit.action.buttonOn();
            },
            error: (d) => {
                _submit.action.buttonOn();
            }
        },
        init: function() {
            _frm.ajaxForm(this.options);
        },
        action: {
            buttonOn: ()=> {
                _btn.removeClass('disabled').removeAttr('disabled');
            },
            buttonOff: ()=> {
                _btn.addClass('disabled').attr('disabled','disabled');  
            },
            notify: (type, message)=> {
                $('body').pgNotification({
                    style: 'flip',
                    message: message,
                    position: 'top-right',
                    timeout: 0,
                    type: type
                }).show(),
                setTimeout(()=> {
                    $('.pgn-wrapper').remove();
                },3000);
            }
        }
    };

    $(document).on('change keyup','#weight, #price', function() {
        _calculatePricePergram();
    });

    const _calculatePricePergram = () => {

        let weight = _modalWeightInput.val(),
            price = _modalPriceInput.val();

            weight = parseFloat(weight),
            price = parseFloat(price),
            _modalWeightInput.val(weight),
            _modalPriceInput.val(price);

        let pricePerGram = price/weight;

        _modalPPGInput.html('$' + pricePerGram);
    }

    var _validate2 = {
        options: {
            ignore: [],
            errorElement: 'span',
            errorPlacement:(error, element) => {
                if(error.length > 0) {
                    error.insertBefore(element);
                }
                return false;
            },
            invalidHandler:(form, validator) => {
                if(!validator.numberOfInvalids()) {
                    return;
                }
            },
            rules: {
                shop: "required",
                brand: "required",
                package: "required",
                weight: {
                    required: true,
                    number: true,
                    min: 1
                },
                weight: {
                    required: true,
                    number: true,
                    min: 1
                }
            }
        },
        init: function () {
            _frmModal.validate(this.options);
        }
    };

    var _submit2 = {
        options: {
            url: location.href,
            type: 'post',
            dataType: 'json',
            beforeSubmit: function (arr, form, options) {
                _submit2.action.buttonOff(),
                _frmModal.find('.alert').remove();
                return _frmModal.valid(); //call the validate plugin
            },
            success: function(d) {
                if(d.type == 'success') {
                    _modal.modal('hide'),
                    _loadVariations.init();
                    return false;
                }
                _submit2.action.notify(d.type, d.message);
                _submit2.action.buttonOn();
            },
            error: function(d) {
                _submit2.action.buttonOn();
            }
        },
        init: function() {
            _frmModal.ajaxForm(this.options);
        },
        action: {
            buttonOn: function () {
                _btnModal.removeClass('disabled').removeAttr('disabled');
            },
            buttonOff: function () {
                _btnModal.addClass('disabled').attr('disabled','disabled');  
            },
            notify: function (type, message) {
                let html = '<div class="alert alert-' + type + '" role="alert">' + message + '</div>';
                
                _frmModal.prepend(html);
                setTimeout(()=> {
                    _frmModal.find('.alert').remove();
                },3000);
            }
        }
    };

    return {
        init: _init()
    };
})();