module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      dev: {
        files: ['app/**/*'],
        tasks: ['build:dev'],
      }
    },

    copy: {
      dev: {
        files: [
          {src: 'app/pages/index.html', dest: 'build/dev/index.html'},
          {cwd: 'app/images/', src: ['**'], dest: 'build/dev/images', expand: true}
        ]
      }
    },

    concat: {
      dev: {
        files: {
          'build/dev/javascripts/app.js': [
            'vendor/javascripts/angular.js', 
            'vendor/javascripts/d3.js', 
            'vendor/javascripts/**/*.js',
            'app/app.js',
            '<%= ngtemplates.dev.dest %>'
          ]
        }
      }
    },

    ngtemplates: {
      dev: {
        options: {
          base: 'app/templates',
          module: 'screenpop',
        },
        src: 'app/templates/**/*.html',
        dest: 'build/dev/javascripts/templates.js'
      }
    },

    sass: {
      dev: {
        files: {
          'build/dev/stylesheets/app.css': 'app/stylesheets/app.scss',
        }
      }
    },

    clean: {
      dev: ['build/dev']
    },

    compass: {
      dev: {
        options: {
          importPath: [
            'app/stylesheets',
            'vendor/stylesheets'
          ],
          sassDir: 'app/stylesheets',
          cssDir: 'build/dev/stylesheets',
          imagesDir: 'app/images',
          specify: ['app/stylesheets/app.scss']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compass');

  grunt.registerTask('dev', 'Run dev environment', ['build:dev', 'server', 'watch:dev']);
  
  grunt.registerTask('server', 'Run dev and API proxy server', function () {
    var express = require('express'),
      httpProxy = require('http-proxy'),
      webPort = 8000,
      webRoot = 'build/dev',
      apiPort = 4567,
      apiProxyEnabled = true,
      apiProxyHost = 'localhost',
      apiProxyPrefix = 'api',
      pushStateEnabled = true,
      app = express();

    function apiProxy (host, port, proxy) {
      proxy.on('proxyError', onProxyError);

      return function (req, res, next) {
        return proxy.proxyRequest(req, res, {
          host: host,
          port: port
        });
      };
    }

    function prefixMatchingApiProxy (prefix, host, port, proxy) {
      var prefixMatcher = new RegExp(prefix);
      proxy.on('proxyError', onProxyError);
      return function (req, res, next) {
        if (prefix && prefixMatcher.exec(req.path)) {
          return proxy.proxyRequest(req, res, {
            host: host,
            port: port
          });
        } else {
          return next();
        }
      };
    }

    function onProxyError (err, req, res) {
      res.statusCode = 500;
      res.write('API Proxying to `' + req.url + '` failed with: `' + (err.toString()) + '`');
      return res.end();
    }

    function pushStateSimulator (cwd, webRoot) {
      return function (req, res, next) {
        grunt.log.writeln('PushState: "' + req.path + '" not found in ' + cwd + '/' + webRoot + ' - Serving up "' + webRoot + '/index.html"');
        return res.sendfile(webRoot + '/index.html');
      };
    };

    app.configure(function() {
      app.use(express['static'](process.cwd() + '/' + webRoot));
      grunt.log.writeln('Starting express web server in ./' + webRoot + ' on port ' + webPort);

      if (apiProxyEnabled) {
        grunt.log.writeln('TODO: Start proxy server');

        if (pushStateEnabled) {
          app.use(prefixMatchingApiProxy(apiProxyPrefix, apiProxyHost, apiPort, new httpProxy.RoutingProxy()));
          grunt.log.writeln('Proxying API requests prefixed with /' + apiProxyPrefix + ' to ' + apiProxyHost + ':' + apiPort);
        } else {
          app.use(apiProxy(apiProxyHost, apiPort, new httpProxy.RoutingProxy()));
          grunt.log.writeln('Proxying API requests to ' + apiProxyHost + ':' + apiPort);
        }
      }

      app.use(express.errorHandler());

      if (pushStateEnabled) {
        app.use(pushStateSimulator(process.cwd(), webRoot));
        grunt.log.writeln('Simulating HTML5 pushState: Serving up ./' + webRoot + '/index.html for all other unmatched paths');
      }
    });

    return app.listen(webPort);
  });

  grunt.registerTask('build:dev', 'Create dev build', ['copy:dev', 'compass:dev', 'ngtemplates', 'concat:dev']);
  grunt.registerTask('build:test', 'Create test build', []);
  grunt.registerTask('build:prod', 'Create production build', []);
  grunt.registerTask('default', ['dev']);
};
