<?php

class Feed extends Controller {

	private $memberHelper;

	function __construct() {

		if (!isset($_SESSION['scouty_email'])) {
		  header('location: ' . _SITEROOT_);
		  exit;
		}

		$this->memberHelper = new MemberHelper();

		parent::__construct();
	}

	public function index() {

		if(!empty($_POST['getAll'])) {
			echo json_encode($this->model->get3WeekData(0));
			exit;
		}
		
		if(!empty($_POST['getAll'])) {
			echo json_encode($this->model->get3WeekData());
			exit;
		}

        $this->channels         = $this->model->loadChannels();
		$this->title = 'Home';
		$this->contentclass = 'sm-gutter';
        $this->bodyClass = 'fixed-header';
		$this->loadPage();
		$this->render('index');
		$this->loadFooter();
	}

}

?>