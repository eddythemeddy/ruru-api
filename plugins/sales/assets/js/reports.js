(function() {

	let lineChart = null,
		charts = {},
		_data = [];

	const _init = () => {
		am4core.useTheme(am4themes_animated);
		charts.lineChart.run();
		_filters.init();
	};

	const _filters = {
		init: function() {
			$('input.date-range').daterangepicker({
			    "startDate": moment().startOf('month').format('MM/DD/YYYY'),
			    "endDate": moment().endOf('month').format('MM/DD/YYYY')
			});

			$(document).on('change', '.date-range,.event-type',function(){
				charts.lineChart.run();
			})
		}
	}

	const _getFilterData = () =>{
		let dateRange = $('.date-range').val(),
			eventType = $('.event-type').val();

		return JSON.stringify({
			'dateRange': dateRange,
			'eventType': eventType
		});
	};

	charts.lineChart = {
		run: function() {
			setTimeout(function(){
				charts.lineChart.init()
			},20);
		},
		ajax: function () {
			return $.ajax({
		        dataType: "json",
		        type: "POST",
		        data: { 
		            getSalesData: 1,
		            filters: _getFilterData()
		        },
		        success: function(d) {
		        	_data = d;
		        }
		    });
		},
		init: function() {
			$.when(
				charts.lineChart.ajax()
			).done(function(){
				charts.lineChart.build()
			});
		},
		build: function() {
			lineChart = am4core.create("salesChart", am4charts.XYChart);
			lineChart.data = _data;
			// Create axes
			let dateAxis = lineChart.xAxes.push(new am4charts.DateAxis()),
				valueAxis = lineChart.yAxes.push(new am4charts.ValueAxis());
				series = lineChart.series.push(new am4charts.LineSeries());

			// dateAxis.renderer.minGridDistance = 2160;
			// Create series
			series.dataFields.valueY = "total_actual";
			series.stroke = "red";
			series.fill = "red";
			series.name = "Actual Sales";
			series.dataFields.dateX = "date";
			series.tooltipText = "Actual Sales - {datePretty}: [bold]${total_actual}[/]";

			series.tooltip.pointerOrientation = "vertical";

			lineChart.cursor = new am4charts.XYCursor();
			lineChart.cursor.snapToSeries = series;
			lineChart.cursor.xAxis = dateAxis;

			dateAxis.title.text = "[bold]";
			valueAxis.title.text = "[bold]Sales ($)[/]";
			valueAxis.min = -10;

			// series.title.text = "asd";
			// Create series
			var series2 = lineChart.series.push(new am4charts.LineSeries());
			series2.dataFields.valueY = "total";
			series2.dataFields.dateX = "date";
			series2.strokeWidth = 2;
			series2.name = "Projected Sales";
			series2.strokeDasharray = "3,4";
			series2.fill = "green";
			series2.stroke = "green";
			series2.tooltipText = "Projected Sales - {datePretty}: [bold]${total}[/]";

			lineChart.legend = new am4charts.Legend();
			lineChart.legend.useDefaultMarker = true;
			var marker = lineChart.legend.markers.template.children.getIndex(0);
			marker.cornerRadius(2, 2, 2, 2);
			marker.strokeWidth = 1;
			marker.strokeOpacity = 1;
			marker.stroke = am4core.color("#ccc");

			// lineChart.scrollbarY = new am4core.Scrollbar();
			// lineChart.scrollbarX = new am4core.Scrollbar();
		}
	}


	return {
		init: _init()
	}
})();