(function($) {
    'use strict';

    var emailList    = $('[data-email="list"] ul'),
        emailOpened  = $('[data-email="opened"]'),
        _screenWidth = $(window).width(),
        _frm         = $('#form-mail'),
        _btn         = _frm.find('#send-mail'),
        _events      = {};

    function _init() {
        _loadMessages(),
        _sizeUpInbox(),
        _validate.init(),
        _events.menu(),
        _submit.init();
    }

    _events = {
        menu: function() {
            $('[data-mail-menu]').on('click',function(){
                var page = $(this).data('mail-menu');

                $('[data-mail-menu]').parent().removeClass('active');
                $(this).parent().addClass('active');

                $.when(
                    emailList.find('li').remove(),
                ).done(function(){
                    _loadMessages(page);
                    if($('.email-composer').is(":visible")) {
                        $.when(
                            $('.email-composer').hide(),
                            $('#form-mail')[0].reset()
                        ).done(function(){
                            $('.split-view').show();
                        });
                    }
                });
            })
        }
    }

    var _validate = {
        options: {
            ignore: [],
            errorElement: 'span',
            errorPlacement: function(error, element) {
                var el = element[0].attributes.name.nodeValue;
                if(error.length > 0) {
                    if(el != "to_id") {
                        element.closest('.form-group').addClass('has-error');
                    } else {
                        alert('Please pick a name from the suggestions');
                    }
                }
                return false;
            },
            invalidHandler: function(form, validator) {

                if(!validator.numberOfInvalids()){
                    return;
                }
            },
            rules: {
                "to_id": "required",
                "to": "required",
                "subject": "required",
                "body": "required"
            }
        },
        init: function(){
            _frm.validate(this.options);
        }
    };

    var _submit = {
        options: {
            url: location.href,
            type: 'post',
            dataType: 'json',
            beforeSubmit: function(arr, form, options){
                return _frm.valid(); //call the validate plugin
            },
            success: function(d) {
                if(d.r == "success") {
                    $.when(
                        $('.email-composer').hide(),
                        $('#form-mail')[0].reset()
                    ).done(function(){
                        $('.split-view').show();
                    });
                } else {
                    window.location = d.redirect;
                }
            },
            error: function(d){
                // _submit.action.buttonOn();
            }
        },
        init: function(){
            _frm.ajaxForm(this.options);
        }
    };

    $(window).resize(function(){
        _sizeUpInbox();
        _screenWidth = $(window).width();
    });

    $('#mark-email').click(function() {
        $('.item .checkbox').toggle();
    });

    $('#send-mail').click(function() {
        $('.email-composer .form-group-default').removeClass('has-error');
        var valid = null;

        if($('.email-body').val() == '') {
            // console.log($)
        }
    });

    var _sizeUpInbox = function(){
        var height = $('.split-view').height() - 1;

        $('.split-list,.split-details').height(height);
    };

    // Load list of emails
    var _loadMessages = function(page = 'inbox'){
    	$.ajax({
	        dataType: "json",
            type: "POST",
            data: { loadMessages: page },
	        success: function(data) {
                $.each(data, function(o,i) {
                    var $this = i;
                    var id = $this.id;
                    var dp = page == 'inbox' ? $this.fromPic : $this.fromPic;
                    var to = page == 'inbox' ? $this.fromName : "To: " + $this.toName;
                    var subject = $this.subject;
                    var body = $this.message.replace(/<(?:.|\n)*?>/gm, '');
                    var time = $this.msgtime;
                    var li = '<li class="item padding-15" data-email-id="' + id + '"> \
                                <div class="thumbnail-wrapper d32 circular"> \
                                    <img width="40" height="40" alt="" data-src-retina="' + dp + '" data-src="' + dp + '" src="' + dp + '"> \
                                </div> \
                                <div class="checkbox  no-margin p-l-10"> \
                                    <input type="checkbox" value="1" id="emailcheckbox-' + i + '"> \
                                    <label for="emailcheckbox-' + i + '"></label> \
                                </div> \
                                <div class="inline m-l-15"> \
                                    <p class="recipients no-margin hint-text small">' + to + '</p> \
                                    <p class="subject no-margin">' + subject + '</p> \
                                    <p class="body no-margin"> \
                                     ' + body + ' \
                                    </p> \
                                </div> \
                                <div class="datetime">' + time + '</div> \
                                <div class="clearfix"></div> \
                            </li>';
                    emailList.append(li);
                });

	        }
	    });
    }

    function nl2br (str, is_xhtml) {   
        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
    }

    $('body').on('click', '.item .checkbox', function(e) {
        e.stopPropagation();
    });

    $('body').on('click', '.item', function(e) {
        e.stopPropagation();

        var id = $(this).attr('data-email-id'),
            email = null,
            timezonedDate = null,
            thumbnailWrapper = $(this).find('.thumbnail-wrapper');
    
        $.ajax({
            dataType: "json",
            type: "POST",
            data: { loadMessage: id },
            success: function(data) {

                email = data;

                var stillUtc = moment.utc(email.msgtime).toDate();
                var local = moment(stillUtc).local().format('MMM d, Y, H:mm A');

                emailOpened.find('.sender .name').text(email.name);
                emailOpened.find('.sender .datetime').text(local);
                emailOpened.find('.subject').text(email.subject);
                emailOpened.find('.email-content-body').html(email.body);

                var thumbnailClasses = thumbnailWrapper.attr('class').replace('d32', 'd48');
                emailOpened.find('.thumbnail-wrapper').html(thumbnailWrapper.html()).attr('class', thumbnailClasses);

                $('.no-result').hide();
                $('.actions-dropdown').toggle();
                $('.actions, .email-content-wrapper').show();
                if (_screenWidth <= 979) {
                    $('.split-list').toggleClass('slideLeft');
                }

                $(".email-content-wrapper").scrollTop(0);

                // Initialize email action menu 
                $('.menuclipper').menuclipper({
                    bufferWidth: 50
                });

                $('.email-reply').remove();
                $.each(email.child, function(i,v) {
                    $('.email-content').append(
                        '<div class="email-reply p-t-20 p-b-10"><div class="email-content-header">\
                          <div class="thumbnail-wrapper d48 circular">\
                            <img width="40" height="40" alt="" data-src-retina="' + v.pic + '" data-src="' + v.pic + '" src="' + v.pic + '">\
                          </div>\
                          <div class="sender inline-block">\
                            <p class="name no-margin bold">' + v.friend + '\
                            </p>\
                            <p class="datetime no-margin">'+ v.msgTime + '</p>\
                          </div>\
                         <div class="subject semi-bold"></div>\
                        </div>\
                        <div class="hr"></div>\
                        <div class="email-content-body p-t-20">' + v.message + '</div></div>'
                    );
                });
            }
        });

        $('.item').removeClass('active');
        $(this).addClass('active');

    });

    // anytime someone types on the to input, clear the id so that only
    // the item selected from the autocomplete is what is used
    $('[name="to"]').on('keydown', function() {
        $('#to_id').val('');
    }).on('focusout', function() {
        if($('#to_id').val() == '') {
            $('[name="to"]').val('');
        }
    });

    // Toggle email sidebar on mobile view
    $('.toggle-secondary-sidebar').click(function(e) {
        e.stopPropagation();
        $('.secondary-sidebar').toggle();
    });

    $('#btn-compose').on('click', function(e) {
        if(!$('.email-composer').is(":visible")) {
            $.when(
                $('.split-view').hide()
            ).done(function(){
                $('.email-composer').show();
                $('[data-mail-menu]').parent().removeClass('active');
            });
        }
    });

    $('#cancel-compose').on('click', function(e) {
        if($('.email-composer').is(":visible")) {
            $.when(
                $('.email-composer').hide(),
                $('#form-mail')[0].reset()
            ).done(function(){
                $('.split-view').show();
            });
        }
    });

    $('.tagsinput').autocomplete({
        serviceUrl: location.href,
        type: 'POST',
        paramName: 'contactsQuery',
        onSelect: function (suggestion) {
            $('#to_id').val(suggestion.data);
        }
    });

    $('.split-list-toggle').click(function() {
        $('.split-list').toggleClass('slideLeft');
    });

    $('.secondary-sidebar').click(function(e) {
        e.stopPropagation();
    })

    $(window).resize(function() {

        if ($(window).width() <= 1024) {
            $('.secondary-sidebar').hide();

        } else {
            $('.split-list').length && $('.split-list').removeClass('slideLeft');
            $('.secondary-sidebar').show();
        }
    });


    // // Email composer
    // var emailComposerToolbarTemplate = {
    //     "font-styles": function(locale) {
    //         return '<li class="dropdown">' + '<a data-toggle="dropdown" class="btn btn-default dropdown-toggle ">' + '<span class="editor-icon editor-icon-headline"></span>' + '<span class="current-font">Normal</span>' + '<b class="caret"></b>' + '</a>' + '<ul class="dropdown-menu">' + '<li><a tabindex="-1" data-wysihtml5-command-value="p" data-wysihtml5-command="formatBlock" href="javascript:;" unselectable="on">Normal</a></li>' + '<li><a tabindex="-1" data-wysihtml5-command-value="h1" data-wysihtml5-command="formatBlock" href="javascript:;" unselectable="on">1</a></li>' + '<li><a tabindex="-1" data-wysihtml5-command-value="h2" data-wysihtml5-command="formatBlock" href="javascript:;" unselectable="on">2</a></li>' + '<li><a tabindex="-1" data-wysihtml5-command-value="h3" data-wysihtml5-command="formatBlock" href="javascript:;" unselectable="on">3</a></li>' + '<li><a tabindex="-1" data-wysihtml5-command-value="h4" data-wysihtml5-command="formatBlock" href="javascript:;" unselectable="on">4</a></li>' + '<li><a tabindex="-1" data-wysihtml5-command-value="h5" data-wysihtml5-command="formatBlock" href="javascript:;" unselectable="on">5</a></li>' + '<li><a tabindex="-1" data-wysihtml5-command-value="h6" data-wysihtml5-command="formatBlock" href="javascript:;" unselectable="on">6</a></li>' + '</ul>' + '</li>';
    //     },
    //     emphasis: function(locale) {
    //         return '<li>' + '<div class="btn-group">' + '<a tabindex="-1" title="CTRL+B" data-wysihtml5-command="bold" class="btn  btn-default" href="javascript:;" unselectable="on"><i class="editor-icon editor-icon-bold"></i></a>' + '<a tabindex="-1" title="CTRL+I" data-wysihtml5-command="italic" class="btn  btn-default" href="javascript:;" unselectable="on"><i class="editor-icon editor-icon-italic"></i></a>' + '<a tabindex="-1" title="CTRL+U" data-wysihtml5-command="underline" class="btn  btn-default" href="javascript:;" unselectable="on"><i class="editor-icon editor-icon-underline"></i></a>' + '</div>' + '</li>';
    //     },
    //     blockquote: function(locale) {
    //         return '<li>' + '<a tabindex="-1" data-wysihtml5-display-format-name="false" data-wysihtml5-command-value="blockquote" data-wysihtml5-command="formatBlock" class="btn  btn-default" href="javascript:;" unselectable="on">' + '<i class="editor-icon editor-icon-quote"></i>' + '</a>' + '</li>'
    //     },
    //     lists: function(locale) {
    //         return '<li>' + '<div class="btn-group">' + '<a tabindex="-1" title="Unordered list" data-wysihtml5-command="insertUnorderedList" class="btn  btn-default" href="javascript:;" unselectable="on"><i class="editor-icon editor-icon-ul"></i></a>' + '<a tabindex="-1" title="Ordered list" data-wysihtml5-command="insertOrderedList" class="btn  btn-default" href="javascript:;" unselectable="on"><i class="editor-icon editor-icon-ol"></i></a>' + '<a tabindex="-1" title="Outdent" data-wysihtml5-command="Outdent" class="btn  btn-default" href="javascript:;" unselectable="on"><i class="editor-icon editor-icon-outdent"></i></a>' + '<a tabindex="-1" title="Indent" data-wysihtml5-command="Indent" class="btn  btn-default" href="javascript:;" unselectable="on"><i class="editor-icon editor-icon-indent"></i></a>' + '</div>' + '</li>'
    //     },
    //     image: function(locale) {
    //         return ''
    //     },
    //     link: function(locale) {
    //         return false;
    //     },
    //     html: function(locale) {
    //         return false;
    //     }
    // }

    // setTimeout(function() {
    //     // $('.email-body').length && $('.email-body').wysihtml5({
    //     //     html: true,
    //     //     stylesheets: ["pages/css/editor.css"],
    //     //     customTemplates: emailComposerToolbarTemplate
    //     // });

    //     // $('.email-composer .wysihtml5-toolbar').appendTo('.email-toolbar-wrapper');
    // }, 500);

    return {
        init: _init()
    }

})(jQuery);