<?php

class Settings_Model extends Model {
	
    public function __construct() {
	
		global $eqDb;
		$this->eqDb = $eqDb;
	}

	public function saveSettings() {

		$address = $this->eqDb->escape($_POST['address']);
		$lat     = $this->eqDb->escape($_POST['lat']);
		$long    = $this->eqDb->escape($_POST['long']);
		$city    = $this->eqDb->escape($_POST['city']);

		return [
			'r' => 'danger'
		];
	}

	public function getCompanyDetails() {

		$this->eqDb->where('id', $_SESSION['scouty_company_id']);
		$company = $this->eqDb->getOne('company', null, '*');

		if(count($company) == 0) {
        	header('location: ' . _SITEROOT_ . 'admin');
        	exit;
		}

		return $company;
	}

	public function updateCompany() {

		$name         = $this->eqDb->escape($_POST['name']);
		$country      = $this->eqDb->escape($_POST['country']);
		$city         = $this->eqDb->escape($_POST['city']);
		$lat          = $this->eqDb->escape($_POST['lat']);
		$long         = $this->eqDb->escape($_POST['long']);
		$address      = $this->eqDb->escape($_POST['company-add']);
		$timezone     = $this->eqDb->escape($_POST['timezone']);
		$timezoneHour = $this->eqDb->escape($_POST['timezoneHour']);
		$phone        = $this->eqDb->escape($_POST['phone']);
		$email        = $this->eqDb->escape($_POST['email']);

		$data = [
			'name'          => $name,
			'country'       => $country,
			'city'          => $city,
			'lat'           => $lat,
			'long'          => $long,
			'address'       => $address,
			'timezone'      => $timezone,
			'timezone_hour' => $timezoneHour,
			'phone_number'  => $phone,
			'email'         => $email
		];

		$this->eqDb->where('id', $_SESSION['scouty_company_id']);
		if ($this->eqDb->update ('company', $data)) {

			$_SESSION['scouty_company_name']    = $name;
			$_SESSION['scouty_company_add']     = $address;
			$_SESSION['scouty_company_email']   = $email;
			$_SESSION['scouty_company_phone']   = $phone;
			$_SESSION['scouty_company_city']    = $city;
			$_SESSION['scouty_company_country'] = $country;
			$_SESSION['scouty_company_tz']      = $timezone;

			return [
				'r'       => 'info',
				'message' => '<strong>Success!</strong> Company saved.'
			];	
		}

		return [
			'r'       => 'danger',
			'message' => '<strong>Error!</strong> Internal Error (2314)!'
		];
	}

	public function changePassword(int $id) {

		$password = $this->eqDb->escape($_POST['password']);
		$password = md5($password);

		$data = [
			'password' => $password
		];

		$this->eqDb->where('id', $id);
		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);

		if ($this->eqDb->update ('users', $data)) {
			return [
				'r'       => 'success',
				'message' => '<strong>Success!</strong> Password Changed!'
			];	
		}

