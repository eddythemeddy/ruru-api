<?php

class Notifications extends Controller {

	private $memberHelper;

	function __construct() {

		if (!isset($_SESSION['scouty_email'])) {
		  header('location: /');
		  exit;
		}

		parent::__construct();
		$this->memberHelper = new MemberHelper();
		$this->notificationHelper = new NotificationHelper();
	}

  	public function index() {

	  	$this->memberHelper->readAllNotifications();
	  	$this->notifications = $this->notificationHelper->getAllNotifications();
	    
	    $this->title = "Notifications";
	    $this->loadPage();
	    $this->render('index');
	    $this->loadFooter();

	}

}
?>
