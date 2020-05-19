<?php

class Forecast extends Controller {

    private $memberHelper;

    function __construct() {

        if (empty($_SESSION['scouty_email'])) {
            header('location: ' . _SITEROOT_);
            exit;
        }
    }

    public function index($dateRange = null) {

        $this->range       = $dateRange;
        $this->rangeData   = $this->model->getForecastListView($dateRange);
        $this->rangeArray  = $this->model->getDateArrayFromRange($this->rangeData['rangeUgly']);
        $this->rangePretty = $this->model->prettifyDateRange($this->rangeData['rangeUgly']);

        if(!empty($_POST['fetchForecast'])) {
            echo json_encode($this->model->fetchForecast($this->rangeData['rangeUgly']));
            exit;
        }
    }

    public function prepSheet($dateRange = null) {
        $this->range       = $dateRange;
        $this->rangeData   = $this->model->getForecastListView($dateRange);

        
        $this->rangeArray  = $this->model->getDateArrayFromRange($this->rangeData['rangeUgly']);
        $this->rangePretty = $this->model->prettifyDateRange($this->rangeData['rangeUgly']);

        if(!empty($_POST['fetchForecast'])) {
            echo json_encode($this->model->fetchForecast($this->rangeData['rangeUgly']));
            exit;
        }
    }

    public function all() {

        if(!empty($_POST['fetchForecast'])) {
            echo json_encode($this->model->fetchForecast());
            exit;
        }
    }

    public function event(string $eventId) {

        if(!empty($_POST['udpateForecastSubRecipe'])) {
            echo json_encode($this->model->udpateForecastSubRecipe());
            exit;
        }

        if(!empty($_POST['deleteForecastSubRecipe'])) {
            echo json_encode($this->model->deleteForecastSubRecipe());
            exit;
        }

        if(!empty($_POST['addRecipeToEvent'])) {
            echo json_encode($this->model->addRecipeToEvent($eventId));
            exit;
        }

        $this->subRecipes = $this->model->loadSubRecipes();
        $this->event      = $this->model->getEventDetails($eventId);
        $this->eventId    = $eventId;
    }

    public function calendar() {

        header("Access-Control-Allow-Origin: *");

        if(!empty($_POST['loadForecasts'])) {
            echo json_encode($this->model->loadForecasts());
            exit;
        } 

        if(!empty($_POST['updateForecastTime'])) {
            echo json_encode($this->model->updateForecastTime());
            exit;
        } 

        if(!empty($_POST['forecastViaChannel'])) {
            echo json_encode($this->model->forecastViaChannel());
            exit;
        } 

        if(!empty($_POST['saveEvent'])) {
            echo json_encode($this->model->updateForecastTime());
            exit;
        } 

        if(!empty($_POST['deleteEvent'])) {
            echo json_encode($this->model->deleteEvent());
            exit;
        } 

        $this->channels         = $this->model->loadChannels();
        $this->subRecipes       = $this->model->loadSubRecipes();
    }

    public function purchaseOrder($range) {

        $this->pruchaseOrder = $this->model->createPurchaseOrder($range);
    }

    public function purchaseOrderEvent($event) {

        $this->pruchaseOrder = $this->model->createPurchaseOrder($event);
    }
}

?>
