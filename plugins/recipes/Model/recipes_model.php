<?php

class Recipes_Model extends Model {
	
	public function __construct() {

		global $eqDb;
	
		$this->eqDb = $eqDb;
		parent::__construct();
	}

	public function fetchIngredients() {

		$data = ['id', 'name', 'ppw'];
		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$ing  = $this->eqDb->get('ingredients', null, $data);

		return $ing;
	}

	public function fetchRecipe(int $id) {

		$id = $this->eqDb->escape($id);

		$this->eqDb->where('id', $id);
		$recipe = $this->eqDb->getOne('recipes');

	    if (empty($recipe)) {
	      header('location: ' . _SITEROOT_);
	      exit;
	    }

		//get all existing ingredients
	    $usersQ = $this->eqDb->subQuery ("i");
		$usersQ->get ("ingredients", null, 'id, name, ppw');

		$this->eqDb->join($usersQ, "ri.ingredient_id = i.id", "LEFT");

		$this->eqDb->where('recipe_id', $id);
		// $this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$ings = $this->eqDb->get('recipes_ingredients ri', null, 'i.name, i.ppw, ri.ingredient_id AS id');

		$recipe['ingredients'] = $ings;

		return $recipe;
	}	


	public function loadRecipes() {

        $page   = ($_POST['start']/$_POST['length']) + 1;
        $status = !empty($_POST['status']) ? $this->eqDb->escape($_POST['status']) : 0;

        $siteRoot = _SITEROOT_;

        $colsSort = [
        	null,
        	"name",
        	"description",
        	"category"
        ];

        $orderBy  = $colsSort[$_POST['order'][0]['column']];
        $orderDir = $_POST['order'][0]['dir'];

		$this->eqDb->pageLimit = $_POST['length'];

		if(!empty($_POST['search'])) {
			$search = $this->eqDb->escape($_POST['search']['value']);
			$this->eqDb->where('(name LIKE "%' . $search . '%" OR description LIKE "%' . $search . '%" OR category LIKE "%' . $search . '%")');
		}

		// $this->eqDb->where("deleted", $status);
		$this->eqDb->where("company_id", $_SESSION['scouty_company_id']);
		$this->eqDb->orderBy($orderBy, $orderDir);
		$recipes = $this->eqDb->withTotalCount()->arraybuilder()->paginate("recipes", $page, [
        	"id",
        	"name",
        	"CONCAT('<a href=\"" . $siteRoot . "recipes/edit/',id,'\" class=\"btn btn-rounded btn-xs btn-primary\">Edit</a>') AS editBtn",
        	"CONCAT('<a href=\"" . $siteRoot . "recipes/add-sub/',id,'\" class=\"btn btn-xs btn-primary pull-right\">New Variation</a>') AS newSubBtn",
        	"description",
        	"category"
        ]);

        $toalPages  = $this->eqDb->totalPages;
		$totalCount = $this->eqDb->totalCount;

		$data = [];
		foreach($recipes as $recipe) {

			$recipeIngredients = $this->fetchRecipeIngredients($recipe['id']);
			$subRecipes = 		 $this->loadSubs($recipe['id']);

			array_push($data, [
				'id'          => $recipe['id'],
				'name'		  => $recipe['name'],
				'editBtn'     => $recipe['editBtn'],
				'newSubBtn'   => $recipe['newSubBtn'],
				'description' => $recipe['description'],
				'category'    => $recipe['category'],
				'subRecipes'  => $subRecipes,
				'ings'		  => $recipeIngredients
			]);
		}

		$response = [
			'totalPages'           => $toalPages,
			'iTotalDisplayRecords' => $totalCount,
			'iTotalRecords'        => $totalCount,
			'data'                 => $data
		];

		return $response;
	}

	/*
		Get ingredient information by its id
	*/
	public function getIngredientName($id) {

		$id = $this->eqDb->escape($id);

		$this->eqDb->where('id', $id);
		$ingredientInfo = $this->eqDb->get('ingredients', null, '*');

		return $ingredientInfo;
	}

	public function fetchRecipeIngredients(int $id) {

		$id = $this->eqDb->escape($id);

		$usersQ = $this->eqDb->subQuery ("i");
		$usersQ->where('company_id', $_SESSION['scouty_company_id']);
		$usersQ->get ("ingredients", null, 'id, name, ppw');

		$this->eqDb->join($usersQ, "r.ingredient_id = i.id", "LEFT");


		$this->eqDb->where('recipe_id', $id);
		$this->eqDb->orderBy('ingName', 'ASC');
		$recipeIngredients = $this->eqDb->get('recipes_ingredients r', null, [
			'r.id',
			'i.id as ingredientId',
			'i.name AS ingName',
			'i.ppw AS ingredientPricePerWeight'
		]);

		return $recipeIngredients;
	}

