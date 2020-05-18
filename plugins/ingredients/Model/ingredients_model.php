<?php

class Ingredients_Model extends Model {
	
	public function __construct() {

		global $eqDb;
	
		parent::__construct();

		$this->eqDb = $eqDb;
	}

	public function addIngredient() { 

		$name = $this->eqDb->escape($_POST['name']);
		$ppg = $this->eqDb->escape($_POST['ppg']);
		$categories = $this->eqDb->escape($_POST['categories']);
		$description = $this->eqDb->escape($_POST['description']);

		$data = [
			'name' => $name,
			'ppw' => $ppg,
			'description' => $description,
            'categories' => $categories,
            'company_id' => $_SESSION['scouty_company_id'],
		];

		$a = $this->eqDb->insert('ingredients', $data);

		if($a) {

			$data = [
				'data_id' => $a,
				'data_type' => 'ingredients',
				'value' => $ppg,
				'timestamp' => date('Y-m-d h:i:s')
			];

			$this->eqDb->insert('historical_records', $data);

			return ['r' => 'true', 'redirect' => '/ingredients'];
		} 
		return ['r' => 'false'];
	}

	public function loadIngredients() {

		$start = $this->eqDb->escape($_POST['start']);
		$length = $this->eqDb->escape($_POST['length']);

        $page = ($start/$length) + 1;

        $siteRoot = _SITEROOT_;

        $cols = [
        	"id",
        	"CONCAT('<a href=\"" . $siteRoot . "ingredients/edit/', id, '" . $siteRoot . "\">', name, '</a>') as prettyName",
        	"name",
        	"ppw",
        	"description",
        	"categories"
        ];

        $colsAfter = [
        	'name',
        	'categories'
        ];

        $orderBy  = $colsAfter[$_POST['order'][0]['column']];
        $orderDir = $_POST['order'][0]['dir'];

		$this->eqDb->pageLimit = $_POST['length'];

		if(!empty($_POST['search'])) {
			$search = $this->eqDb->escape($_POST['search']['value']);
			$this->eqDb->where('(categories LIKE "%' . $search . '%" OR name LIKE "%' . $search . '%")');
		}

		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->orderBy($orderBy, $orderDir);
		$users = $this->eqDb->arraybuilder()->paginate('ingredients', $page, $cols);

		$response = [
			'totalPages'           => $this->eqDb->totalPages,
			'iTotalDisplayRecords' => $this->eqDb->totalCount,
			'iTotalRecords'        => $this->eqDb->totalCount,
			'data'                 => $users
		];

		return $response;
	}

	public function loadIngredient(int $id) {

		$id = $this->eqDb->escape($id);

        $cols = ["id", "name", "ppw", "categories", "description"];

		$this->eqDb->where("company_id", $_SESSION['scouty_company_id']);
		$this->eqDb->where("id", $id);
		$response = $this->eqDb->getOne("ingredients", null, $cols);

		return $response;
	}

	public function loadSingleVariation(int $id) {

		$variation_id  = $this->eqDb->escape($_POST['loadSingleVariation']);
		$ingredient_id = $this->eqDb->escape($id);

		$cols = [
			'id',
			'ingredient_id', 
			'store_name', 
			'brand_name', 
			'container_type', 
			'container_weight',
			'ROUND(price/container_weight,4) AS price_per_gram',
			'ROUND(price,2) AS price'
		];

		$this->eqDb->where("id", $variation_id);
		$this->eqDb->where("ingredient_id", $ingredient_id);

		$response = $this->eqDb->getOne("ingredients_variations", null, $cols);

		return $response;
	}

	public function loadVariations(int $id) {

		$id = $this->eqDb->escape($id);

		$cols = [
			'id',
			'ingredient_id', 
			'store_name', 
			'brand_name', 
			'container_type', 
			'container_weight',
			'ROUND(price/container_weight,4) AS price_per_gram',
			'ROUND(price,2) AS price'
		];

		$this->eqDb->where("ingredient_id", $id);

		$response = $this->eqDb->get("ingredients_variations", null, $cols);

		if($response == null) {
			return [];
		}

		return $response;
	}

	public function deleteIngredient(int $id) {

		$id = $this->eqDb->escape($id);

		$this->eqDb->where('id', $id);
		$this->eqDb->delete('ingredients');

		$this->eqDb->where('ingredient_id', $id);
		$this->eqDb->delete('recipes_ingredients');

		$this->eqDb->where('ingredient_id', $id);
		$this->eqDb->delete('recipes_sub_ingredients');
			
		return [
			'r' => 'success',
			'redirect' => _SITEROOT_ . 'ingredients'
		];	
	}

	public function saveVariations(int $id) {

		$id      = $this->eqDb->escape($id);		
		$shop    = $this->eqDb->escape($_POST['shop']);
		$brand   = $this->eqDb->escape($_POST['brand']);
		$package = $this->eqDb->escape($_POST['package']);
		$weight  = $this->eqDb->escape($_POST['weight']);
		$price   = $this->eqDb->escape($_POST['price']);
		$vari    = $this->eqDb->escape($_POST['variation-id']);
		
		if($vari != '') {

			$data = [
				'store_name' 	   => $shop,
				'brand_name' 	   => $brand,
				'container_type'   => $package,
				'container_weight' => $weight,
				'price'            => $price
			];

			$this->eqDb->where ('id', $vari);
			if ($this->eqDb->update ('ingredients_variations', $data)) {
				return [
					'type' => 'success'
				];
			} else {

				return [
					'type'    => 'danger',
					'message' => '<strong>Sorry!</strong> There was an internal error (51231)'
				];
			}

			exit;
		}

		$this->eqDb->where("ingredient_id", $id);
		$this->eqDb->where("store_name", $shop);
		$this->eqDb->where("brand_name", $brand);
		$this->eqDb->where("container_type", $package);
		$this->eqDb->where("container_weight", $weight);
		$this->eqDb->where("price", $price);
		$this->eqDb->orderBy("id", "DESC");

		// First check if this combination is taken
		$response = $this->eqDb->get("ingredients_variations", null, '*');
		if(count($response)) {
			return [
				'type'    => 'danger',
				'message' => '<strong>Sorry!</strong> This combination exists already!'
			];
		}

		$data = [
			'ingredient_id'    => $id,
			'store_name' 	   => $shop,
			'brand_name' 	   => $brand,
			'container_type'   => $package,
			'container_weight' => $weight,
			'price'            => $price
		];

		$a = $this->eqDb->insert('ingredients_variations', $data);

		return [
			'type' => 'success'
		];

	}

	public function updateIngredient(int $id) {

		$id          = $this->eqDb->escape($id);
		$categories  = $this->eqDb->escape($_POST['categories']);
		$description = $this->eqDb->escape($_POST['description']);

		$data = [
			'description' => $description,
            'categories'  => $categories
		];

		$this->eqDb->where ('id', $id);
		if ($this->eqDb->update ('ingredients', $data)) {

			return [
				'r' => 'success',
				'message' => '<strong>Success!</strong> Ingredient saved!'
			];	
		}

		return [
			'r' => 'fail'
		];	

	}

}