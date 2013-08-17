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
});

// Extracts canonical info from a contact.
// Won't be needed if the data source handles that for us.
app.factory('canonicalParser', function ($parse) {
  var canonicalMap = {
    'tourbuzz': {
      name: 'name',
      email: 'email',
      company: 'company',
      image: 'logo'
    },
    'fullcontact': {
      name: 'contactInfo.fullName',
      email: '',
      company: '',
      image: ''
    },
    'twilio': {
      name: 'name',
      email: 'email',
      company: 'company',
      image: 'logo'
    }
  };

  return {
    parse: function (contact, source) {
      var info = {}

      _(canonicalMap[source]).forEach(function (prop, key) {
        info[key] = $parse(prop)(contact[source]);
      });

      return info;
    }
  };
});

// Polls/fetches incoming contacts
app.factory('incomingContacts', function ($http, $timeout, canonicalParser) {
  var incomingContacts = [],
    canonicalSource = 'tourbuzz';

  function filterContacts (contact) {
    return ! _(contact[canonicalSource]).isUndefined();
  }

  function processContact (contact, id) {
    return _({id: id, sources: contact}).extend(canonicalParser.parse(contact, canonicalSource));
  }

  (function poll () {
    $http.get('http://kanwei.com:9999/data').then(function (resp) {
      incomingContacts = _(resp.data).filter(filterContacts).map(processContact);
    });

    $timeout(poll, 2000);
  })();

  return {
    all: function () {
      return incomingContacts;
    }
  };
});
