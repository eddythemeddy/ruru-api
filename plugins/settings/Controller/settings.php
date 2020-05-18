<?php

require_once('libs/helpers/MemberHelper.php');

class Settings extends Controller {

  function __construct(){

    if (!isset($_SESSION['scouty_email'])) {
        header('location: ' . _SITEROOT_);
        exit;
    }
    
    parent::__construct();
  }

  public function index() {

    $locationHelper    = new LocationHelper();

    $this->company     = $this->model->getCompanyDetails();
    $this->countriesDD = $locationHelper->getCountriesOptions($this->company['country']);

    if(!empty($_POST['name']) && !empty($_POST['country']) && !empty($_POST['city']) && !empty($_POST['lat']) && !empty($_POST['long']) && !empty($_POST['company-add']) && !empty($_POST['timezone']) && !empty($_POST['timezoneHour']) && !empty($_POST['phone']) && !empty($_POST['email'])) {
        echo json_encode($this->model->updateCompany());
        exit;
    }
    
    $this->bodyClass = 'fixed-header';
    $this->title 	 = 'Settings';
    $this->loadPage();
    $this->render('index');
    $this->loadFooter();

  }

  public function users() {

    if(!empty($_POST['fetchUsers'])) {
        echo json_encode($this->model->loadUsers());
        exit;
    }

    if(!empty($_POST['updateUserStatus'])) {
        echo json_encode($this->model->updateUserStatus());
        exit;
    }

	  $this->bodyClass = 'fixed-header';    
    $this->title 	 = 'Settings';
    $this->loadPage();
    $this->render('users');
    $this->loadFooter();

  }

  public function user(int $id) {

    $this->user = $this->model->getUserInfo($id);

    if(!empty($_POST['password'])) {
        echo json_encode($this->model->changePassword($id));
        exit;
    }

    if(!empty($_POST['firstname']) && !empty($_POST['lastname']) && !empty($_POST['username']) && !empty($_POST['email'])) {
        echo json_encode($this->model->updateUser($id));
        exit;
    }

    if(isset($_POST['checkemail'])) {
      $member = new MemberHelper();
      $member->validateIfEmailIsTaken($_POST['email'], $id, 1);
      exit;
    }

    if(isset($_POST['checkusername'])) {
      $member = new MemberHelper();
      $member->validateIfUsernameIsTaken($_POST['username'], $id, 1);
      exit;
    }

    if(!empty($_POST['updateUserStatus'])) {
        echo json_encode($this->model->updateUserStatus($id));
        exit;
    }

    $this->bodyClass = 'fixed-header';
    $this->title 	 = "Settings";
    $this->loadPage();
    $this->render('edit-user');
    $this->loadFooter();

  }

  public function addUser() {

    if(isset($_POST['checkemail'])) {
      $member = new MemberHelper();
      $member->validateIfEmailIsTaken($_POST['email'], 0, 1);
      exit;
    }

    if(isset($_POST['checkusername'])) {
      $member = new MemberHelper();
      $member->validateIfUsernameIsTaken($_POST['username'], 0, 1);
      exit;
    }

    if(!empty($_POST['firstname']) && !empty($_POST['lastname']) && !empty($_POST['username']) && !empty($_POST['email'])) {
        echo json_encode($this->model->createUser());
        exit;
    }
    
    $this->bodyClass = 'fixed-header';
    $this->title 	 = "Settings";
    $this->loadPage();
    $this->render('add-user');
    $this->loadFooter();

  }

}

?>