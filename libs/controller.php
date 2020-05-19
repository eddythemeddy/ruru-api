<?php

class Controller {
    
    function __construct() {
        $_POST = json_decode(file_get_contents('php://input'), true);
    }

    /*
    * Open the Model for this controller if it exists.
    */
    public function loadModel($name) {

        global $url;
        $this->Apps = new Apps();
        
        $path = 'plugins/' . $name . '/Model/' . $name . '_model.php';

        if (file_exists($path)) {

            require $path;
            $modelName   = ucfirst($name) . '_Model';
            $this->model = new $modelName();
        }
    }
}
