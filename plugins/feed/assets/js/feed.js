class Feed {
	
	constructor() {
		this.weekArray = ['lastweek','thisweek','nextweek'];
		this.charts = null;
		this.data = null;
		this.updatedData = [];
		
		this.loadData();
		this.loadEvents();
		this.loadAndRun = this.loadAndRun.bind(this);
	}

	loadEvents() {
		let th = this;
		$(document).on('change','select',function(){
			th.loadAndRun();
		});

		$(window).on('scroll',function(i,e){
			var top  = window.pageYOffset || document.documentElement.scrollTop;
			if(top >= 55) {
				$('.filter-container,.analytics-container').addClass('fixed')
			} else {
				$('.filter-container,.analytics-container').removeClass('fixed')
			}
		});
	}

	filterData(data) {
		
		let range = $('#dateRangeDD').val(),
			 eventType = $('#eventTypeDD').val(),
			 client = $('#clientDD').val(),
			 minDate = null;
		
		range = range.split(',');
		switch (range[1]) {
			case 'months':
				minDate = moment().subtract(range[0], 'months').format('YYYY-MM-DD');
				// console.log(range);
				break;
			case 'years':
				minDate = moment().subtract(range[0], 'years').format('YYYY-MM-DD');
				break;
		}
		
		let updatedData = this.data.filter(e => {
			return eventType == '' ? -1 : (e.event_type == eventType);
		}).filter(e => {
			return e.date >= minDate;
		}).filter(e => {
			return client == '' ? -1 : (e.client_id == client);
		});

		// console.log(updatedData);

		this.updatedData = updatedData;
	}

	loadData() {

		let data = { 
			getAll: 1,
		};
		let th = this;

		$.ajax({
			dataType: "json",
			type: "POST",
			data: data,
			success: function(data){
				$.when(
					th.data = data
				).done(function() {
					th.loadAndRun(data);
				})
			},
			error: function(){
			}
		});
	}

	loadAndRun() {
		let th = this;
		$.when(
			th.filterData()
		).done(() => {
			th.buildAllData()
		}).done(() => {
			th.chartInit();
		}).done(() => {
			th.run();
		});
	}

	run() {
		new Charts(this.global);
	}

	chartInit() {
		let th = this;
		this.weekArray.forEach(e => {
			//get that weeks data
			if(th.global[e].data.length > 0) {
				th.global[e]['forecastedTotal'] = th.global[e].data.map(s => {
					return s.total;
				}).reduce((a,b) => a + b);
				th.global[e]['actualTotal'] = th.global[e].data.map(t => {
					return t.total_actual;
				}).reduce((a,b) => a + b);
				th.global[e]['percentageOfGoal'] = (th.global[e]['actualTotal']/th.global[e]['forecastedTotal']) * 100;
			} else {
				th.global[e]['forecastedTotal'] = 0;
				th.global[e]['actualTotal'] = 0;
				th.global[e]['percentageOfGoal'] = 0;
			}
		})
	}

	buildAllData() {
		
		let data = this.updatedData,
			th = this,
			weeklyObject = { range: null, data: [], forecastedTotal: 0, acutalTotal: 0, percentageOfGoal: 0};

		let lastWeekSt = moment().subtract(7, 'days').startOf('isoweek').format('YYYY-MM-DD');
		let lastWeekEn = moment().subtract(7, 'days').endOf('isoweek').format('YYYY-MM-DD');
		let thisWeekSt = moment().startOf('isoweek').format('YYYY-MM-DD');
		let thisWeekEn = moment().endOf('isoweek').format('YYYY-MM-DD');
		let nextWeekSt = moment().add(7, 'days').startOf('isoweek').format('YYYY-MM-DD');
		let nextWeekEn = moment().add(7, 'days').endOf('isoweek').format('YYYY-MM-DD');
		this.global = { 
			lastweek: { ...weeklyObject },
			thisweek: { ...weeklyObject },
			nextweek: { ...weeklyObject },
			totalSalesForecasted: 0,
			table: [],
			unpaidOrders: [],
			chartActual: [],
			chartForecasted: [],
			data: [],
			totalSalesActual: 0,
			recipeInstances: null,
			upcoming: [],
			unpaid: [],
			stock: {
				actual: [],
				forecasted: [],
			}
		};

		if(data.length == 0) {
			return false;
		}
		
		this.global.data = data;

		this.global.stock.forecasted = this.calculateStockTable(data, 'total');
		this.global.stock.actual = this.calculateStockTable(data, 'total_actual');

		this.global.lastweek.range = lastWeekSt + '|' + lastWeekEn;
		this.global.lastweek.data = data.filter(d => {
			return d.date >= lastWeekSt && d.date <= lastWeekEn;
		})

		this.global.thisweek.range = thisWeekSt + '|' + thisWeekEn;
		this.global.thisweek.data = data.filter(d => {
			return d.date >= thisWeekSt && d.date <= thisWeekEn;
		})

		this.global.nextweek.range = nextWeekSt + '|' + nextWeekEn;
		this.global.nextweek.data = data.filter(d => {
			return d.date >= nextWeekSt && d.date <= nextWeekEn;
		});

		const recipeInstances = data.map(e => { return e.recipe_name }).map(e => {
			let f = e.split(',');

			return f;
		});
		
		this.global.recipeInstances = [].concat(...recipeInstances)
			.map(e => { return { ingredient: e.split('|')[0], total:e.split('|')[1] }})
			.reduce(function(map, e) {
				var name = e.ingredient
				var price = +e.total
				map[name] = (map[name] || 0) + price
				return map
			}, {})
		
		this.global.horizontalBar = Object.keys(this.global.recipeInstances).map(e => {
			return [e, this.global.recipeInstances[e]]
		}).sort((a, b) => {
			return b[1] - a[1]; 
		})
		
		const ingredientInstances = data.map(e => { 
			let s = e.ings;
			return s;
		}).map(e => { 
			return e.map( (r) => {
				return r.reduce( (map,c) => {
					var name = c.name
					var price = + c.total
					map[name] = (map[name] || 0) + price
					return map
				},{})
			});
		});

		let final = {};
		let others = [];
		ingredientInstances.forEach((e,i) => {
			e.forEach((l,o) => {
				Object.keys(l).forEach((s,e) => {					
					if(parseInt(l[s]) < 2000) { //order amount that would group them into others						
						final['Others'] = (final['Others'] || 0) + l[s];
						others[s] = (others[s] || 0) + l[s]
					} else {
						final[s] = (final[s] || 0) + l[s]
					}
				});
			})
		})

		this.global.recipePieDataOthers = Object.keys(others).map(function(e,i){
			return [e, others[e]];
		});

		this.global.recipeInstances = {...final};
		this.global.recipePieData = Object.keys(final).map((f,i) => {
			return {
				name: f,
				y: final[f],
				drilldown: f == 'Others' ? 'Others' : false,
				sliced: i == 1 ? true : false,
				selected: i == 1 ? true : false
			}
		});

		console.log(others);

		
		// this.global.ingredientInstances = [].concat(...ingredientInstances)
		// 	.reduce(function(map, e) {
		// 		var name = e.name
		// 		var price = + e.total
		// 		map[name] = (map[name] || 0) + price
		// 		return map
		// 	}, {});
			
		// ingredientInstances.forEach(e => {
		// 	// console.log(e);
		// 	console.log(JSON.parse(`[${e}]`));
		// })

		// console.log(z);

		this.global.totalSalesForecasted = data.map(e => {
			return e.total;
		}).reduce((a,b) => a + b);

		this.global.unpaidOrders = data.filter(e => {
			// console.log(e);
			return e.paid == 0;
		});
        
        this.global.chartActual = data.map(e => {
            return [
                moment(e.date).valueOf(),
                e.total_actual
            ]
		});
		
        this.global.chartForecasted = data.map(e => {
            return [
                moment(e.date).valueOf(),
                e.total
            ]
		})

		this.global.totalSalesActual = data.map(e => {
			return e.total_actual;
		}).reduce((a,b) => a + b);

		this.global.upcoming = data.filter(e => {
			return e.date > moment().format('YYYY-MM-DD');
		}).map(e => {
			return {
				daysToEvent: {
					timestamp: 123,
					display: th.daysSinceHtml(e)
				},
				client: {
					timestamp: e.client,
					display: `<strong>${e.client}</strong><small class="block hint-text l-h-1 m-b-5">${moment(e.date).format("D, MMM Y")}</small> ${th.eventTypeRender(e.event_type)}`
				},
				amountOwed: {
					timestamp: e.total,
					display: th.amountOwedHtml(e)
				}
			}
		});

		this.global.unpaid = data.filter(e => { 
			return e.paid == 0;
		}).map(e => {
			return { 
				client: {
					timestamp: e.client,
					display: `<strong>${e.client}</strong><small class="block hint-text l-h-1 m-b-5">${moment(e.date).format("D, MMM Y")}</small> ${th.eventTypeRender(e.event_type)}`
				},
				eventType : {
					timestamp: e.event_type,
					display: th.eventTypeRender(e.event_type)
				},
				daysOld: {
					timestamp: moment().diff(e.date, "days"),
					display: th.daysSinceHtml(e)
				},
				action: {
					display: `<a href="/sales/resolve/${e.id}" class="btn p-l-5 p-r-5 p-t-0 p-b-0 btn-sm btn-primary"><strong>Resolve</strong> $${e.total.toFixed(2)}</a>`
				},
				ms: {
					timestamp: moment(e.date).valueOf(),
					display: moment(e.date).format("D, MMM Y")
				},
				amountOwed: {
					timestamp: e.total,
					display: th.amountOwedHtml(e)
				}
			} 
		});
	}

	calculateStockTable(data, type) {
		let d = data.sort((a, b) => a.date - b.date);
		let min = d[0].date,
			max = d.reverse()[0].date;

		let todayPlus2Wk = moment().startOf('isoweek').add(21,'days').format('YYYY-MM-DD'),
			endDate = todayPlus2Wk < max ? moment(max).startOf('isoweek').add(21, 'days').format('YYYY-MM-DD') : todayPlus2Wk,
			newArr = [],
			range = $('#dateRangeDD').val(),
			minDate = null;
		
		range = range.split(',');
		switch (range[1]) {
			case 'months':
				minDate = moment().subtract(range[0], 'months').startOf('isoweek').format('YYYY-MM-DD');
				// console.log(range);
				break;
			case 'years':
				minDate = moment().subtract(range[0], 'years').startOf('isoweek').format('YYYY-MM-DD');
				break;
		}
			
		while (minDate <= endDate) {
			let valueOfWeek = 0;
			data.forEach(el => {
				if(moment(el.date).startOf('isoweek').format('YYYY-MM-DD') == minDate) {
					valueOfWeek += el[type]
				}
			});
			newArr.push([ moment(minDate).valueOf(), valueOfWeek ]);
			minDate = moment(minDate).add(7, 'days').format('YYYY-MM-DD');
		}


		return newArr;
	}

	daysSinceHtml(data) {
		let textClass = '';
		let diff = parseInt(moment().diff(data.date, "days"));
		let text = `${diff}`;

		if(diff < 0) {
			text = `${Math.abs(diff)}`;
		}

		if(diff == 0) {
			text `in progress`;
		}

		diff = Math.abs(diff);
		switch (true) {
			case diff < 10:
				textClass = 'fs-15 p-b-5 badge badge-inverse';
				break;
			case (diff >= 10 && diff < 30):
				textClass = 'fs-15 p-b-5 badge badge-info text-red';
				break;					
			case diff >= 30:
				textClass = 'fs-15 p-b-5 badge badge-danger';
				break;	
		}

		return `<span class="${textClass}">${text}</span>`;
	}

	amountOwedHtml(data) {
		let html = '';
		switch (data.event_type) {
			case 'private':
				html = `<strong class="hint-text">$${data.total.toFixed(2)}</strong><br/><small>Incompelte Invoices</small>`;
				break;
		
			case 'public':
				html = `<strong class="hint-text">$${data.total.toFixed(2)}</strong><br/><small>$${data.total.toFixed(2)} forecasted, none resolved<small>`;
				break;
		}

		return html;
	}

	eventTypeRender(data) {
		let html = '';
		switch (data) {
			case 'private':
				html = '<span class="pull-left label bg-info text-white p-b-5">Private</span>';
				break;
		
			default:
				html = '<span class="pull-left label label-warning text-black p-b-5">Public</span>';
				break;
		}

		return html;
	}
}


new Feed();

