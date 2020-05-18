<?php

class Mail_Model extends Model {
	
	public function __construct() {

		global $eqDb;
	
		$this->eqDb = $eqDb;
		$this->apps = new Apps();
		parent::__construct();
	}

	public function loadMessages($page = 'inbox') {

		switch($page) {
			case 'inbox':
				$queryToAdd = 'm.to_id = "'.$_SESSION['scouty_user_id'].'"';
				$to = '';
				break;
			case 'sent':
				$queryToAdd = 'm.from_id = "'.$_SESSION['scouty_user_id'].'"';
				$to = 'To: ';
				break;

			case 'trash':
				$queryToAdd = 'm.to_id = "'.$_SESSION['scouty_user_id'].'"';
				$to = '';
				break;
		}

		$query = 'SELECT 
				m.from_id,
				m.to_id,
				CONCAT(fromz.firstname," ",fromz.lastname) AS fromName,
				CONCAT("/uploads/",fromz.username,"/profile.jpg") AS fromPic,
				CONCAT(toz.firstname," ",toz.lastname) AS toName,
				CONCAT("/uploads/",toz.username,"/profile.jpg") AS toPic,
				toz.username AS toUsername,
				m.message AS message,
				m.subject AS subject,
				m.datetime AS msgtime,
				m.id AS id,
				m.isReply
			FROM messaging m
			LEFT JOIN (
				SELECT username, firstname, lastname, id FROM users
			)fromz ON fromz.id = m.from_id
			LEFT JOIN (
				SELECT username, firstname, lastname, id FROM users
			)toz ON toz.id = m.to_id 
			WHERE ' . $queryToAdd . '
			AND m.isReply = "0"
			ORDER BY msgtime DESC';

		$this->res = $this->eqDb->rawQuery($query);

		$array = [];

		foreach($this->res as $key => $val) {

			$this->res[$key]['msgtime'] = $this->apps->timeElapsed($val['msgtime']);
		}

		echo json_encode($this->res);
	}

	public function loadMessage($id) {

		$this->res = $this->eqDb->rawQuery(
			'SELECT 
				m.message AS body,
				fr.username AS friendUsername,
				m.datetime AS msgtime,
				m.subject AS subject,
			CONCAT(fr.firstname," ",fr.lastname) AS name
			FROM messaging m
			LEFT JOIN (
			  SELECT firstname, lastname, username, id FROM users
			)fr ON fr.id = m.from_id

			WHERE m.id = "'.$id.'"'
	      );

		$this->resChild = $this->eqDb->rawQuery(
			'SELECT 
				m.id AS id,
				m.message AS body,
				fr.username AS friendUsername,
				m.datetime AS msgtime,
				m.from_id,
				m.to_id,
				CONCAT(fr.firstname," ",fr.lastname) AS friend
			FROM messaging m
			LEFT JOIN (
			  SELECT firstname, lastname, username, id FROM users
			)fr ON fr.id = m.from_id

			WHERE m.isReply = "'.$id.'"'
	      );

		$array = [];

		foreach($this->resChild as $val) {

			array_push($array, [
				'id' => $val['id'],
				'friend' => $val['friend'],
				'message' => nl2br($val['body']),
				'msgtime' => $this->timeElapsed($val['msgtime']),
				'name' => $val['friend'],
				'pic' => '/uploads/' . $val['friendUsername'] . '/profile.jpg'
			]);
		}

		$this->res[0]['body'] = nl2br($this->res[0]['body']);

		$this->res[0]['child'] = $array;

		echo json_encode($this->res[0]);
	}

	public function refreshChat() {

		$last = $_POST['refreshChat'];
		$contact = $_POST['contact'];

		$query = 'SELECT id, from_id, to_id, message, datetime
	      FROM messaging 
	       WHERE 
	      	((to_id = "' . $_SESSION['scouty_user_id'] . '" AND from_id = "' . $contact . '")
	       OR
	      	(to_id = "' . $contact . '" AND from_id = "' . $_SESSION['scouty_user_id'] . '"))
	       AND 
	      	id > "' . $last . '" ORDER BY id ASC';

		$res = $this->eqDb->rawQuery($query);

		echo json_encode($res);
	}

	public function sendMail() {

		$datetime = date('Y-m-d H:i:s');
		
		$data = [
			"from_id" => $_SESSION['scouty_user_id'],
			"to_id"   => $_POST['to_id'],
			"subject"   => $_POST['subject'],
			"message" => $_POST['body'],
			"datetime" => $datetime
		];

		$id = $this->eqDb->insert('messaging', $data);

		if($id) {

			return [
				'r' => 'success'
			];
			exit;
		}

		return [
			'r' => 'error'
		];
	}
}