<?php

class Clients extends Controller {

    private $memberHelper;

    function __construct() {

        if (!isset($_SESSION['scouty_email'])) {
            header('location: ' . _SITEROOT_);
            exit;
        }
    }

    public function index() {

        if(!empty($_GET['fetchClients'])) {
            echo json_encode($this->model->loadClients());
            exit;
        }
    }

    public function add() {

        if(isset($_POST['name']) && isset($_POST['client-add']) && isset($_POST['mainContact']) && isset($_POST['phone']) && isset($_POST['description'])) {
            echo json_encode($this->model->addClient());
            exit;
        }

        $locationHelper = new LocationHelper();
        $this->countriesDD = $locationHelper->getCountriesOptions();
    }

    public function edit(int $id) {

        if(isset($_POST['description'])) {
            echo json_encode($this->model->updateChannel($id));
            exit;
        }

        if(isset($_POST['delete'])) {
            echo json_encode($this->model->deleteChannel($id));
            exit;
        }


        $this->hasOrders = $this->model->checkIfClientHasOrders($id);

        $this->channel = $this->model->loadClient($id);
        $this->channelBgColor = empty($this->channel['channel_color']) ? '#3395ed' : $this->channel['channel_color'];
        $this->channelTextColor = empty($this->channel['channel_text']) ? '#fff' : $this->channel['channel_text'];

        $this->subRecipes = $this->model->loadSubRecipes();

        $locationHelper = new LocationHelper();
        $this->countriesDD = $locationHelper->getCountriesOptions($this->channel['country']);
        $this->days = [];

        if(!empty($this->channel['days'])) {
            $this->days = json_decode($this->channel['days'], 1);
        }        

        $this->dayPlanner = unserialize($this->channel['days_plan']);
        $this->dayPlanner = $this->dayPlanner == false ? [] : $this->dayPlanner;

        if (count($this->channel) == 0) {
            header('location: ' . _SITEROOT_ . 'clients');
            exit;
        }
    }
}

?>