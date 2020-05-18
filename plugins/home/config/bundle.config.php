<?php

return [
    'module_name' => 'home',
    // 'meta_tags'
    'resources' => [
        'core_pages' => [
            'css' => [
                // 'assets/css/style.css',
                // 'assets/css/responsive.css'
                'assets/build/css/wpl-main.min.css?cdnVersion=949',
                'assets/build/css/wpl/pages/wac/product-tour/main.min.css?cdnVersion=949'
            ],
            'js' => [
                // 'assets/js/jquery/jquery-3.3.1.min.js',
                // 'assets/js/bootstrap/bootstrap.min.js',
                // 'assets/js/plugins.min.js',
                // 'assets/js/plugins.min.js',
                // 'assets/js/active.js',
                'assets/build/js/jquery.min.js?cdnVersion=949',
                'assets/build/js/header/header.min.js?cdnVersion=949',
            ]
        ],
        'sub_pages' => [
        ]
    ]
];

?>