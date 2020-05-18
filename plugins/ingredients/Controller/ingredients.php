<?php

class Ingredients extends Controller {

    function __construct() {

        if (empty($_SESSION['scouty_email'])) {
            header('location: ' . _SITEROOT_);
            exit;
        }
        
        parent::__construct();
    }

    public function index() {

        if(!empty($_POST['fetchIngredients'])) {
            echo json_encode($this->model->loadIngredients());
            exit;
        }

        $this->bodyClass = 'fixed-header';
        $this->loadPage();
        $this->render('index');
        $this->loadFooter();
    }

    public function add() {

        if(!empty($_POST['name']) && !empty($_POST['ppg']) && !empty($_POST['description'])) {
            echo json_encode($this->model->addIngredient());
            exit;
        }

        $this->bodyClass = 'fixed-header';
        $this->loadPage();
        $this->render('add');
        $this->loadFooter();
    }

    public function edit(int $id) {

        if(!empty($_POST['categories']) && !empty($_POST['description'])) {
            echo json_encode($this->model->updateIngredient($id));
            exit;
        }

        if(!empty($_POST['delete'])) {
            echo json_encode($this->model->deleteIngredient($id));
            exit;
        }

        if(!empty($_POST['loadVariations'])) {
            echo json_encode($this->model->loadVariations($id));
            exit;
        }

        if(!empty($_POST['loadSingleVariation'])) {
            echo json_encode($this->model->loadSingleVariation($id));
            exit;
        }

        if(!empty($_POST['shop']) && !empty($_POST['brand']) && !empty($_POST['package']) && !empty($_POST['weight']) && !empty($_POST['price'])) {
            echo json_encode($this->model->saveVariations($id));
            exit;
        }

        $this->ingredient = $this->model->loadIngredient($id);       

        if (count($this->ingredient) == 0) {
            header('location: ' . _SITEROOT_ . 'ingredients');
            exit;
        }

        $this->bodyClass = 'fixed-header';
        $this->loadPage();
        $this->render('edit');
        $this->loadFooter();
    }
}

?>