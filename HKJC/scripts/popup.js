(function() {
    var app = angular.module('race', []);
    app.controller('RaceController', ["$http", "$scope", function($http, $scope){
        var race = this;
        race.odds = [];
        $scope.Number = 1;
        $scope.odds = [];
        $scope.runner = [];
        $scope.updateOdds = function(number) {
            $http.get("http://bet.hkjc.com/racing/getXML.aspx?type=starters&RaceNo=" + number).success(function(data){
                var root = $.xml2json(data);
                var today = new Date();

                $.each(root, function(key, value){
                    if(value.DATE === formatDate(today)){
                        $scope.race = value.RACE;
                    }
                });
                //$scope.race = root.STARTERS[1].RACE;
                $http.get("http://bet.hkjc.com/racing/getXML.aspx?type=win&RaceNo=" + number).success(function(data){
                    var root = $.xml2json(data);
                    $.each(root, function(key, value){
                        if(value.DATE === formatDate(today)){
                            $scope.odds = value.RACE.OUT;
                        }
                    });
                });
            });
        }
    }]);
})();

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [day, month, year].join('-');
}