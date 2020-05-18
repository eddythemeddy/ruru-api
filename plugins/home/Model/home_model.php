<?php

class Home_Model extends Model {

	const MEMBERTABLE = 'users';
	const MEMBERRECORDS = 'id,username,email,firstname,lastname,password';
	
    public function __construct() {
	
		global $eqDb;

		$this->eqDb = $eqDb;
	}

	public function regProcess() {

		global $eqDb;
		
		require_once('libs/helpers/MemberHelper.php');
		require_once('libs/helpers/VideoHelper.php');

		$fname = $eqDb->escape($_POST['fname']);
		$lname = $eqDb->escape($_POST['lname']);
		$email = $eqDb->escape($_POST['email']);
		$type = $eqDb->escape($_POST['type']);
		$username = $eqDb->escape($_POST['username']);
		$password = $eqDb->escape($_POST['password']);
		$password = md5($password);

		$member = new MemberHelper();
		$videoHelper = new VideoHelper();
		$emailTaken = $member->validateIfEmailIsTaken($email);
		$usernameTaken = $member->validateIfUsernameIsTaken($username);

		if($emailTaken == "true" || $usernameTaken == "true") {
			$message = [];
			if($emailTaken == "true") {
				array_push($message, 'email');
			}
			if($usernameTaken == "true") {
				array_push($message, 'username');
			}

			$message = implode(" & ", $message);

			$return = [
				'r' => 'fail',
				'Message' => '<strong>Error</strong> That ' . $message . ' is taken!'
			];

			return $return;
		}

		$data = [
			"firstname" => $fname,
            "lastname" => $lname,
			"email" => $email,
			"password" => $password,
			"type" => $type,
			"status" => "new",
			"username" => $username
		];

		$id = $eqDb->insert ('users', $data);
		mkdir('uploads/' . $username);
		copy('assets/public/img/avatar.jpg','uploads/' . $username . '/profile.jpg');

		$_SESSION['scouty_email'] = $email;
		$_SESSION['scouty_status'] = "new";
		$_SESSION['scouty_user_id'] = $id;
		$_SESSION['scouty_username'] = $username;
		$_SESSION['scouty_name'] = $fname . ' ' . $lname;
		$_SESSION['scouty_firstname'] = $fname;
		$_SESSION['scouty_lastname'] = $lname;
		$_SESSION['scouty_photo'] = '/assets/img/player.png';

		$eqDb->where ('id', $id);
		$eqDb->update('users',$data);

		return [
			'r' => 'success',
			'redirect' => _SITEROOT_ . 'welcome'
		];
	}

	public function loginProcess() {

		$username = $this->eqDb->escape($_POST['username-login']);
		$password = $this->eqDb->escape($_POST['password-login']);
		$password = md5($password);
		$this->eqDb->where ("(username = ? or email = ?)", array($username,$username));
		$this->eqDb->where ('password', $password);
		$members = $this->eqDb->get ( 
			self::MEMBERTABLE,
			null,
			self::MEMBERRECORDS);

		if(count($members) == 1) {
			
			$row = $members[0];

			$_SESSION['scouty_user_id'] = $row['id'];
			$_SESSION['scouty_email'] = $row['email'];
			$_SESSION['scouty_username'] = empty($row['username']) ? "user" . $row['id'] : $row['username'];
			$_SESSION['scouty_name'] = $row['firstname'].' '.$row['lastname'];
			$_SESSION['scouty_firstname'] = $row['firstname'];
			$_SESSION['scouty_lastname'] = $row['lastname'];
			$_SESSION['scouty_photo'] = !empty($row['photo']) ? '/uploads/' . $row['id'] . '/photo/photo.png' : '/assets/img/player.png';

			$response = [ 
				"r" => "success", 
				"redirect" => _SITEROOT_ . "in/"
			];

		} else {
			
			$response = [ 
				"r" => "fail", 
				"type" => "danger", 
				"message" => "<strong>Error: </strong> Wrong Email or Password"
			];
		}

		return $response;
	}

}