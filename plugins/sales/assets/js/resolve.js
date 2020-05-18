(function() {

	let _events = {},
		_doc = $(document),
		_recipesTable = $('#forecast-recipes'),
		_modal = $('#invoice-payment-modal'),
		_transactionTable = $('#transactionsTable'),
		_frm = $('#form-modal-transaction'),
        _btn = _frm.find('button[type="submit"]'),
        _dateInput = $('#date-of-payment');

	const _init = () => {
		_events.caculateAmount.init();
		_dateInput.datepicker();
		_doc.on('keyup','.unique-total-amount-actual',function(){
			let th = $(this);
			$.when(
				makeSureValidAmt(th)
			).done(function(){
				_events.caculateAmount.pop(th, 1);
			});
		});

		_doc.on('click', '#close-sale-public', function() {
			let th = $(this),
				cols = $('.actual-th,.actual-td'),
				total = $('#net-total').html(),
				totalActual = $('#net-total-actual').html();
				winPercentage = $('#goal-actual').html(),
				html = parseFloat(totalActual) < parseFloat(total) ? 
					'You have only sold <strong>' + winPercentage + '%</strong> of your target. Do you still want to resolve this sale?' : 
					'Great! You sold <strong>' + winPercentage + '%</strong> of your target';

			$.confirm({
			    title: 'Resolve this Sale?',
			    content: html,
			    buttons: {
			        cancel: {
			        	btnClass: 'btn-primary',
			        	text: 'Yes',
			        	action: () => {
							_events.caculateAmount.save();
				        }
			        },
			        confirm: {
			        	btnClass: 'btn-danger',
			        	text: 'No',
			        	action: () => {
			        	}
				    }
			    }
			});
		});

		_doc.on('click', '#close-sale-private', function() {
			_modal.modal('show');
		});

		_doc.on('change', '#input-recipe', function() {
			_events.recipes.addSubRecipe($(this));
		})

		_doc.on('click', '#close-sale', function() {
			_closeSale();
		})
	}

	const _loadTransactions = {
		load: () => {
			$.ajax({
	            dataType: "json",
	            type: "POST",
	            data: {
	            	loadTransactions: 1
	            },
	            beforeSend: () => {
	            },
	            success: (d) => {
	            	_loadTransactions.build(d)
	            	_transactionTable.removeClass('loading');
	            },
	            error: () => {
	            	_transactionTable.removeClass('loading');
	            }
	        });
		},
		build: (data) => {
			$.when(
            	_transactionTable.addClass('loading'),
            	_transactionTable.find('tbody').html('')
	        ).done(function(){
	        	$.each(data.transactions,function(i,e){
	        		_transactionTable.find('tbody').append(
	        			'<tr>' +
	        				'<td>' + e.date + '</td>' +
	        				'<td>' + e.reference + '</td>' +
                            '<td>' + e.method + '</td>' +
	        				'<td>' + e.name + '</td>' +
	        			'</tr>'
	        		);
	        	})
	        }).then(function(){
	        	_transactionTable.removeClass('loading');
	        })
		}
	};

    $(document).on('show.bs.modal','#invoice-payment-modal', function () {
        $.when(
        	_loadTransactions.load()
        ).done(function() {
	        _validate.init();
	        _submit.init();
        })
    });

    const _validate = {
        options: {
            ignore: [],
            errorElement: 'span',
            errorPlacement: (error, element) => {
                if(error.length > 0) {
                    error.insertBefore(element);
                }
                return false;
            },
            invalidHandler: (form, validator) => {
                if(!validator.numberOfInvalids()) {
                    return;
                }
            },
            rules: {
                'date-of-payment': {
                	required: true,
                    regex : /^(\d{1,2})(\/|-)(\d{1,2})(\/|-)(\d{4})$/
                },
                'transaction-reference': {
                    required: true
                },
                'method': {
                    required: true
                }
            }
        },
        init: function() {
        	$.validator.addMethod(
		        "regex",
		        function(value, element, regexp) {
		            var re = new RegExp(regexp);
		            return this.optional(element) || re.test(value);
		        },
		        "Please check your input."
			);
            _frm.validate(this.options);
        }
    };

    const _submit = {
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
            	_frm[0].reset();
            	if(d.r == 'success') {
            		location.reload();
            	} else {
	                $('body').pgNotification({
	                    style: 'flip',
	                    message: d.message,
	                    position: 'top-right',
	                    timeout: 0,
	                    type: d.type
	                }).show(),
	                setTimeout(() =>{
	                    $('.pgn-wrapper').remove();
	                },3000);
            	}
            },
            error: (d) => {
                _submit.action.buttonOn();
            },
            always: () => {
            	_frm[0].reset();
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

	const makeSureValidAmt = (th) => {
		let amtval = th.val();
		if(th.hasClass('unique-total-amount-actual')) {
			th.val(amtval < 0 ? 0 : amtval);
		} else {
			th.val(amtval <= 0 ? 1 : amtval);
		}
	};

	_events.caculateAmount = {
		init: function() {
			_doc.on('click','.amount-actual', function() {
				_events.caculateAmount.pop($(this));
			})
		},
		pop: function(th, keyup = false){
			$.when(
				_events.caculateAmount.run(th,keyup)
			).done(function(){
				_events.caculateAmount.net();
			});
		},
		run: function(th, keyup = false){ 
			let tr = th.closest('tr'),
				actual = th.hasClass('amount-actual') || th.hasClass('unique-total-amount-actual') ? true : null,
				subRecipeId = tr.data('sub-recipe-id'),
				subPrice = tr.data('sub-recipe-price'),
				forRecId = tr.data('forecast-recipe-id'),
				amt = tr.find('.unique-total-amount-actual'),
				amtval = parseInt(amt.val()),
				newAmt = null,
				netPrice = tr.find('.net-price-actual');
			if(keyup == false) {
				if(th.hasClass('minus')) {
					if(actual) {
						newAmt = (amtval - 1) <= 0 ? 0 : (amtval - 1);
					} else {
						newAmt = (amtval - 1) === 0 ? 1 : (amtval - 1);
					}
				} else {
					newAmt = amtval + 1;
				}
			} else {
				newAmt = amtval;
			}

			amt.val(newAmt),
			netPrice.html(_commas((newAmt * parseFloat(subPrice)).toFixed(2)));
		},
		save: function() {
			let obj = [];

			$.when(
				_recipesTable.find('tbody tr').each(function() {
					let tr = $(this),
						forRecId = tr.data('forecast-recipe-id'),
						subRecipeId = tr.data('sub-recipe-id'),
						amt = tr.find('.unique-total-amount-actual').val();

					obj.push({'forRecId': parseFloat(forRecId), 'subRecipeId': parseFloat(subRecipeId), 'amt': parseFloat(amt)});
				})
			).done(function(){

				$.ajax({
	                dataType: "json",
	                type: "POST",
	                data: { 
	                    udpateForecastSubRecipe: 1,
	                    data: JSON.stringify(obj)
	                },
	                success: (d) => {
	                	if(d.r == 'success') {
	                		location.reload();
	                	} else {
			                $('body').pgNotification({
			                    style: 'flip',
			                    message: d.message,
			                    position: 'top-right',
			                    timeout: 0,
			                    type: d.type
			                }).show(),
			                setTimeout(() =>{
			                    $('.pgn-wrapper').remove();
			                },3000);
	                	}
	                },
	                error: () => {
	                }
	            });
			})

		},
		net: function(){
			let net = 0,
				netActual = 0;

			$('tr[data-sub-recipe-id]').each(function(){
				let th = $(this),	
					amt = th.find('.unique-total-amount').html(),
					price = th.data('sub-recipe-price'),
					netTotal = parseFloat(price) * parseFloat(amt),
					amtActual = th.find('.unique-total-amount-actual').val(),
					netTotalActual = parseFloat(price) * parseFloat(amtActual);

				net = netTotal + net;
				netActual = netTotalActual + netActual;
			});
			$('#net-total').text(_commas(net.toFixed(2)));
			$('#net-total-actual').text(_commas(netActual.toFixed(2)));
			$('#goal-actual').text(((netActual/net) * 100).toFixed(2));
		}
	};

	const _closeSale = function(){
		$.confirm({
		    title: 'Close Sale',
		    content: 'By closing this sale, you have fully chosen how much you have actually sold' +
		    		' and how much you forecasted to sell. <br/><br/>Are you happy with your results so far?',
		    buttons: {
		        cancel: {
		        	btnClass: 'btn-primary',
		        	text: 'Yes Close',
		        	action: () => {
						_events.recipes.delete(forecastRecipeId);
			        }
		        },
		        confirm: {
		        	btnClass: 'btn-danger',
		        	text: 'No',
		        	action: () => {
		        	}
			    }
		    }
		});
	}

	const _commas = function(num) {
		return num.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
	}

	return {
		init: _init()
	}
})();