<?php

use Firebase\JWT\JWT;

class Login_Model extends Model {

	const MEMBERTABLE = 'users';
	const MEMBERRECORDS = 'id,username,email,firstname,lastname,password,company_id,menu_pin,active';
	
	public function __construct() {
		global $eqDb;
		$this->eqDb = $eqDb;
		parent::__construct();
	}

	public function process() {

		$username = $this->eqDb->escape($_POST['username']);
		$password = $this->eqDb->escape($_POST['password']);
		$password = md5($password);
		$this->eqDb->where ("(username = ? or email = ?)", [$username, $username]);
		$this->eqDb->where ('password', $password);
		$members = $this->eqDb->get ( 
			self::MEMBERTABLE,
			null,
			self::MEMBERRECORDS);

		if(count($members) == 1) {
			//creds valid
			$tokenId    = base64_encode(md5(time()));
			$issuedAt   = time();
			$notBefore  = $issuedAt + 10;             //Adding 10 seconds
			$expire     = $notBefore + 60;            // Adding 60 seconds
			$serverName = $_SERVER['HTTP_HOST']; // Retrieve the server name from config file
	
			$row = $members[0];

			if($row['active'] == 0) {

				return [ 
					"r"	      => "fail", 
					"type"    => "danger", 
					"message" => "<strong>Error: </strong> Sorry cannot access at this moment."
				];
			}

			$this->eqDb->where ('id', $row['company_id']);
			$company = $this->eqDb->getOne ('company', null, '*');

			if(count($company) == 0) {

				return [ 
					"r"	      => "fail", 
					"type"    => "danger", 
					"message" => "<strong>Error: </strong> Sorry internal error (21222)."
				];
			}

			$data = [
				'iat'  => $issuedAt,         // Issued at: time when the token was generated
				'jti'  => $tokenId,          // Json Token Id: an unique identifier for the token
				'iss'  => $serverName,       // Issuer
				'nbf'  => $notBefore,        // Not before
				'exp'  => $expire,           // Expire
				'data' => [                  // Data related to the signer user
					'userId'   => $row['id'], // userid from the users table
					'userName' => $row['username'], // User name
				]
			];

			$secretKey = require('libs/config/jwtkey.php');
			$jwt = JWT::encode(
				$data,      //Data to be encoded in the JWT
				$secretKey, // The signing key
				'HS512'     // Algorithm used to sign the token, see https://tools.ietf.org/html/draft-ietf-jose-json-web-algorithms-40#section-3
				);
				
			return [
				'jwt' => $jwt
			];
		}
			
		return [ 
			"r"       => "fail", 
			"type"    => "danger", 
			"message" => "<strong>Error: </strong> Wrong Email or Password"
		];
	}
}