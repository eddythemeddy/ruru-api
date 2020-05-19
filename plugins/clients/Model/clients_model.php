<?php

class Clients_Model extends Model {
	
	public function __construct() {

		global $eqDb;
	
		parent::__construct();

		$this->eqDb = $eqDb;
	}

	public function addClient(){ 

		$name        = $this->eqDb->escape($_POST['name']);
		$address     = $this->eqDb->escape($_POST['client-add']);
		$mainContact = $this->eqDb->escape($_POST['mainContact']);
		$phone       = $this->eqDb->escape($_POST['phone']);
		$description = $this->eqDb->escape($_POST['description']);
		$lat         = $this->eqDb->escape($_POST['lat']);
		$long        = $this->eqDb->escape($_POST['long']);
		$city        = $this->eqDb->escape($_POST['city']);
		$country     = $this->eqDb->escape($_POST['country']);


		//check if a channel with the same name hasnt been added yet.
		$this->eqDb->where("name", $name);
		$sameNameChannel = $this->eqDb->get("channels", null, '*');

		if(count($sameNameChannel) > 0) {
			return [
				'r' 	  => 'error', 
				'message' => '<strong>Duplicate!</strong> A channel named ' . $name . ' already exists!'
			];
		}

		$data = [
			'name'         => $name,
			'address'      => $address,
			'description'  => $description,
			'main_contact' => $mainContact,
			'phone'        => $phone,
			'lat'          => $lat,
			'long'         => $long,
			'city'         => $city,
			'country'      => $country,
			'company_id'   => $_SESSION['scouty_company_id'],
			'active'       => 1
		];

		$a = $this->eqDb->insert('channels', $data);

		if($a) {
			return [
				'r' 	   => 'true', 
				'redirect' => '/clients/edit/' . $a
			];
		} 
		return [
			'r' 	  => 'error', 
			'message' => '<strong>Error!</strong> Sorry there was an internal error!'
		];
	}

	public function loadClients() {

        $page   = ($_GET['start']/$_GET['length']) + 1;
        $status = !empty($_GET['status']) ? $this->eqDb->escape($_GET['status']) : 0;

        $siteRoot = _SITEROOT_;

        $cols = [
        	"id",
        	"CONCAT(
        	'<div class=\"inline rounded-circle\" style=\"background-color:',
        	(CASE WHEN channel_color IS NULL OR channel_color = '' THEN \"#3395ed\" ELSE channel_color END)
        	,'; width: 10px; height: 10px;\"></div>&nbsp;', 
        	'<a href=\"" . $siteRoot . "clients/edit/', id, '" . $siteRoot . "\">', 
        	name, 
        	'</a>') as nameEdited",
        	"IF(days IS NULL, 'No', 'Yes') AS repeats",
        	"active", 
        	"description", 
        	"address", 
        	"phone", 
        	"channel_color"
        ];

        $colsAfter = [
        	'name',
        	'phone', 
        	'address',
        	'repeats'
        ];

        $orderBy  = $colsAfter[$_GET['order'][0]['column']];
        $orderDir = $_GET['order'][0]['dir'];

		$this->eqDb->pageLimit = $_GET['length'];

		if(!empty($_GET['search'])) {
			$search = $this->eqDb->escape($_GET['search']['value']);
			$this->eqDb->where('(phone LIKE "%' . $search . '%" OR address LIKE "%' . $search . '%" OR name LIKE "%' . $search . '%")');
		}

		$this->eqDb->where("deleted", $status);
		$this->eqDb->where("company_id", $_SESSION['scouty_company_id']);
		$this->eqDb->orderBy($orderBy, $orderDir);
		$users = $this->eqDb->withTotalCount()->arraybuilder()->paginate("channels", $page, $cols);

		$response = [
			'totalPages'           => $this->eqDb->totalPages,
			'iTotalDisplayRecords' => $this->eqDb->totalCount,
			'iTotalRecords'        => $this->eqDb->totalCount,
			'data'                 => $users
		];

		return $response;
	}

	public function loadClient(int $id) {

		$id = $this->eqDb->escape($id);

        $cols = ["id", "name", "active", "city", "lat", "long", "mainContact", "phone", "isWeekly", "days", "days_plan", "channel_color", "channel_text"];

		$this->eqDb->where("company_id", $_SESSION['scouty_company_id']);
		$this->eqDb->where("id", $id);
		$response = $this->eqDb->getOne("channels", null, $cols);

		return $response;
	}

