<?php

class Sales_Model extends Model {
	
    public function __construct() {
	
		global $eqDb;
		$this->eqDb = $eqDb;
		$this->apps = new Apps();
	}
	
	public function getInvoiceByEventId(int $eventId) {

		$today   = date('m/d/Y');

		$this->eqDb->where('forecast_id', $eventId);
		// $this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$sold = $this->eqDb->get('sales', null, '*');

		$this->eqDb->where('f.id', $eventId);
		$this->eqDb->where('f.company_id', $_SESSION['scouty_company_id']);
		$response = $this->eqDb->get('forecast f', null, '*');

		$this->eqDb->where('id', $response[0]['channel_id']);
		$client   = $this->eqDb->get('channels', null, '*');

		$invoiceNo = '#' . $eventId;
		$eventDate = date('dS M, Y', strtotime($response[0]['date']));

		if(!count($response)) {
            header('location: ' . _SITEROOT_ . 'forecast');
            exit;
		}

		$client[0]['address'] = $this->prettifyAddress($client[0]['address']);

		$array = [];
		foreach($response as $key => $val) {

			$recipeSub = $this->eqDb->subQuery("s");
			$recipeSub->get("recipes_sub", null, 'id,price');

			$this->eqDb->join($recipeSub, "s.id = r.sub_recipe_id", "LEFT");

			$this->eqDb->where('forecast_id', $val['id']);
			$this->eqDb->orderBy('total', 'DESC');
			$recipes = $this->eqDb->get('forecast_recipes r', null, '*');
			
			if(count($recipes) > 0) {			
				array_push($array, [
						'date'    => $val['date'],
						'start'   => $val['start_time'],
						'end'     => $val['end_time'],
						'recipes' => $recipes
					]
				);
			}
		}

		$recipesOnlyArray = [];
		foreach($array as $key => $val) {
			foreach($val['recipes'] as $key1 => $val1) {
				$val1['date'] = $val['date'];
				array_push($recipesOnlyArray, $val1);
			}
		}

		$group = [];
		foreach ( $recipesOnlyArray as $key => $value ) {
		    $group[$value['date']][$value['recipe_name']][$value['sub_recipe_name']][] = $value;
		}

		$total = 0;
		foreach($group as $key => $byDate) {
			foreach($byDate as $key2 => $val2) {
				foreach($val2 as $key3 => $val3) {
					$total = $total + ($val3[0]['price'] * $val3[0]['total']);
				}
			}
		}

		return [
			'today'      => $today,
			'invoiceNum' => $invoiceNo,
			'client'     => $client[0],
			'data'       => $group,
			'eventDate'  => $eventDate,
			'total'      => $total,
			'sold'       => count($sold) ? true : false
		];
	}

	public function getSalesData() {

		$currentDate = date('Y-m-d');
		$currentTime = date('H:i:s');

		$filterString = $_POST['filters'];
		$filterString = json_decode($filterString,1);


		$dateRange = $this->eqDb->escape($filterString['dateRange']);
		$eventType = $this->eqDb->escape($filterString['eventType']);

		$dateRange = explode(" - ", $dateRange);
		$from 	   = $this->apps->prettyDateToTS($dateRange[0]);
		$to 	   = $this->apps->prettyDateToTS($dateRange[1]);

		$eventTypeString = '';
		if(!empty($eventType)) {
			$eventTypeString = 'event_type = "' . $eventType . '" AND ';
		}

		$query = "SELECT
            	f.`id`,
                fr.`forecast_id`, 
            	DATE_FORMAT(f.`date`,'%b %D') AS datePretty,
                IF(fr.forecast_id IS NOT NULL,fr.`total_orders`,0) AS total_orders,
                IF(fr.`total` IS NULL,0,fr.total) AS total,
                IF(
                	f.event_type = 'private',
                	IF(f.`paid` = 1,fr.total,0),
                	IF(f.`paid` = 1,fr.total_actual,0)
                ) AS total_actual,
                f.`date`
	            from forecast as f
	            INNER JOIN (
	               SELECT forecast_id, 
	               SUM(total * instantaneous_subrecipe_price) as total,
	               SUM(IF(total_actual IS NULL,0,total_actual) * instantaneous_subrecipe_price) as total_actual,
	               SUM(total) as total_orders,
	               COUNT(*) AS total_recipes
	               from forecast_recipes 
	               group by forecast_id) AS fr on f.`id` = fr.`forecast_id`
	            LEFT JOIN (
	                SELECT id, name, address
	                FROM channels
	            ) AS c on c.`id` = f.`channel_id`
	            WHERE 
	                (
	                    deleted = 0 AND
	                    (date BETWEEN '" . $from . "' AND '" . $to . "') AND 
	                    " . $eventTypeString . "
	                    company_id = '" . $_SESSION['scouty_company_id'] . "'
	                )
	            ORDER BY date ASC";

        $array = $this->eqDb->rawQuery($query);

		return $array;
	}

