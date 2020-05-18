<?php

require_once('libs/helpers/MemberHelper.php');

class Register extends Controller {

  function __construct() {
    parent::__construct();
  }

  function index() {

    if (isset($_SESSION['scouty_email'])) {
      header('location: ' . _SITEROOT_ . 'feed');
      exit;
    }

    if(isset($_POST['fname']) && isset($_POST['lname']) && isset($_POST['email']) && isset($_POST['password'])) {

      $login = $this->model->process();
      echo json_encode($login);
      exit;
    }

    if(isset($_POST['checkemail'])) {

      $member = new MemberHelper();
      $member->validateIfEmailIsTaken($_POST['email'],1);
      exit;
    }

    if(isset($_POST['checkusername'])) {

      $member = new MemberHelper();
      $member->validateIfUsernameIsTaken($_POST['username'],1);
      exit;
    }

    $this->title = "Register";
    $this->noMenu = true;
    $this->loadPage();
    $this->render('index');
    $this->loadFooter();
  }
}

?>