	public function addRecipe() {

		$name             = $this->eqDb->escape($_POST['name']);
		$description      = $this->eqDb->escape($_POST['description']);
		$categories       = $this->eqDb->escape($_POST['category']);
		$ingredientsArray = $this->eqDb->escape($_POST['ingredientsArray']);

		$data = [
			'name'        => $name,
            'description' => $description,
            'category'    => $categories,
            'company_id'  => $_SESSION['scouty_company_id']
		];

		$id = $this->eqDb->insert('recipes', $data);

		if($id) {
			$ingredientsArray = json_decode(stripslashes($ingredientsArray), 1);

			foreach($ingredientsArray as $ing) {

				$data = [
					"recipe_id"     => $id,
					"ingredient_id" => $ing['id']
				];

				$this->eqDb->insert('recipes_ingredients', $data);
			}

			return [
				'r'        => 'success', 
				'redirect' => '/recipes'
			];
		} else {
			return [
				'r'       => 'fail', 
				'message' => '<strong>Sorry!</strong> There was an internal error!'
			];
		}
	}

	public function deleteRecipe(int $id) {

		$id = $this->eqDb->escape($id);

		$this->eqDb->where('id', $id);
		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->delete('recipes');

		$this->eqDb->where('recipe_id', $id);
		$this->eqDb->delete('recipes_ingredients');

		$this->eqDb->where('recipe_id', $id);
		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->delete('recipes_sub');
			
		return [
			'r'        => 'success',
			'redirect' => '/recipes'
		];	
	}

	public function saveRecipe(int $id) {

		$name             = $this->eqDb->escape($_POST['name']);
		$categories       = $this->eqDb->escape($_POST['category']);
		$description      = $this->eqDb->escape($_POST['description']);
		$ingredientsArray = $this->eqDb->escape($_POST['ingredientsArray']);

		$data = [
			'name'        => $name,
            'description' => $description,
            'category'    => $categories
		];

		$this->eqDb->where('id', $id);
		$update = $this->eqDb->update('recipes', $data);

		if($update) {
			$ingredientsArray = json_decode(stripslashes($ingredientsArray), 1);
			//delete all ingredients from 

			$newIngs = [];
			foreach($ingredientsArray as $val) {
				array_push($newIngs, $val['id']);
			}

			$this->eqDb->where('recipe_id', $id);
			$recipeIngs = $this->eqDb->get('recipes_ingredients');

			foreach($recipeIngs as $val) {
				if(!in_array($val['ingredient_id'], $newIngs)) {
					$this->eqDb->where('ingredient_id', $val['ingredient_id']);
					$this->eqDb->where('recipe_id', $id);
					$del = $this->eqDb->delete('recipes_ingredients');
					
					$newIngs = array_diff($newIngs, [$val['ingredient_id']]);
				}
			}

			foreach($newIngs as $val) {

				$this->eqDb->where('ingredient_id', $val);
				$this->eqDb->where('recipe_id', $id);
				$recipeIngs = $this->eqDb->get('recipes_ingredients');
				if(!count($recipeIngs)) {
					$data = [
						"recipe_id"     => $id,
						"ingredient_id" => $val
					];

					$add = $this->eqDb->insert('recipes_ingredients', $data);
				}
			}

			return [
				'r'       => 'success', 
				'message' => '<strong>Success!</strong> Recipe was saved!'
			];
		} else {
			return [
				'r'       => 'fail', 
				'message' => '<strong>Sorry!</strong> There was an internal error!'
			];
		}
	}

	public function checkIfSubRecipeHasOrders($id) {

		$id = $this->eqDb->escape($id);

		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->where('sub_recipe_id', $id);

		$subRecipes = $this->eqDb->get('forecast_recipes r', null, '*');

		if(count($subRecipes)) {
			return true;
		}
		
		return false;
	}

	public function fetchSubRecipe($id) {

		$id = $this->eqDb->escape($id);

		$recipe = $this->eqDb->subQuery("i");
		$recipe->get("recipes", null, 'id,name');

		$this->eqDb->join($recipe, "r.recipe_id = i.id", "LEFT");

		$this->eqDb->where('r.id', $id);
		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);

		$subRecipe = $this->eqDb->getOne('recipes_sub r', null, '*,i.name AS recipeName, r.recipe_id AS recipe_id');

		if(empty($subRecipe)) {
      		header('location: ' . _SITEROOT_ . 'recipes');
      		exit;
		}

		$array                   = [];
		$array['id']             = $subRecipe['id'];
		$array['name']           = $subRecipe['name'];
		$array['recipe_id']      = $subRecipe['recipe_id'];
		$array['price']          = $subRecipe['price'];
		$array['container']      = $subRecipe['container'];
		$array['container_size'] = $subRecipe['container_size'];
		$array['loss_variable']  = $subRecipe['loss_variable'];