	public function prettifyAddress($address) {

		$address = explode(',',$address);

		$address[count($address) - 2] = $address[count($address) - 2] . ' ' . $address[count($address) - 1];

		unset($address[count($address) - 1]);

		return implode('<br/>', $address);
	}

	public function fetchSales() {

        $page   = ($_POST['start']/$_POST['length']) + 1;

        $colsordering = [
        	"eventId",
        	"dateTime",
        	"clientName",
        	"event_type",
        	"total_orders", 
        	"total",
        	"status"
        ];

		$currentDate = date('Y-m-d');
		$currentTime = date('H:i:s');

        $orderBy  = $colsordering[$_POST['order'][0]['column']];
        $orderDir = $_POST['order'][0]['dir'];

        $searchStr = '';
		if(!empty($_POST['search']['value'])) {
			$search = $_POST['search']['value'];
			$searchStr = ' AND (date LIKE "%' . $search . '%" OR c.name LIKE "%' . $search . '%" OR CONCAT(\'INV-\',LPAD(f.`id`, 7, 0)) LIKE "%' . $search . '%" OR f.event_type LIKE "%' . $search . '%") ';
		}

		$query = "SELECT SQL_CALC_FOUND_ROWS
            	f.`id`,
            	CONCAT('<span class=\"label ',IF(event_type = 'public','label-warning text-black ','bg-info text-white '),'p-b-5\">',CONCAT(UCASE(LEFT(f.`event_type`, 1)),SUBSTRING(f.`event_type`, 2)),'</span>') AS eventType,
            	CONCAT('<a href=\"" . _SITEROOT_ . "sales/resolve/',LPAD(f.`id`, 7, 0),'\" class=\"btn btn-tag no-margin\">','#SL-',LPAD(f.`id`, 7, 0),'</a>') AS eventIdPretty,
            	CONCAT('SL-',LPAD(f.`id`, 7, 0)) AS eventId,
            	CONCAT('<p class=\"no-margin\"udpateForecastSubRecipe>',DATE_FORMAT(f.`date`,'%b %D, %Y'),' @',CONCAT(f.`start_time`),'</p>') AS datePretty,
                fr.`forecast_id`, 
                IF(fr.forecast_id IS NOT NULL,fr.`total_orders`,0) AS total_orders,
                IF(fr.`total` IS NULL,0,fr.total) AS total,
                CONCAT('<strong class=\"text-black-50 font-montserrat fs-15\">$',IF(fr.`total` IS NULL,'0.00',fr.`total`),'</strong><br/>',
                	IF(event_type = \"public\",
                		CONCAT('<small class=\"hint-text pull-right m-l-5\">(',ROUND(fr.winRate,1),'%)</small>','<small class=\"pull-right block text-primary\">$',fr.total_actual,'</small>'),
                		''
                	)
                ) AS totalPrice, 
                fr.total_actual,
                f.`start_time`, 
                f.`date`,
                CONCAT(f.`start_time`,'-',f.`end_time`) AS time, 
                CONCAT(f.`date`,CONCAT(f.`start_time`,'-',f.`end_time`)) AS dateTime,
                c.name AS clientName,
                CONCAT('<a target=\"_blank\" href=\"" . _SITEROOT_ . "clients/edit/',f.`channel_id`,'\">',c.`name`,'</a>') AS client,
                CASE
                    WHEN paid IS NULL THEN '<span class=\"label text-uppercase label-danger p-b-5\"><i class=\"fa fa-exclamation\"></i>&nbsp;Unresolved</span>'
                    WHEN paid = 0 THEN '<span class=\"label text-uppercase label-danger p-b-5\"><i class=\"fa fa-exclamation\"></i>&nbsp;Unresolved</span>'
                    WHEN paid = 1 THEN '<span class=\"label text-uppercase label-inverse p-b-5\"><i class=\"fa fa-check\"></i>&nbsp;Resolved</span>'
                    WHEN paid = 2 THEN '<span class=\"label text-uppercase label-warning text-black p-b-5\">Cancelled</span>'
                END AS statusPretty,
                CASE
                    WHEN paid IS NULL THEN \"Unresolved\"
                    WHEN paid = 0 THEN \"Unresolved\"
                    WHEN paid = 1 THEN \"Resolved\"
                    WHEN paid = 2 THEN \"Cancelled\"
                END AS status,
                CASE
                    WHEN paid IS NULL THEN '<span class=\"label text-uppercase label-asd p-b-5\"><i class=\"fa fa-exclamation\"></i>&nbsp;Unpaid</span>'
                    WHEN paid = 0 THEN '<span class=\"label text-uppercase label-asd p-b-5\"><i class=\"fa fa-exclamation\"></i>&nbsp;Unpaid</span>'
                    WHEN paid = 1 THEN '<span class=\"label text-uppercase label-inverse p-b-5\"><i class=\"fa fa-check\"></i>&nbsp;Paid</span>'
                    WHEN paid = 2 THEN '<span class=\"label text-uppercase label-warning text-black p-b-5\">Cancelled</span>'
                END AS paidPretty,
                IF(
					date < \"" . $currentDate . "\", '<span class=\"bold label label-primary p-b-5\">Event Passed!</span>', 
					IF(
						date = \"" . $currentDate . "\",
						IF(
							\"" . $currentTime . "\" >= start_time,
							IF(
								\"" . $currentTime . "\" <= end_time,
								'<span class=\"label label-warning text-black p-b-5\">In Progress</span>',
								'<span class=\"label label-primary p-b-5\">Event Passed!</span>'
							),
							'<span class=\"label label-inverse p-b-5\">Upcoming Event</span>'
						),
						'<span class=\"label label-inverse p-b-5\">Upcoming Event</span>'
					)
				) AS event_progress
	            from forecast as f
	            INNER JOIN (
	               select forecast_id, 
	               SUM(total * instantaneous_subrecipe_price) as total,
	               SUM(IF(total_actual IS NULL,0,total_actual) * instantaneous_subrecipe_price) as total_actual,
	               SUM(total) as total_orders,
	               SUM(IF(total_actual IS NULL,0,total_actual) * instantaneous_subrecipe_price)/SUM(total * instantaneous_subrecipe_price) AS winRate,
	               COUNT(*) AS total_recipes
	               from forecast_recipes 
	               group by forecast_id) AS fr on f.`id` = fr.`forecast_id`
	            LEFT JOIN (
	                SELECT id, name
	                FROM channels
	            ) AS c on c.`id` = f.`channel_id`
	            WHERE 
	                (
	                    deleted = 0 AND 
	                    company_id = '" . $_SESSION['scouty_company_id'] . "'
	                    " . $searchStr . "
	                )
	            ORDER BY " . $orderBy . " " . $orderDir . " LIMIT " . $_POST['start'] . ", " . $_POST['length'];

        $array = $this->eqDb->withTotalCount()->rawQuery($query);

		$response = [
			'totalPages'           => 1,
			'iTotalDisplayRecords' => $this->eqDb->totalCount,
			'iTotalRecords'        => $this->eqDb->totalCount,
			'data'                 => $array
		];

		return $response;
	}