	public function checkIfClientHasOrders(int $id) {

		$id = $this->eqDb->escape($id);

		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->where('channel_id', $id);

		$subRecipes = $this->eqDb->get('forecast r', null, '*');

		if(count($subRecipes)) {
			return true;
		}
		
		return false;
	}

	public function deleteChannel(int $id) {

		$id = $this->eqDb->escape($id);

		$this->eqDb->where('id', $id);
		$this->eqDb->delete('ingredients');

		$this->eqDb->where('ingredient_id', $id);
		$this->eqDb->delete('recipes_ingredients');

		$this->eqDb->where('ingredient_id', $id);
		$this->eqDb->delete('recipes_sub_ingredients');
			
		return [
			'r'        => 'success',
			'redirect' => '/clients'
		];	
	}

	public function updateChannel(int $id) {

		$id               = $this->eqDb->escape($id);
		$name             = empty($_POST['name']) ? false : $this->eqDb->escape($_POST['name']);
		$address          = empty($_POST['client-add']) ? false : $this->eqDb->escape($_POST['client-add']);
		$description      = $this->eqDb->escape($_POST['description']);
		$lat              = $this->eqDb->escape($_POST['lat']);
		$long             = $this->eqDb->escape($_POST['long']);
		$city             = $this->eqDb->escape($_POST['city']);
		$country          = $this->eqDb->escape($_POST['country']);
		$phone            = $this->eqDb->escape($_POST['phone']);
		$channelColor     = $this->eqDb->escape($_POST['channelColor']);
		$channelTextColor = $this->eqDb->escape($_POST['channelTextColor']);
		$mainContact      = $this->eqDb->escape($_POST['mainContact']);
		$isWeekly         = 0;
		$days             = null;

		$dayPlanner = [];

		if(!empty($_POST['isWeekly'])) {
			$isWeekly = 1;

			if(!empty($_POST['days']) && is_array($_POST['days'])) {
				$days = json_encode($_POST['days']);

				foreach($_POST['days'] as $key => $val) {
					$dayPlanner[$val] = [
						'start' 	 => $_POST[$val . '-from'],
						'end'   	 => $_POST[$val . '-to'],
						'event_type' => $_POST[$val . '-eventType']
					];
				}
			}
		}

		$data = [
			'address'   	=> $address,
			'description'   => $description,
			'lat'           => $lat,
			'long'          => $long,
			'city'          => $city,
			'country'       => $country,
			'phone'         => $phone,
			'main_contact'  => $mainContact,
			'channel_color' => $channelColor,
			'channel_text'  => $channelTextColor,
			'isWeekly'      => $isWeekly,
			'days'          => $days,
			'days_plan'     => serialize($dayPlanner)
		];

		if($name) {
			$data['name'] = $name;
		}

		$this->eqDb->where ('id', $id);

		if ($this->eqDb->update ('channels', $data)) {
			return [
				'r'       => 'success',
				'message' => '<strong>Success!</strong> Client Saved!'
			];	
		}

		return [
			'r' => 'danger'
		];	
	}

	public function loadSubRecipes() {

	    $subs = $this->eqDb->subQuery ('r');
		$subs->get('recipes', null, 'id, name');

		$this->eqDb->orderBy ("sr.id","asc");
		$this->eqDb->orderBy ("container","asc");
		$this->eqDb->join ($subs, 'sr.recipe_id = r.id', 'LEFT');
		$subRecipes = $this->eqDb->get ('recipes_sub sr', null, 'sr.id, sr.recipe_id, CONCAT(sr.container_size," oz") AS containerSize, sr.container AS container, r.name');

		$arr = [];

		foreach($subRecipes as $sub) {

			$subArr = [];

			$subArr['id']            = $sub['id'];
			$subArr['recipe_id']     = $sub['recipe_id'];
			$subArr['name']          = $sub['name'];
			$subArr['container']     = $sub['container'];
			$subArr['containerSize'] = $sub['containerSize'];

			array_push($arr, $subArr);
		}

		$group = [];

		foreach ( $arr as $value ) {
		    $group[$value['name']][] = $value;
		}

		return $group;
	}

}