		$recipeIngredients = $this->fetchRecipeIngredients($subRecipe['recipe_id']);
		$json_array = [];

		foreach($recipeIngredients as $b) {

			$json_array2          = [];
			$json_array2['id']    = $b['ingredientId'];
			$json_array2['name']  = $b['ingName'];
			$json_array2['price'] = $b['ingredientPricePerWeight'];

			$this->eqDb->where('recipe_sub_id', $id);
			$this->eqDb->where('ingredient_id', $b['ingredientId']);

			$sub_recipe_ing_weights = $this->eqDb->getOne('recipes_sub_ingredients', null, "ingredient_weight");
			$json_array2['weight']  = $sub_recipe_ing_weights['ingredient_weight'];

			array_push($json_array, $json_array2);
		}

		$array['ingredients'] = $json_array;

		return $array;
	}

	public function loadSubs($id) {

		$id = $this->eqDb->escape($id);

		$siteRoot = _SITEROOT_;

		$data = [
			"id",
			"CONCAT('$',price) AS price",
			"CONCAT('<a href=\"" . $siteRoot . "recipes/edit-sub/',id,'\" class=\"bold\">',container_size, ' oz ', container,'</a>') AS typePretty",
			"CONCAT(container_size, ' oz ', container) AS type"
		];

		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->where('recipe_id', $id);
		$subRecipes = $this->eqDb->get('recipes_sub rs', null, $data);

		$array = [];
		foreach($subRecipes as $key => $val) {

			$array_sub['id']          = $val['id'];
			$array_sub['price']       = $val['price'];
			$array_sub['type']        = $val['type'];
			$array_sub['typePretty']  = $val['typePretty'];

			//get all ingredients for this sub_recipe
			$ingredients = $this->eqDb->subQuery("i");

			$ingredients->where('company_id', $_SESSION['scouty_company_id']);
			$ingredients->get("ingredients", null, 'id, name, ppw');

			$this->eqDb->join($ingredients, "sr.ingredient_id = i.id", "LEFT");

			$this->eqDb->where('recipe_sub_id', $val['id']);
			$this->eqDb->orderBy('ingName', 'ASC');

			$array_sub['ings'] = $this->eqDb->get('recipes_sub_ingredients sr', null, [
				'ingredient_id AS id', 
				'CONCAT(ingredient_weight, " gms") AS weight',
				'i.name AS ingName'
			]);

			array_push($array, $array_sub);
		}

		return $array;
	}

	public function saveSubRecipe(int $id) {

		$recipeId      = $id;
		$price         = $this->eqDb->escape($_POST['price']);
		$loss_variable = $this->eqDb->escape($_POST['loss_variable']);

		$this->hasOrders = $this->checkIfSubRecipeHasOrders($id);

		if(!$this->hasOrders) {
			$container     = $this->eqDb->escape($_POST['container']);
			$containerSize = $this->eqDb->escape($_POST['containerSize']);
		}

		//check if that subrecipe exists first 
		$this->eqDb->where('id', $id);
		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$find = $this->eqDb->get('recipes_sub', null, ['*']);

		if(count($find)) {

			// lets check if the user changed the combination of container and 
			// container size, and if so lets check in the db if this container and container size exists 
			// for this recipe type
			if(!$this->hasOrders && ($find[0]['container'] !== $container || $find[0]['container_size'] != $containerSize)) {

				$this->eqDb->where('id', $id);
				$this->eqDb->where('recipe_id', $recipeId);
				$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
				$this->eqDb->where('(container = "' . $container . '") OR (container_size = "' . $containerSize . '")');
				$find2 = $this->eqDb->get('recipes_sub', null, ['id']);

				if(count($find2)) {
					return [
						'r'       => 'fail', 
						'type'    => 'warning',
						'message' => '<strong>Sorry!</strong> The combination of ' . $containerSize . 'oz ' . $container . ' already exists'
					];
				}
			}
			// if that combination does not exist, then lets move on to save it.

			// this sub recipe exists lets start to save it

			if($this->hasOrders) {
				// if there are orders for this sub recipe, only save the price and loss_variable	
				$data = [
		            'price'          => $price,
	        		'loss_variable'  => $loss_variable
				];
			} else {
			
				$data = [
		            'container'      => $container,
		            'container_size' => $containerSize,
		            'price'          => $price,
	        		'loss_variable'  => $loss_variable
				];
			}

			$this->eqDb->where('id', $recipeId);

			$recipe_sub_id = $this->eqDb->update('recipes_sub', $data);

			if($recipe_sub_id) {

				
				$this->eqDb->where('recipe_sub_id', $id);
				$this->eqDb->delete('recipes_sub_ingredients');

				foreach($_POST as $key => $val) {

					if(substr( $key, 0, 6 ) === "price_") {

						$ingredient_id = str_replace("price_", "", $key);
						$recipe_sub_id = $this->eqDb->insert('recipes_sub_ingredients', [
							'recipe_sub_id'     => $id,
				            'ingredient_id'     => $ingredient_id,
				            'ingredient_weight' => $val
						]);
					}
				}

				$this->updateForecastSubRecipeWeightsAndPrice($id, $price);

				return [
					'r'       => 'success', 
					'message' => '<strong>Success!</strong> Sub-recipe saved'
				];

			} else {
				return [
					'r'       => 'fail', 
					'type'    => 'warning',
					'message' => '<strong>Sorry!</strong> There was an internal error! (422)'
				];
			}
		} else {
			return [
				'r'       => 'fail', 
				'type'    => 'warning',
				'message' => '<strong>Sorry!</strong> There was an internal error (421)'
			];
		}
	}

	public function updateForecastSubRecipeWeightsAndPrice(int $subRecipeId, $price) {

		$mondayLastWeek    = date('Y-m-d', strtotime('monday last week'));
        $endOfLastWeek     = date('Y-m-d', strtotime($mondayLastWeek . ' + 6 days'));

        $dateRange = $mondayLastWeek . '|' . $endOfLastWeek;

        $this->eqDb->where('date_range > "' . $dateRange . '"');
        $this->eqDb->where('sub_recipe_id', $subRecipeId);
        $this->eqDb->orderBy('date_range', 'ASC');
        $forecastRecs = $this->eqDb->get('forecast_recipes', null, 'id, date_range, total, sub_recipe_id');

        foreach($forecastRecs as $key => $val) {

            $subRecipeId    = $val['sub_recipe_id'];

            $subs = $this->eqDb->subQuery ('i');
            $subs->where('company_id', $_SESSION['scouty_company_id']);
            $subs->get('ingredients', null, 'id, name');

            $this->eqDb->join($subs, 'sr.ingredient_id = i.id', 'LEFT');

            $this->eqDb->where('sr.recipe_sub_id', $subRecipeId);

            $instantaneousIngredients = $this->eqDb->get('recipes_sub_ingredients sr',null,'i.id,  sr.recipe_sub_id, i.id as ingredient_id, ingredient_weight,i.name AS name, (ingredient_weight * ' . $val['total'] . ') AS total');

            $instIngWeights = addslashes(json_encode($instantaneousIngredients));

            $this->eqDb->rawQuery('UPDATE forecast_recipes SET instantaneous_subrecipe_ing_weights = "' . $instIngWeights . '", instantaneous_subrecipe_price = "' . $price . '" WHERE id = "' . $val['id'] . '"');
        }

	}

	public function addSubRecipe(int $id) {

		$recipeId      = $id;
		$price         = $this->eqDb->escape($_POST['price']);
		$container     = $this->eqDb->escape($_POST['container']);
		$containerSize = $this->eqDb->escape($_POST['containerSize']);
		$loss_variable = $this->eqDb->escape($_POST['loss_variable']);

		//chekc if container and container size exist already...
		$this->eqDb->where('recipe_id', $id);
		$this->eqDb->where('container', $container);
		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->where('container_size', $containerSize);
		$find = $this->eqDb->get('recipes_sub', null, ['id']);

		if(count($find)) {
			return [
				'r'       => 'fail', 
				'type'    => 'danger',
				'message' => '<strong>Sorry!</strong> You already have that combination of container and container size for this recipe!'
			];
			exit;
		}

		$data = [
			'recipe_id'      => $id,
            'price'          => $price,
            'container'      => $container,
            'container_size' => $containerSize,
            'loss_variable'  => $loss_variable,
            'company_id'     => $_SESSION['scouty_company_id']
		];

		$recipe_sub_id = $this->eqDb->insert('recipes_sub', $data);

		if($recipe_sub_id) {

			foreach($_POST as $key => $val) {
				$arr = [];
				if(substr( $key, 0, 6 ) === "price_") {

					$ingredient_id = str_replace("price_", "", $key);
					
					$data = [
						'recipe_sub_id'     => $recipe_sub_id,
			            'ingredient_id'     => $ingredient_id,
			            'ingredient_weight' => $val
					];

					$this->eqDb->insert('recipes_sub_ingredients', $data);

				}
			}

			return [
				'r'        => 'success', 
				'redirect' => '/recipes'
			];

		} else {
			return [
				'r'       => 'fail', 
				'type'    => 'warning',
				'message' => '<strong>Sorry!</strong> There was an internal error!'
			];
		}
	}
}