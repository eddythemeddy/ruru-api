<?php

class Mail extends Controller {

  private $memberHelper;

  function __construct() {

    global $eqDb;

    $this->eqDb = $eqDb;
    $this->memberHelper = new MemberHelper();

    if (!isset($_SESSION['scouty_email'])) {
      header('location: /');
      exit;
    }

    parent::__construct();
  }

  public function index() {

    echo json_encode(['hie'])

    die;

    if(!empty($_POST['refreshChat']) && !empty($_POST['contact'])) {
      $this->model->refreshChat();
      exit;
    }

    //load all messages based on inbox, outbox, trash
    if(!empty($_POST['loadMessages'])) {
      $this->model->loadMessages($_POST['loadMessages']);
      exit;
    }

    //load unique message
    if(!empty($_POST['loadMessage'])) {
      $this->model->loadMessage($_POST['loadMessage']);
      exit;
    }

    if(!empty($_POST['contactsQuery'])) {
      echo json_encode($this->memberHelper->getConnections($_SESSION['scouty_user_id'], $_POST['contactsQuery']));
      exit;
    }

    if(!empty($_POST['findFriends'])) {
      echo json_encode($this->memberHelper->getConnections($_SESSION['scouty_user_id'], $_POST['findFriends']));
      exit;
    }

    if(!empty($_POST['to_id']) && !empty($_POST['to']) && !empty($_POST['subject']) && !empty($_POST['body'])) {
      echo json_encode($this->model->sendMail($_POST['to_id'], $_POST['subject'], $_POST['body']));
      exit;
    }

    if(!empty($_POST['postMessage']) && !empty($_POST['message'])) {
      echo json_encode($this->model->postMessage());
      exit;
    }

    $this->title = 'Mail';
    $this->loadPage();
    $this->render('index');
    $this->loadFooter();
  }

}

?>