	public function getSalesDetails(string $eventId) {

		$eventId = ltrim($eventId, 0);

		$currentDate = date('Y-m-d');
		$currentTime = date('H:i:s');

		$channelJoin = $this->eqDb->subQuery ("c");
		$channelJoin->get('channels', null, 'id, name, address');
		$this->eqDb->join($channelJoin, 'f.channel_id = c.id', 'LEFT');

		$this->eqDb->where('f.company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->where('f.deleted', 0);
		$this->eqDb->where('f.id', $eventId);
		$event = $this->eqDb->get('forecast f',null, [
			'f.id as eventId',
			'c.name as client',
			'c.address as clientAddress',
			'IF(
				date < "' . $currentDate . '", "past", 
				IF(
					date = "' . $currentDate . '",
					IF(
						"' . $currentTime . '" >= start_time,
						IF(
							"' . $currentTime . '" <= end_time,
							"in progress",
							"past"
						),
						"future"
					),
					"future"
				)
			) AS event_status',
			"CONCAT('<span class=\"label ',IF(event_type = 'public','label-warning text-black ','bg-info text-white '),'p-b-5\">',CONCAT(UCASE(LEFT(f.`event_type`, 1)),SUBSTRING(f.`event_type`, 2)),'</span>') AS eventType",
			'event_type',
			'date_range',
			"CASE
                WHEN paid IS NULL THEN '<span class=\"label text-uppercase label-danger p-b-5\"><i class=\"fa fa-exclamation\"></i>&nbsp;Unresolved</span>'
                WHEN paid = 0 THEN '<span class=\"label text-uppercase label-danger p-b-5\"><i class=\"fa fa-exclamation\"></i>&nbsp;Unresolved</span>'
                WHEN paid = 1 THEN '<span class=\"label text-uppercase label-inverse p-b-5\"><i class=\"fa fa-check\"></i>&nbsp;Resolved</span>'
                WHEN paid = 2 THEN '<span class=\"label text-uppercase label-warning text-black p-b-5\">Cancelled</span>'
            END AS paidPretty",
			'CASE
                WHEN paid IS NULL THEN "unresolved"
                WHEN paid = 0 THEN "unresolved"
                WHEN paid = 1 THEN "resolved"
                WHEN paid = 2 THEN "cancelled"
            END AS paid',
			'date',
			'DATE_FORMAT(date,"%b %D, %Y") AS datePretty',
			'start_time',
			'end_time'
		]);

		$this->eqDb->where('forecast_id', $eventId);
		$forecastRecs = $this->eqDb->get('forecast_recipes f',null,[
			'id as forecast_recipe_id',
			'sub_recipe_name',
			'sub_recipe_id',
			'recipe_name',
			'forecast_id',
			'instantaneous_subrecipe_price',
			'total',
			'IF(total_actual IS NULL,0,total_actual) AS total_actual',
			'instantaneous_subrecipe_price * total AS net_total',
			'instantaneous_subrecipe_price * IF(total_actual IS NULL,0,total_actual) AS net_total_actual'
		]);

		$total 	     = 0;
		$totalActual = 0;
		foreach($forecastRecs as $key => $val) {
			$total 		 = $total + $val['net_total'];
			$totalActual = $totalActual + $val['net_total_actual'];
		}

		$event[0]['total']  	   = $total;
		$event[0]['totalActual']   = $totalActual;
		$event[0]['winRate']	   = number_format(($totalActual/$total) * 100,2);
		$event[0]['recipes']       = $forecastRecs;

		if(count($event) == 0) {
			header('location: ' . _SITEROOT_);
            exit;
		}

		return $event[0];
	}

