var app = angular.module('screenpop', []);

app.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'dashboard.html',
      controller: 'DashboardCtrl'
    })
    .otherwise({
      redirectTo: '/'
    });

  $locationProvider.html5Mode(true);
});

app.controller('DashboardCtrl', function ($scope, incomingContacts) {
  $scope.$watch(incomingContacts.all, function (contacts) {
    $scope.incomingContacts = contacts;
  });
});

app.factory('incomingContacts', function ($http, $timeout) {
  var incomingContacts = [],
    canonical = {
      source: 'tourbuzz',
      props: {
        name: 'name',
        email: 'email',
        company: 'company',
        image: 'logo'
      }
    };

  function canonicalInfo (contact) {
    var info = {};

    _(canonical.props).forEach(function (prop, key) {
      info[key] = contact[canonical.source][prop];
    });

    return info;
  }

  function processContact (contact, id) {
    return _({id: id, sources: contact}).extend(canonicalInfo(contact));
  }

  function poll () {
    $http.get('http://alan.dev.tourbuzz.net/data').then(function (resp) {
      incomingContacts = _(resp.data).map(processContact);
    });

    $timeout(poll, 2000);
  }

  poll();

  return {
    all: function() {
      return incomingContacts;
    }
  };
});
