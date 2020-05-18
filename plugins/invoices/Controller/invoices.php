<?php

class Invoices extends Controller {

    function __construct(){

        if (!isset($_SESSION['scouty_email'])) {
            header('location: ' . _SITEROOT_);
            exit;
        }

        parent::__construct();
    }

    public function index() {

        if(!empty($_POST['fetchInvoices'])) {
            echo json_encode($this->model->fetchInvoices());
            exit;
        }

        $this->pagecontentclass = 'bg-white';
        $this->bodyClass        = 'fixed-header';
        $this->loadPage();
        $this->render('index');
        $this->loadFooter();
    }
}

?>