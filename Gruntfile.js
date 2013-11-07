module.exports = function(grunt) {
    var lib;

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        haml: {
            templates: {
                files: grunt.file.expandMapping(['src/haml/**/*.haml'], 'templates/', {
                    rename: function(base, path) {
                        return base + path.replace(/\.haml$/, '.html').replace(/^src\/haml\//, '');
                    }
                })
            },
            partials: {
                files: grunt.file.expandMapping(['src/partials/**/*.haml'], 'static/partials/', {
                    rename: function(base, path) {
                        return base + path.replace(/\.haml$/, '.html').replace(/^src\/partials\//, '');
                    }
                })
            }
        },
        compass: {
            std: {
                options: {
                    sassDir: 'src/sass',
                    cssDir: 'tmp/css',
                    specify: 'src/sass/main.sass',
                    raw: 'disable_warnings = true\n',
                }
            },
        },
        concat: {
            js: {
                options: {separator: ';'},
                src: ['src/js/app.js', 'src/js/**/*.js'],
                dest: 'static/js/app.js'
            },
            css: {
                src: ['static/vendor/normalize.css', 'tmp/css/main.css'],
                dest: 'static/css/app.css'
            }
        },
        watch: {
            options: {
                livereload: true
            },
            js: {
                files: ['src/js/**/*.js'],
                tasks: ['concat']
            },
            sass: {
                files: ['src/sass/**/*.sass'],
                tasks: ['compass', 'concat']
            },
            haml: {
                files: ['src/haml/**/*.haml', 'src/partials/**/*.haml'],
                tasks: ['haml']
            },
        }
    });

    lib = ['grunt-contrib-haml', 'grunt-contrib-compass', 'grunt-contrib-copy', 'grunt-contrib-concat', 'grunt-contrib-watch'];
    for (var i = 0; i < lib.length; i++) {
        grunt.loadNpmTasks(lib[i]);
    }

    grunt.registerTask('default', ['haml', 'compass', 'concat']);
    grunt.registerTask('dev', ['watch']);
};