	public function udpateForecastSubRecipe(int $eventId) {

		$data = $this->eqDb->escape($_POST['data']);
		$data = json_decode(stripslashes($data), 1);

		foreach($data as $dat) {

			$subs = $this->eqDb->subQuery ('i');
			$subs->where('company_id', $_SESSION['scouty_company_id']);
			$subs->get('ingredients', null, 'id, name');

			$this->eqDb->join($subs, 'sr.ingredient_id = i.id', 'LEFT');

			$this->eqDb->where('sr.recipe_sub_id', $dat['subRecipeId']);
			$instantaneousIngredients = $this->eqDb->get('recipes_sub_ingredients sr',null,[
				'i.id',
				'sr.recipe_sub_id', 
				'i.id as ingredient_id', 
				'ingredient_weight',
				'i.name AS name', 
				'(ingredient_weight * ' .$dat['amt'] . ') AS total'
			]);

			$data = [
				'total_actual' => $dat['amt'],
				'instantaneous_subrecipe_ing_weights_actual' => addslashes(json_encode($instantaneousIngredients))
			];

			// update the instantaneous weights as you are changint he amount you have picked
	        $this->eqDb->where('id', $dat['forRecId']);
	        $this->eqDb->where('company_id', $_SESSION['scouty_company_id']);

			if(!$this->eqDb->update('forecast_recipes', $data)) {
				return [
					'r' => 'danger',
					'message' => '<strong>Error!</strong> Internal Error (21233)'
				];
			}
		}

		$data = [
			'paid' => 1
		];

		// update the events status as PAID
        $this->eqDb->where('id', $eventId);
        $this->eqDb->where('company_id', $_SESSION['scouty_company_id']);

		if($this->eqDb->update('forecast', $data)) {
			return [
				'r' => 'success'
			];
		}
	}

