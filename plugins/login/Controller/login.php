<?php

class Login extends Controller {

  function __construct() {
    parent::__construct();
  }

  public function index() {

    if(!empty($_POST['username']) && !empty($_POST['password'])) {
      $login = $this->model->process();
      echo json_encode($login);
      exit;
    }
  }

  public function logout() {
    
    unset($_SESSION['scouty_email']);
    unset($_SESSION['scouty_user_id']);
    unset($_SESSION['scouty_username']);
    unset($_SESSION['scouty_name']);
    unset($_SESSION['scouty_firstname']);
    unset($_SESSION['scouty_lastname']);
    unset($_SESSION['scouty_company_id']);
    unset($_SESSION['scouty_menu_status']);
    
    header( "refresh:0;". _SITEROOT_ );
    exit;
  }

}
?>
