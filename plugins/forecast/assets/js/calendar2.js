(function($) {

    var selectedEvent,
        data = [],
        _events = {};

    function _init() {
        _events.calendar.init();

        $('#eventSave').on('click', function() {
            selectedEvent.title = $('#txtEventName').val();

            //You can add Any thing inside "other" object and it will get save inside the plugin.
            //Refer it back using the same name other.your_custom_attribute

            selectedEvent.other.code = $('#txtEventCode').val();
            selectedEvent.other.location = $('#txtEventLocation').val();

            $('#myCalendar').pagescalendar('updateEvent',selectedEvent);

            $('#calendar-event').removeClass('open');
        });

        $('#eventDelete').on('click', function() {
            $('#myCalendar').pagescalendar('removeEvent', $('#eventIndex').val());
            $('#calendar-event').removeClass('open');
        });
    }

    _events.calendar = {
        init: function(){
            // console.log(moment('20-10-06 12:02:00').format());
            $('#myCalendar').pagescalendar({
                //Loading Dummy EVENTS for demo Purposes, you can feed the events attribute from 
                //Web Service
                events: [],
                view:"week",
                eventOverlap: false,
                onViewRenderComplete: function() {
                    //You can Do a Simple AJAX here and update 
                },
                onEventClick: function(event) {
                    //Open Pages Custom Quick View
                    if (!$('#calendar-event').hasClass('open'))
                        $('#calendar-event').addClass('open');


                    selectedEvent = event;
                    setEventDetailsToForm(selectedEvent);
                },
                onEventDragComplete: function(event) {
                    return false;

                },
                onEventResizeComplete: function(event) {
                    selectedEvent = event;
                    setEventDetailsToForm(selectedEvent);
                },
                onDateChange:function(range){

                    var start = moment(range.start._d).format('YYYY-MM-DD'),
                        end = moment(range.end._d).format('YYYY-MM-DD');

                    $.ajax({
                        dataType: "json",
                        type: "POST",
                        data: { 
                            loadForecasts: 1,
                            start: start,
                            end: end
                        },
                        success: function(data) {
                            // _events.calendar.init(data);
                            // console.log(JSON.stringify({
                            //     title: 'Drag Me',
                            //     class: 'bg-success-lighter',
                            //     start: moment().startOf('week').add(2, 'days').add(2, 'hours').format(),
                            //     end: moment().startOf('week').add(2, 'days').add(3, 'hours').format(),
                            //     other: {
                            //         //You can have your custom list of attributes here
                            //         note: 'test'
                            //     }
                            // }, {
                            //     title: 'Click me',
                            //     class: 'bg-danger-lighter',
                            //     start: moment().startOf('week').add(2, 'days').add(2, 'hours').format(),
                            //     end: moment().startOf('week').add(2, 'days').add(3, 'hours').format(),
                            //     other: {
                            //         //You can have your custom list of attributes here
                            //         note: 'test'
                            //     }
                            // }));
                            $.when(
                               $('#myCalendar').pagescalendar('removeAllEvents', [])
                            ).done(function(){
                               $('#myCalendar').pagescalendar('addEvents', data);
                            });
                        }
                    });
                },
                onTimeSlotDblClick: function(timeSlot) {
                    $('#calendar-event').removeClass('open');
                    //Adding a new Event on Slot Double Click
                    var newEvent = {
                        title: 'my new event',
                        class: 'bg-success-lighter',
                        start: timeSlot.date,
                        end: moment(timeSlot.date).add(1, 'hour').format(),
                        allDay: false,
                        other: {
                            //You can have your custom list of attributes here
                            note: 'test'
                        }
                    };
                    selectedEvent = newEvent;
                    $('#myCalendar').pagescalendar('addEvent', newEvent);
                    setEventDetailsToForm(selectedEvent);
                }
            });
        }
    }

    var setEventDetailsToForm = function(event) {
        // Some Other Public Methods That can be Use are below \
        //console.log($('body').pagescalendar('getEvents'))
        //get the value of a property
        //console.log($('body').pagescalendar('getDate','MMMM'));
        $('#eventIndex').val();
        $('#txtEventName').val();
        $('#txtEventCode').val();
        $('#txtEventLocation').val();
        //Show Event date
        $('#event-date').html(moment(event.start).format('MMM, D dddd'));

        $('#lblfromTime').html(moment(event.start).format('h:mm A'));
        $('#lbltoTime').html(moment(event.end).format('H:mm A'));

        //Load Event Data To Text Field
        $('#eventIndex').val(event.index);
        $('#txtEventName').val(event.title);
        $('#txtEventCode').val(event.other.code);
        $('#txtEventLocation').val(event.other.location);
    }

    return {
        init: _init()
    }

})(window.jQuery);