		return [
			'r' 	  => 'danger',
			'message' => '<strong>Error!</strong> Internal Error (2312)!'
		];

	}

	public function createUser() {

		$firstname = $this->eqDb->escape($_POST['firstname']);
		$lastname  = $this->eqDb->escape($_POST['lastname']);
		$username  = $this->eqDb->escape($_POST['username']);
		$email     = $this->eqDb->escape($_POST['email']);
		$password  = $this->eqDb->escape($_POST['password']);

		$password = md5($password);

		$data = [
			'firstname'  => $firstname,
			'lastname'   => $lastname,
			'username'   => $username,
			'email'      => $email,
			'password'   => $password,
			'company_id' => $_SESSION['scouty_company_id'],
			'menu_pin'   => 1,
			'active'     => 1
		];

		$userId = $this->eqDb->insert('users', $data);

		if ($userId) {
			return [
				'r'       => 'success',
				'link' => _SITEROOT_ . 'settings/user/' . $userId
			];	
		}

		return [
			'r'       => 'error',
			'message' => '<strong>Error!</strong> Internal Error (2313)!'
		];
	}

	public function updateUser(int $id) {

		$firstname = $this->eqDb->escape($_POST['firstname']);
		$lastname  = $this->eqDb->escape($_POST['lastname']);
		$username  = $this->eqDb->escape($_POST['username']);
		$email     = $this->eqDb->escape($_POST['email']);

		$data = [
			'firstname' => $firstname,
			'lastname'  => $lastname,
			'username'  => $username,
			'email'     => $email
		];

		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->where('id', $id);
		if ($this->eqDb->update ('users', $data)) {

			if($_SESSION['scouty_user_id'] == $id) {

				$_SESSION['scouty_email']     = $email;
				$_SESSION['scouty_username']  = $username;
				$_SESSION['scouty_firstname'] = $firstname;
				$_SESSION['scouty_lastname']  = $lastname;
				$_SESSION['scouty_name']      = $firstname . ' ' . $lastname;
			}

			return [
				'r'       => 'success',
				'message' => '<strong>Success!</strong> User updated!'
			];	
		}

		return [
			'r'       => 'danger',
			'message' => '<strong>Error!</strong> Internal Error (2310)!'
		];
	}

	public function updateUserStatus(int $id) {

		$id     = !empty($id) ? $id : $this->eqDb->escape($_POST['updateUserStatus']);
		$status = $this->eqDb->escape($_POST['status']);

		if($id == $_SESSION['scouty_user_id']) {

			return [
				'r'       => 'danger',
				'type'    => 'danger',
				'message' => '<strong>Warning!</strong> You cannot change your own status.'
			];	
		}

		$data = [
			'active' => $status
		];

		$messageStatus = $status == 1 ? 'active' : 'inactive';

		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->where('id', $id);
		if ($this->eqDb->update ('users', $data)) {

			return [
				'r'       => 'success',
				'message' => '<strong>Success!</strong> User is ' . $messageStatus
			];	
		}

		return [
			'r'       => 'danger',
			'message' => '<strong>Error!</strong> Internal Error (2310)!'
		];
	}

	public function loadUsers() {

        $page = ($_POST['start']/$_POST['length']) + 1;

        $siteRoot = _SITEROOT_;

        $cols = [
        	"id",
        	"CONCAT('<a href=\"" . _SITEROOT_ . "settings/user/',id,'\">', firstname,' ', lastname, '</a>') AS name",
        	"firstname", 
        	"lastname", 
        	"username", 
        	"email",
        	"CONCAT('<div class=\"m-t-0 m-b-0 checkbox check-primary checkbox-circle\"><input data-id=\"',id,'\" value=\"active\" id=\"checkbox',id,'\" class=\"user-status\"',IF( active = 1, 'checked', '' ),' type=\"checkbox\"><label for=\"checkbox',id,'\">&nbsp;</label></div>') AS status"
        ];

        $colsAfter = [
        	'firstname',
        	'email'
        ];

        $orderBy  = $colsAfter[$_POST['order'][0]['column']];
        $orderDir = $_POST['order'][0]['dir'];

		$this->eqDb->pageLimit = $_POST['length'];
		$search = $this->eqDb->escape($_POST['search']['value']);

		if(!empty($search)) {
			$this->eqDb->where('(email LIKE "%' . $search . '%" OR firstname LIKE "%' . $search . '%" OR lastname LIKE "%' . $search . '%" OR username LIKE "%' . $search . '%")');
		}

		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->orderBy($orderBy, $orderDir);
		$users = $this->eqDb->arraybuilder()->paginate('users', $page, $cols);

		$response = [
			'totalPages'           => $this->eqDb->totalPages,
			'iTotalDisplayRecords' => $this->eqDb->totalCount,
			'iTotalRecords'        => $this->eqDb->totalCount,
			'data'                 => $users
		];

		return $response;
	}

	public function getUserInfo(int $id) {

		$data = ['id', 'firstname', 'lastname'];
		$this->eqDb->where('company_id', $_SESSION['scouty_company_id']);
		$this->eqDb->where('id', $id);
		$user = $this->eqDb->getOne('users', null, $data);

		if(count($user) == 0) {
        	header('location: ' . _SITEROOT_ . 'settings/users');
        	exit;
		}

		return $user;
	}

}