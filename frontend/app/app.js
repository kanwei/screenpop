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

  $scope.selectContact = function (contact) {
    $scope.activeContact = contact;
  };

  $scope.formatTourBuzz = function (name) { 
    alert('yee-haw!');
    return name == "tourbuzz"; 
  };
});

app.factory('canonicalParser', function () {
  var canonicalMap = {
    'tourbuzz': {
      name: 'name',
      email: 'email',
      company: 'company',
      image: 'logo'
    },
    'twilio': {
      name: '??',
      email: '??',
      company: '??',
      image: '??'
    },
    'zendesk': {
      name: '??',
      email: '??',
      company: '??',
      image: '??'
    }
  };

  return {
    parse: function (contact, source) {
      var info = {}

      _(canonicalMap[source]).forEach(function (prop, key) {
        info[key] = contact[source][prop];
      });

      return info;
    }
  };
});

app.factory('incomingContacts', function ($http, $timeout, canonicalParser) {
  var incomingContacts = [],
    canonicalSource = 'tourbuzz';

  function processContact (contact, id) {
    return _({id: id, sources: contact}).extend(canonicalParser.parse(contact, canonicalSource));
  }

  (function poll () {
    $http.get('http://kanwei.com:9999/data').then(function (resp) {
      incomingContacts = _(resp.data).filter(function (contact) {
        return ! _(contact[canonicalSource]).isUndefined();
      }).map(processContact);
    });

    $timeout(poll, 2000);
  })();

  return {
    all: function () {
      return incomingContacts;
    }
  };
});