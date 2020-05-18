<?php

class Admin extends Controller {

    function __construct() {

        parent::__construct();
    }

    public function index() {

        if (empty($_SESSION['ru_admin_user_id'])) {
          header('location: ' . _SITEROOT_ . 'admin/login');
          exit;
        }

        if(!empty($_POST['fetchCompanies'])) {
            echo json_encode($this->model->loadCompanies());
            exit;
        }
        
        $this->loadPage();
        $this->render('index');
        $this->loadFooter();
    }

    public function company(int $id) {

        if (empty($_SESSION['ru_admin_user_id'])) {
          header('location: ' . _SITEROOT_ . 'admin/login');
          exit;
        }

        if(!empty($_POST['fetchUsers'])) {
            echo json_encode($this->model->loadUsers($id));
            exit;
        }

        if(!empty($_POST['updateUserStatus'])) {
            echo json_encode($this->model->updateUserStatus());
            exit;
        }

        if(!empty($_POST['name']) && !empty($_POST['country']) && !empty($_POST['city']) && !empty($_POST['lat']) && !empty($_POST['long']) && !empty($_POST['company-add']) && !empty($_POST['timezone']) && !empty($_POST['timezoneHour']) && !empty($_POST['phone']) && !empty($_POST['email'])) {
            echo json_encode($this->model->updateCompany($id));
            exit;
        }

        $locationHelper    = new LocationHelper();

        $this->company     = $this->model->getCompanyDetails($id);
        $this->countriesDD = $locationHelper->getCountriesOptions($this->company['country']);
        
        $this->loadPage();
        $this->render('company');
        $this->loadFooter();
    }

    public function addUser(int $id) {

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

        if(!empty($_POST['firstname']) && 
        !empty($_POST['lastname']) && !empty($_POST['username']) && !empty($_POST['email'])) {
            echo json_encode($this->model->createUser($id));
            exit;
        }
        
        $this->loadPage();
        $this->render('add-user');
        $this->loadFooter();
    }

    public function editUser(int $id) {

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

        $this->title     = "Edit User";
        $this->loadPage();
        $this->render('edit-user');
        $this->loadFooter();

    }

    public function login() {

        if (!empty($_SESSION['ru_admin_user_id'])) {
          header('location: ' . _SITEROOT_ . 'admin');
          exit;
        }

        if(isset($_POST['username']) && isset($_POST['password'])) {
            echo json_encode($this->model->process());
            exit;
        }
        
        $this->loadPage();
        $this->render('login');
        $this->loadFooter();
    }

    public function logout() {

        unset($_SESSION['ru_admin_user_id']);
        unset($_SESSION['ru_admin_username']);

        header( "refresh:0;". _SITEROOT_ );
        exit;
    }


}

?>