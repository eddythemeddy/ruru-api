class Charts {

    chart = null;

    constructor(data,range) {
		this.weekArray = ['lastweek','thisweek','nextweek'];
        this.init2(data);
        this.initPie(data);
        this.initWeeklyData(data);
        this.initHorizontalBar(data);
        this.chart = null;
        this.pieChart = null;
        let th = this;  
        
        $(window).resize(function(){
            console.log(th.chart);
            // th.chart.redraw();
        })


        if ( $.fn.dataTable.isDataTable( '#table-unpaid') ) {
            $("#table-unpaid").dataTable().fnDestroy();
        }
        
        this.tableUnPaid = this.initDataTable(
            '#table-unpaid',
            data.unpaid,
            [[ 0, "desc" ]],
            [{
                sType: "numeric",
                sWidth: "10%",
                title: "days",
                data: 'daysOld',
                class: 'v-align-middle', 
                render: {                
                    _: 'display',
                    sort: 'timestamp'
                } 
            },
            {
                data: 'client',
                class: 'text-left v-align-middle',
                sWidth: "30%",
                render: {                
                    _: 'display',
                    sort: 'timestamp'
                },
                title: "client"
            },
            {
                data: 'action',
                class: 'v-align-middle',
                sWidth: "10%",
                orderable: false,
                render: {                
                    _: 'display',
                    sort: 'timestamp'
                },
                title: "action"
            }]
        );
        if ( $.fn.dataTable.isDataTable( '#table-upcoming') ) {
            $("#table-upcoming").dataTable().fnDestroy();
        }

        this.tableUpcoming = this.initDataTable(
            $('#table-upcoming'),
            data.upcoming,
            [[ 0, "desc" ]],
            [{
                data: 'daysToEvent',
                class: 'v-align-middle',
                sWidth: "14%",
                render: {                
                    _: 'display',
                    sort: 'timestamp'
                },
                title: "days"
            },
            {
                data: 'client',
                class: 'text-left v-align-middle',
                sWidth: "30%",
                render: {                
                    _: 'display',
                    sort: 'timestamp'
                },
                title: "client"
            },
            {
                title: 'Problem',
                sType: 'numeric',
                data: 'amountOwed', 
                sWidth: "30%",
                class: "text-right v-align-middle",
                render: {                
                    _: 'display',
                    sort: 'timestamp'
                } 
            }]
        );

    }

    initWeeklyData(data) {
        let th = this;
        this.weekArray.forEach(e => {
            let dom = $(`#${e}`);

            // console.log(data[e]);
            
            this.counter(dom.find('h3 > span'),data[e].actualTotal);
            this.counter(dom.find('.total-goal-perc'),data[e].percentageOfGoal);
            this.counter(dom.find('.total-goal'), 0);
            dom.find('.progress-bar').css({ width: `${data[e].percentageOfGoal}%`})
        });

        $('#companyOrders .total').text(data.data.length);
        $('#companyOrders .unpaid').text(data.unpaid.length);
        $('#companyOrders .paid').text((data.data.length - data.unpaid.length));
        $('#companyOrders .upcoming').text((data.upcoming.length));
        $('#companymain .progress-bar').css({ width: `${(data.totalSalesActual/data.totalSalesForecasted)*100}%`})
        $('#companyforcasted .progress-bar').css({ width: `${this.calculateImprovementFromLastWeek(data, 'forecastedTotal')}%`})
        this.counter($('#companymain .total'),data.totalSalesActual);
        this.counter($('#companymain .improvement span'),((data.totalSalesActual/data.totalSalesForecasted)*100));
        this.counter($('#companyforcasted .total'),data.totalSalesForecasted);
        this.counter($('#companyforcasted .improvement span'),this.calculateImprovementFromLastWeek(data, 'forecastedTotal'));
        this.calculateImprovementFromLastWeek(data, 'actualTotal') < 0 ? 
            $('#companymain .improvement').removeClass('text-success hint-text').addClass('text-danger') &&
            $('#companymain .improvement i').removeClass('fa-chevron-up').addClass('fa-chevron-down') :
            $('#companymain .improvement').addClass('text-success').removeClass('text-danger hint-text') &&
            $('#companymain .improvement i').addClass('fa-chevron-up').removeClass('fa-chevron-down');

        this.calculateImprovementFromLastWeek(data, 'actualTotal') == 0 ? 
            $('#companymain .improvement').removeClass('text-success text-danger').addClass('hint-text') &&
            $('#companymain .improvement i').removeClass('fa-chevron-up fa-chevron-down') : '';

        this.calculateImprovementFromLastWeek(data, 'forecastedTotal') < 0 ? 
            $('#companyforcasted .improvement').removeClass('text-success').addClass('text-danger') &&
            $('#companyforcasted .improvement i').removeClass('fa-chevron-up').addClass('fa-chevron-down') :
            $('#companyforcasted .improvement').addClass('text-success').removeClass('text-danger') &&
            $('#companyforcasted .improvement i').addClass('fa-chevron-up').removeClass('fa-chevron-down');

        this.calculateImprovementFromLastWeek(data, 'forecastedTotal') == 0 ? 
            $('#companyforcasted .improvement').removeClass('text-success text-danger').addClass('hint-text') &&
            $('#companyforcasted .improvement i').removeClass('fa-chevron-up fa-chevron-down') : '';
   
        $('#unpaid-total').text(data.unpaid.length);
        $('#upcoming-total').text(data.upcoming.length);
    }

    calculateImprovementFromLastWeek(data, ref) {
        let thisWeekTotal = data.thisweek[ref];
        let lastWeekTotal = data.lastweek[ref];

        if(lastWeekTotal == 0) {
            return 0;
        }

        return ((thisWeekTotal - lastWeekTotal)/lastWeekTotal) * 100
    }

    initDataTable(el, data, order, cols) {
            let th = this;
            
            $.fn.dataTable.ext.classes.sPageButton = 'btn btn-xs';
            $.fn.dataTable.ext.classes.sFilter = 'data-table-filter';
            $.fn.dataTable.ext.classes.sPageButtonActive = 'btn-primary';
            $.fn.dataTable.ext.classes.sPagePrevious = 'flaticon flaticon-chevron-left no-border';
            $.fn.dataTable.ext.classes.sPageNext = 'flaticon flaticon-chevron-right no-border';
            
            return $(el).DataTable( {
                data: data,
                search: true,
                paging: false,
                // scrollY: 300,
                bFilter: false,
                // scroller: true,
                order: order,
                columns: cols
            } );
    }

    initHorizontalBar(data) {
        
        let th = this; 
        th.horizontal = Highcharts.chart('horizBar', {
            chart: {
                type: 'bar',
                marginLeft: 150
            },
            title: false,
            xAxis: {
                type: 'category',
                title: {
                    text: null
                },
                min: 0,
                max: 4,
                scrollbar: {
                    enabled: true
                },
                tickLength: 0
            },
            yAxis: {
                min: 0,
                max: 1200,
                label: false,
                title: {
                    text: '',
                    align: 'high',
                }
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            legend: {
                enabled: false
            },
            credits: {
                enabled: false
            },
            tooltip: {
                enabled: true,
                formatter: function(b,c) {
                    let a = `<strong>${this.key}</strong><br/> ${(this.y)} times`;
                    
                    return a;
                }
            },
            series: [{
                name: '',
                data: data.horizontalBar
            }]
        });
    }

    init2(data) {
        let th = this; 

        console.log(data);

        if(!data.chartActual.length) {
            $('#container').html('<div style="position: absolute; top: 45%;left:45%;">Sorry no data</div>');
            return false;
        }
        th.chart = Highcharts.stockChart('container', {

            chart: {
                marginRight: 10,
                marginBottom: -5
            },

            rangeSelector : false,

            title: false,

            navigator: {
                "enabled": true,
                "series": {
                        "type": 'column'
                },
            },


            plotOptions: {
                series: {
                    showInNavigator: true
                }
            },

            xAxis: [{
                labels: {
                    formatter: function() {
                        let start = moment(this.value).subtract(1,'days').format('D MMM'),
                            end = moment(this.value).add(7,'days').format('D MMM');

                        if(moment(start).format('MMM') === moment(end).format('MMM')) {
                            return `${moment(this.value).add(1,'days').format('D')}-${end}`;
                        }
                        
                        return `${start}-${end}`;
                    }
                }
            }],
            
            tooltip: {
                enabled: true,
                formatter: function(b) {

                    let start = moment(this.points[0].x).format('Do MMM'),
                        end = moment(this.points[0].x).add(6,'days').format('Do MMM'),
                        a = '';
                    
                    a = `<span style="float: right;">Week of ${start}-${end}</span><br/>`;

                    if(moment(start).format('MMM') === moment(end).format('MMM')) {
                        a = `<span style="float: right;">Week of ${moment(this.points[0].x).format('Do')}-${end}</span><br/>`;
                    }
                    
                    this.points.forEach(e => {
                        a += `<strong>${e.series.name}</strong>: $${(e.y).toFixed(2)} <br/>`
                    })

                    return a;
                }
            },

            series: [{
                name: 'Actual Sales',
                type: 'spline',
                data: data.stock.actual,
                tooltip: {
                    valueDecimals: 2
                },
                zoneAxis: 'x',
                zones: [{
                    value: moment().valueOf(),
                    dashStyle: 'solid'
                },{
                    dashStyle: 'dot'
                }],
            },{
                name: 'Forecasted',
                data: data.stock.forecasted,
                zoneAxis: 'x',
                zones: [{
                    value: moment().valueOf(),
                    dashStyle: 'solid'
                },{
                    dashStyle: 'dot'
                }],
                type: 'spline',
                tooltip: {
                    valueDecimals: 2
                }
            }]
        });
        console.log(data.stock.forecasted);
    }

    initPie(data) {
        let th = this; 

        console.log(data);

        if(!data.chartActual.length) {
            $('#pieChart').html('<div style="position: absolute; top: 45%;left:45%;">Sorry no data</div>');
            return false;
        }
        th.pieChart = Highcharts.chart('pieChart', {
            chart: {
                type: 'pie'
            },

            title: false,
            tooltip: {
                pointFormat: '<b>{point.y}</b> grams'
            },
        
            accessibility: {
                announceNewData: {
                    enabled: true
                },
                point: {
                    valueSuffix: ''
                }
            },
        
            
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        distance: -50,
                        style: {
                            textOutline: false,
                            fontWeight: 'normal'
                        }
                    },
                    showInLegend: false
                }
            },
            series: [{
                name: 'All',
                colorByPoint: true,
                data: data.recipePieData
            }],
            drilldown: {
                series: [
                    {
                        name: "Others",
                        id: "Others",
                        data: data.recipePieDataOthers
                    }
                ]
            }
        });

        console.log(data.recipePieDataOthers);
    }

	counter(el, number, decimals = 2) {
        let initial = $(el).text();
		$(el).prop('Counter', initial).animate({
			Counter: number
		}, {
			duration: 800,
			easing: 'swing',
			step: function (now) {
                if(decimals) { 
                    now = now.toFixed(decimals)
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }

				$(el).text((now));
			}
		});
	}
}

