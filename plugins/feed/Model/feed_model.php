<?php

class Feed_Model extends Model {
	
	public function __construct() {

		global $eqDb;
	
		$this->eqDb = $eqDb;
		$this->memberHelper = new MemberHelper();
		parent::__construct();
	}

	public function submitPost() {

		$fromUser = $_SESSION['scouty_user_id'];
		$fromName = $_SESSION['scouty_firstname'] . ' ' . $_SESSION['scouty_lastname'];
		$content = $this->eqDb->escape($_POST['post-text']);

		$data = [
			'user_id' => $fromUser,
			'record_type' => 'text',
			'content' => $content,
			'datetime' => date('Y-m-d H:i:s')
		];

		$a = $this->eqDb->insert('records', $data);

		$data['photo'] = '/uploads/' . $_SESSION['scouty_username'] . '/profile.jpg';
		$data['name'] = $fromName;

		if($a) {
			return $data;
		}

	}

	public function loadChannels() {

		// $recipeIng = $this->eqDb->subQuery("s");
		// $recipeIng->get('ingredients', null, 'id, ppw, name');
		
		// $this->eqDb->join($recipeIng, "s.id = rs.ingredient_id", "INNER");

        $this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
        $this->eqDb->where('active', 1);
        $this->eqDb->orderBy('name', 'ASC');
		$response = $this->eqDb->get('channels', null, [
			"id", 
			"name", 
			"active", 
			"description", 
			"address"
		]);

		return $response;
	}

	public function get3WeekData() {

		$query = "SELECT
					f.`id`,
					f.paid,
					fr.`forecast_id`,
					c.name AS client,
					c.id AS client_id,
					date,
					f.date_range,
					DATE_FORMAT(f.`date`,'%b %D') AS datePretty,
					IF(fr.forecast_id IS NOT NULL,fr.`total_orders`,0) AS total_orders,
					IF(fr.`total` IS NULL,0,fr.total) AS total,
					event_type,
					recipe_name,
					IF(
						f.event_type = 'private',
						IF(f.`paid` = 1,fr.total,0),
						IF(f.`paid` = 1,fr.total_actual,0)
					) AS total_actual,
					IF(
						f.`paid` IS NULL,
						0,						
						IF(f.`paid` = 0, 0, 1)
					) AS paid,
					f.`date` 
				FROM forecast as f
	            INNER JOIN (
	               SELECT forecast_id, 
	               SUM(total * instantaneous_subrecipe_price) as total,
	               SUM(IF(total_actual IS NULL,0,total_actual) * instantaneous_subrecipe_price) as total_actual,
	               SUM(total) as total_orders,
				   instantaneous_subrecipe_ing_weights,
				   GROUP_CONCAT(concat(sub_recipe_name,' ',recipe_name,'|',total)) AS recipe_name,
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
						company_id = '" . $_SESSION['scouty_company_id'] . "'
	                )
				ORDER BY date ASC";

		$array = $this->eqDb->rawQuery($query);
		foreach($array as $key => $val) {
			$this->eqDb->where('forecast_id', $val['id']);
			$check = $this->eqDb->get('forecast_recipes',null,'instantaneous_subrecipe_ing_weights AS weights');
			$array[$key]['ings'] = [];
			foreach($check as $checkit) {
				array_push($array[$key]['ings'], json_decode('['.$checkit['weights'].']', 1));
			}
		}

		return $array;
	}
}