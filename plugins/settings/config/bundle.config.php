<?php

return [
    'module_name' => 'settings',
    // 'meta_tags'
    'resources' => [
        'core_pages' => [
            'css' => [
                'https://fonts.googleapis.com/css?family=Montserrat:400,500,600',
                '../../assets/public/fonts/flaticon/flaticon.css',
                '../../assets/public/css/bootstrap3-wysihtml5.min.css',
                '../../assets/public/css/jquery-ui.min.css',
                '../../assets/public/css/jquery.scrollbar.css',
                '../../assets/public/css/font-awesome.css',
                '../../assets/public/css/style-light.css',
                '../../assets/dist/css/scouty.core.min.css',
                // '../../assets/public/css/bootstrap3-wysihtml5.all.min.css',
            ],
            'js' => [
                '../../assets/public/js/jquery.min.js',
                '../../assets/public/js/jquery-ui.min.js',
                // '../../assets/public/js/jquery.actual.min.js',
                '../../assets/public/js/popper.min.js',
                // '../../assets/public/js/jquery.ioslist.min.js',
                '../../assets/public/js/bootstrap.min.js',
                '../../assets/public/js/modernizer.min.js',
                // '../../assets/public/js/bootstrap3-wysihtml5.all.min.js',
                // '../../assets/public/js/jquery.menuclipper.js',
                '../../assets/dist/js/scouty.core.min.js',
                // '../node_modules/bootstrap-3-typeahead/bootstrap3-typeahead.min.js',
                '../../assets/public/js/jquery.scrollbar.min.js',
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
            ],
            'users' => [
                'css' => [
                    // 'assets/css/forecast.css'
                ],
                'js' => [                
                    'assets/js/users.js'
                ]
            ],
            'user' => [
                'css' => [
                    // 'assets/css/forecast.css'
                ],
                'js' => [                
                    'assets/js/edit-user.js'
                ]
            ],
            'add-user' => [
                'css' => [
                    // 'assets/css/forecast.css'
                ],
                'js' => [                
                    'assets/js/add-user.js'
                ]
            ]
        ]
    ]
];

?>