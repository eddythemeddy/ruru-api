<?php

class Recipes extends Controller {

  private $_memberHelper;

  function __construct() {

    if (empty($_SESSION['scouty_email'])) {
      header('location: ' . _SITEROOT_);
      exit;
    }

    parent::__construct();
  }

  public function index() {
    
    if(!empty($_POST['loadRecipes'])) {
      echo json_encode($this->model->loadRecipes());
      exit;
    }

    $this->bodyClass = 'fixed-header';
    $this->title = '';
    $this->loadPage();
    $this->render('index');
    $this->loadFooter();
  }

  public function add() {

    if(!empty($_POST['name']) && !empty($_POST['description']) && !empty($_POST['ingredientsArray']) && !empty($_POST['category'])) {
        echo json_encode($this->model->addRecipe());
        exit;
    }

    $this->ingredients = $this->model->fetchIngredients();

    $this->bodyClass   = 'fixed-header';
    $this->loadPage();
    $this->render('add');
    $this->loadFooter();
  }

  public function edit(int $id) {

    if(!empty($_POST['name']) && !empty($_POST['description']) && !empty($_POST['ingredientsArray']) && !empty($_POST['category'])) {
        echo json_encode($this->model->saveRecipe($id));
        exit;
    }

    if(!empty($_POST['delete'])) {
        echo json_encode($this->model->deleteRecipe($id));
        exit;
    }

    $this->recipe      = $this->model->fetchRecipe($id);
    $this->ingredients = $this->model->fetchIngredients();

    $this->bodyClass   = 'fixed-header';
    $this->loadPage();
    $this->render('edit');
    $this->loadFooter();
  }

  public function addSub(int $id) {

    if(!empty($_POST['price']) && !empty($_POST['container']) && !empty($_POST['containerSize'])) {
        echo json_encode($this->model->addSubRecipe($id));
        exit;
    }

    $this->recipeDetails = $this->model->fetchRecipe($id);
    $this->ingDetails    = $this->model->fetchRecipeIngredients($id);

    $this->bodyClass = 'fixed-header';
    $this->loadPage();
    $this->render('add-sub');
    $this->loadFooter();
  }

  public function editSub(int $id) {

    $this->hasOrders     = $this->model->checkIfSubRecipeHasOrders($id);
    $this->recipeDetails = $this->model->fetchSubRecipe($id);

    if(!empty($_POST['price'])) {
      echo json_encode($this->model->saveSubRecipe($id));
      exit;
    }

    if(count($this->recipeDetails) == 0) {
      header('location: ' . _SITEROOT_ . 'recipes');
      exit;
    }

    $this->bodyClass = 'fixed-header';
    $this->loadPage();
    $this->render('edit-sub');
    $this->loadFooter();
  }
}

?>