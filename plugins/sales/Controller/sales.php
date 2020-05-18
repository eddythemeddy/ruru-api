<?php

class Sales extends Controller {

    function __construct(){

        if (!isset($_SESSION['scouty_email'])) {
            header('location: ' . _SITEROOT_);
            exit;
        }

        parent::__construct();
    }

    public function index() {

        if(!empty($_POST['fetchSales'])) {
            echo json_encode($this->model->fetchSales());
            exit;
        }

        $this->title     = 'Sales';
        $this->bodyClass = 'fixed-header';
        $this->loadPage();
        $this->render('index');
        $this->loadFooter();
    }

    public function reports() {

        if(!empty($_POST['getSalesData'])) {
            echo json_encode($this->model->getSalesData());
            exit;
        }

        $this->title     = 'Sales Reports';
        $this->bodyClass = 'fixed-header';
        $this->loadPage();
        $this->render('reports');
        $this->loadFooter();
    }

    public function resolve(string $eventId) {

        if(!empty($_POST['udpateForecastSubRecipe'])) {
            echo json_encode($this->model->udpateForecastSubRecipe($eventId));
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

        if(!empty($_POST['loadTransactions'])) {
            echo json_encode($this->model->loadTransactions($eventId));
            exit;
        }

        if(!empty($_POST['date-of-payment']) && !empty($_POST['method'])) {
            echo json_encode($this->model->submitTransaction($eventId));
            exit;
        }

        $this->event      = $this->model->getSalesDetails($eventId);
        $this->eventId    = $eventId;

        $this->title     = 'Resolve SL#' . $eventId;
        $this->bodyClass = 'fixed-header';
        $this->loadPage();
        $this->render('resolve');
        $this->loadFooter();
    }

    public function invoice($eventId) {
        
        $this->invoiceData    = $this->model->getInvoiceByEventId($eventId);
        $this->companyAddress = $this->model->prettifyAddress($_SESSION['scouty_company_add']);

        $this->bodyClass = 'fixed-header';
        $this->loadPage();
        $this->render('invoice');
        $this->loadFooter();
    }

}

?>