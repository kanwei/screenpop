screenpop = angular.module("screenpop", [])
.controller "screenpop", ($scope) ->
    setInterval ->
        $scope.$apply ->
            $scope.clock = Date.now()
    , 1000