<?php

class Invoices_Model extends Model {
	
    public function __construct() {
	
		global $eqDb;
		$this->eqDb = $eqDb;
	}

	public function fetchInvoices() {

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
			$searchStr = ' AND (c.name LIKE "%' . $search . '%" OR CONCAT(\'INV-\',LPAD(f.`id`, 7, 0)) LIKE "%' . $search . '%" OR f.event_type LIKE "%' . $search . '%") ';
		}

		$query = "SELECT SQL_CALC_FOUND_ROWS
            	f.`id`,
            	CONCAT('<span class=\"label label-',IF(event_type = 'public','success','info'),' text-white p-b-5\">',CONCAT(UCASE(LEFT(f.`event_type`, 1)),SUBSTRING(f.`event_type`, 2)),'</span>') AS eventType,
            	CONCAT('<a href=\"" . _SITEROOT_ . "forecast/invoice/',LPAD(f.`id`, 7, 0),'\" class=\"btn btn-tag no-margin\">','#INV-',LPAD(f.`id`, 7, 0),'</a>') AS eventIdPretty,
            	CONCAT('INV-',LPAD(f.`id`, 7, 0)) AS eventId,
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
                CONCAT('<a target=\"_blank\" href=\"" . _SITEROOT_ . "clients/edit/',f.`channel_id`,'\" class=\"bold\">',c.`name`,'</a>') AS client,
                CASE
                    WHEN paid IS NULL THEN \"Unpaid\"
                    WHEN paid = 0 THEN \"Unpaid\"
                    WHEN paid = 1 THEN \"Paid\"
                    WHEN paid = 2 THEN \"Cancelled\"
                END AS status,
                IF(
                	event_type = 'private',
                	IF(
						date < \"" . $currentDate . "\",
						CASE
		                    WHEN paid IS NULL THEN '<span class=\"label text-uppercase label-important p-b-5\">Unpaid</span>'
		                    WHEN paid = 0 THEN '<span class=\"label text-uppercase label-important p-b-5\">Unpaid</span>'
		                    WHEN paid = 1 THEN '<span class=\"label text-uppercase label-inverse p-b-5\"><i class=\"fa fa-check\"></i>&nbsp;Paid</span>'
		                    WHEN paid = 2 THEN '<span class=\"label text-uppercase label-warning text-black p-b-5\">Cancelled</span>'
		                END,
		            	'<span class=\"label label-success p-b-5 tip\" data-toggle=\"tooltip\" data-original-title=\"Event not started, payment not required!\">ENS</span>'
		            ),
		            '<span class=\"label label-info p-b-5 tip\" data-toggle=\"tooltip\" data-original-title=\"Private events do not require an invoice!\">NA</span>'
		        ) AS statusPretty,
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
	            LEFT JOIN (
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
	                    event_type = 'private' AND
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

}