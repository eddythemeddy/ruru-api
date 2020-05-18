<?php

require_once('libs/helpers/MemberHelper.php');

class Register_Model extends Model {
	
	public function __construct() {
	
		parent::__construct();
	}

	public function process() {

		global $eqDb;
		
		require_once('libs/helpers/MemberHelper.php');
		require_once('libs/helpers/VideoHelper.php');

		$fname = $eqDb->escape($_POST['fname']);
		$lname = $eqDb->escape($_POST['lname']);
		$email = $eqDb->escape($_POST['email']);
		$type = $eqDb->escape($_POST['type']);
		$intType = $eqDb->escape($_POST['user-type']);
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


		$response = array(
			'r' => 'success',
			'redirect' => _SITEROOT_ . 'welcome'
		);

		return $response;
	}

	public function addToMailChimpList($data) { 


		$apikey   = '0cb44460331b3b5fc6ff7a99c3f6174c-us15';
		$listId   = '101573';

	    $api      = new MCAPI($apikey);
		$merge_vars = array(
			'FNAME'      => $data['fname'],
			'LNAME'      => $data['lname'],
			'EMAIL'      => $data['email'],
			'UNAME'      => $data['username'],
			'DATEJOINED' => date("m/d/Y")
	    );
		$retval = $api->listMemberInfo( $listId, array($data['email']) );
		if ($api->errorCode){
			echo $api->errorMessage;
		}
		if ($retval['success']==1 && $retval['data'][0]['status']=='subscribed'){
			// //Member exists on this list run update member
			// $api->listUpdateMember($listId, $my_email, $merge_vars, 'html', false);
			// $message = "<h2>Thank you " . $_POST['fname'] . " </h2><br/>Your Details have been updated.";
			// //Generate response Array 
	  //       $arrResult = array(
	  //           'status'   => 'updated',
	  //           'province' => $_POST['province'],
	  //           'email'    => $_POST['email'],
	  //           'download' => $links[$_POST['province']],
	  //           'message'  => $message,
	  //       );

	    	echo 'member exist';
	    } else {
	    	if($retval['data'][0]['status']=='unsubscribed') {
				//Member doesnt exist on this list create new member
				$api->listSubscribe($listId, $data['email'], $merge_vars);
				$message = "<h2>Thank you " . $data['fname'] . "</h2><br/>Your details have been saved and you are subscribed to our mailing list!  Look out for the confirmation email.";
	    	} else {
	    		$api->listSubscribe($listId, $data['email'], $merge_vars);
				$message = "<h2>Thank you " . $data['fname'] . "</h2> Please note, Your email \" " . $data['email'] .  " \" is already subscribed. We have already updated your details, but please confirm your email address.";
	    	}

	    	echo 'member dont exist';
		}

	}

}