<?php

return [
    'module_name' => 'invoices',
    'resources' => [
        'core_pages' => [
            'css' => [
                // 'assets/css/home.css'
            ],
            'js' => [
                // '../../assets/public/js/jquery.slides.min.js',
                // 'assets/js/home.js'
            ]
        ],
        'sub_pages' => [
            0 => [
                'css' => [
                    'assets/css/forecast.css'
                ],
                'js' => [
                    'https://maps.googleapis.com/maps/api/js?key=AIzaSyAz7mGS7lno6k5bCh7_gZEKFMzWDZ5kngE&libraries=places',                  
                    'assets/js/index.js'
                ]
            ]
        ]
    ]
];

?>