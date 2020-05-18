<?php
require_once('libs/helpers/MemberHelper.php');
require_once('libs/helpers/LocationHelper.php');

class Search extends Controller {

  protected $params = ['people', 'trials'];

  function __construct() {

    if (!isset($_SESSION['scouty_email'])) {
      header('location: ' . _SITEROOT_ . '');
      exit;
    }

    parent::__construct();
  }

  function index() {
    header("refresh:0;" . _SITEROOT_ . "search/results/people");
    exit;
  }

  public function results($type = 'people') {

    $members = new MemberHelper();
    $locationHelper = new LocationHelper();
    $pagination = new PaginationHelper();

    if(!in_array($type, $this->params)) {
      header("refresh:0;" . _SITEROOT_ . "search/results/people");
      exit;
    }

    $this->name = !empty($_GET['p']) ? $_GET['p'] : '';
    $this->person = !empty($_SESSION['scouty_user_id']) ? $_SESSION['scouty_user_id'] : 0;
    $this->playerType = !empty($_GET['playerType']) ? $_GET['playerType'] : '';
    $this->searchType = $type;
    $this->location = !empty($_GET['location']) ? $_GET['location'] : '';
    $this->countries = $locationHelper->getCountriesOptions($this->location);

    $req = [ 
      'name' => $this->name,
      'type' => $type,
      'playerType' => $this->playerType,
      'location' => $this->location
    ];

    $this->results = $members->getAllMembersSearch($req);
    $this->total = $this->totalResultsBuild($this->results);
    $this->pagination = $pagination->html($this->results['totalPages']);

    $this->title = "Search";
    $this->loadPage();
    $this->render('index');
    $this->loadFooter();
  }

  public function totalResultsBuild($results) {

    $results = $results['totalResults'];
    $results = intval($results);
    $results = number_format($results);
    $results = 'Showing ' . $results . ' result' . ($results > 1 || $results == 0 ? 's' : '');
    return $results;
  }
}

?>