	public function eventStatusPretty(string $status) {

		switch ($status) {
			case 'past':
				$string = '<span class="label label-danger p-b-5">Event Passed!</span>';
				break;
			case 'in progress':
				$string = '<span class="label label-warning p-b-5 text-black">In Progress</span>';
				break;
			case 'future':
				$string = '<span class="label label-inverse p-b-5">Upcoming Event</span>';
				break;
		}

		return $string;
	}

	public function loadTransactions($eventId) {
		
		$eventId   = $this->eqDb->escape($eventId);
		$eventId   = ltrim($eventId, 0);

		$subs = $this->eqDb->subQuery ('u');
		$subs->where('company_id', $_SESSION['scouty_company_id']);
		$subs->get('users', null, [
			'id',
			'CONCAT(firstname," ",lastname) AS name'
		]);

		$this->eqDb->join($subs, 'u.id = s.user', 'LEFT');

		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->where('forecast_id', $eventId);
		$transactions = $this->eqDb->get('sales s', null, [
			'DATE_FORMAT(date_time,"%b %D,Z%Y") AS date', 
			'reference', 
			'method', 
			'u.name AS name'
		]);

		return [
			'transactions' => $transactions
		];
	}

	public function submitTransaction(string $eventId) {

		$dop       = $this->eqDb->escape($_POST['date-of-payment']);
		$reference = $this->eqDb->escape($_POST['transaction-reference']);
		$method    = $this->eqDb->escape($_POST['method']);
		$eventId   = $this->eqDb->escape($eventId);
		$eventId   = ltrim($eventId, 0);

		$dop = $this->apps->prettyDateToTS($dop);

		$this->eqDb->where('id', $eventId);
		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$eventDetails = $this->eqDb->getOne('forecast',null,[
			'channel_id',
			'id'
		]);

		$add = $this->eqDb->insert('sales', [
			'client_id'   => $eventDetails['channel_id'],
			'forecast_id' => $eventId,
			'reference'   => $reference,
			'method'      => $method,
			'user' 	      => $_SESSION['scouty_user_id'],
			'company_id'  => $_SESSION['scouty_company_id'],
			'date_time'   => $dop
		]);

		if($add) {
			
			$data = [
				'paid' => 1
			];

			// update the events status as PAID
	        $this->eqDb->where('id', $eventId);
	        $this->eqDb->where('company_id', $_SESSION['scouty_company_id']);

			if($this->eqDb->update('forecast', $data)) {
				return [
					'r' => 'success'
				];
			}	
		}

		return [
			'r' 	  => 'fail',
			'message' => '<strong>Warning</strong> Sorry there was an error executing your query (1231)'
		];
	}

}