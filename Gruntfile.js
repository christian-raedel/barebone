(function () {
    'use strict';


    module.exports = function(grunt) {
        grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),
            clean: ['build/*'],
            ngtemplates: {
                'app.templates': {
                    src: ['app/**/*.tpl.html'],
                    dest: 'build/_templates.js',
                    options: {
                        standalone: true,
                        htmlmin: {
                            collapseBooleanAttributes: true,
                            collapseWhitespace: true,
                            removeAttributeQuotes: true,
                            removeComments: true,
                            removeEmptyAttributes: true,
                            removeScriptTypeAttributes: true,
                            removeStyleLinkTypeAttributes: true
                        }
                    }
                }
            },
            concat: {
                source: {
                    src: [
                        'app/**/*.js'
                    ],
                    dest: 'build/_app.js',
                    filter: function(filepath) {
                        return filepath.indexOf('.spec.js') == -1;
                    }
                },
                components: {
                    src: [
                        'bower_components/jquery/dist/jquery.js',
                        'bower_components/angular/angular.js',
                        'bower_components/angular-cookies/angular-cookies.js',
                        'libs/autobahn.js'
                    ],
                    dest: 'build/_libs.js'
                },
                less: {
                    src: [
                        'app/**/*.less'
                    ],
                    dest: 'build/_style.less'
                }
            },
            less: {
                build: {
                    files: {
                        'build/_style.css': 'build/_style.less'
                    },
                    options: {
                        //cleancss: true
                    }
                }
            },
            mochaTest: {
                node: {
                    src: ['test/**/*.js'],
                    options: {
                        reporter: 'spec',
                        growl: true,
                        bail: true,
                        clearRequireCache: true
                    }
                }
            },
            karma: {
                unit: {
                    options: {
                        frameworks: ['mocha', 'chai'],
                        singleRun: true,
                        files: [
                            'build/_libs.js',
                            'build/_templates.js',
                            'build/_app.js',
                            'bower_components/angular-mocks/angular-mocks.js',
                            'app/**/*.spec.js'
                        ],
                        browsers: ['Chrome']
                    }
                }
            },
            copy: {
                source: {
                    files: [
                        {src: 'build/_libs.js', dest: 'public/js/libs.js'},
                        {src: 'build/_templates.js', dest: 'public/js/templates.js'},
                        {src: 'build/_app.js', dest: 'public/js/app.js'},
                        {src: 'build/_style.css', dest: 'public/css/style.css'},
                        {src: 'index.html', dest: 'public/index.html'}
                    ]
                },
                general: {
                    files: [{
                        src: 'bower_components/reset-css/reset.css',
                        dest: 'public/css/reset.css'
                    }, {
                        expand: true,
                        cwd: 'bower_components/font-awesome/fonts',
                        src: '*',
                        dest: 'public/fonts'
                    }, {
                        src: 'bower_components/font-awesome/css/font-awesome.min.css',
                        dest: 'public/css/font-awesome.min.css'
                    }]
                }
            },
            notify: {
                default: {
                    options: {
                        message: 'grunt task finished'
                    }
                }
            },
            watch: {
                default: {
                    files: ['Gruntfile.js', 'index.html', 'server.js', 'app/**/*'],
                    tasks: ['default'],
                    options: {
                        spawn: false,
                        livereload: {
                            port: 27000
                        },
                        livereloadOnError: false
                    }
                },
                node: {
                    files: [
                        'Gruntfile.js',
                        'server.js',
                        '*.json',
                        'config/**/*',
                        'modules/**/*.js',
                        'test/**/*.js'
                    ],
                    tasks: ['node'],
                    options: {
                        spawn: false,
                    }
                },
                test: {
                    files: ['Gruntfile.js', 'index.html', 'app/**/*'],
                    tasks: ['test'],
                    options: {
                        spawn: false,
                        livereload: {
                            port: 27000
                        },
                        livereloadOnError: false
                    }
                }
            }
        });

        [
            'grunt-contrib-watch',
            'grunt-contrib-concat',
            'grunt-contrib-clean',
            'grunt-contrib-copy',
            'grunt-contrib-less',
            'grunt-angular-templates',
            'grunt-karma',
            'grunt-mocha-test',
            'grunt-notify'
        ].forEach(function(task) {
            grunt.loadNpmTasks(task);
        });

        var nodeTestSrc = grunt.config('mochaTest.node.src');
        grunt.event.on('watch', function(action, filepath) {
            grunt.config('mochaTest.node.src', nodeTestSrc);
            if (filepath.match('test/')) {
                grunt.config('mochaTest.node.src', filepath);
            }
        });

        grunt.registerTask('preTest', ['clean', 'ngtemplates', 'concat', 'less']);
        grunt.registerTask('postTest', ['copy:source', 'copy:general', 'notify']);
        grunt.registerTask('test', ['preTest', 'karma', 'postTest', 'watch:test']);
        grunt.registerTask('default', ['preTest', 'postTest', 'watch:default']);
        grunt.registerTask('node', ['mochaTest:node', 'watch:node']);
    };
}());
