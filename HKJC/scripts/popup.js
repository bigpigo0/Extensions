var mainUrl = "http://bet.hkjc.com/racing/hr_bet_main_block.aspx?lang=ch&block=1";
var homeUrl = "http://bet.hkjc.com/racing/getXML.aspx";
var tipsUrl = "http://hk.racing.nextmedia.com/other9tips.php";
var meetingsUrl = "http://bet.hkjc.com/racing/getXML.aspx?type=MEETINGS&callback=getMeetingDates";
var resultUrl = "http://bet.hkjc.com/racing/pages/results.aspx?date=26-04-2015&venue=ST&raceno=";
var speedUrl = "http://www.hkjc.com/chinese/formguide/speedmap.asp?FrmRaceNum=";
var speedMapUrl = "http://www.hkjc.com/chinese/formguide/";
var onccTipUrl = "http://racing.on.cc/racing/fav/current/rjfavf0301x0.html";
var jkresultUrl = "http://www.hkjc.com/chinese/racing/jkcresult.asp";

var tipServiceUrl = "http://drewdrew.cloudapp.net:9002/wcf/";

(function () {
    var app = angular.module('race', []);
    
    app.factory('httpq', function($http, $q) {
      return {
        get: function() {
          var deferred = $q.defer();
          $http.get.apply(null, arguments)
          .success(deferred.resolve)
          .error(deferred.resolve);
          return deferred.promise;
        }
      }
    });
    
    app.factory('tipService', function($http) {

        var getRace = function(number) {
            return $http.get(tipServiceUrl + "Race/" + number).success(function(data){
                return data;
            });
        }
        
        var getBarDrawChance = function(){
            return $http.get(tipServiceUrl + "BarDrawWinChance").success(function(data){
                return data;
            });
        };
        return { getRace: getRace, getBarDrawChance: getBarDrawChance };
    });
    
    app.filter('range', function() {
        return function (input, total) {
            total = parseInt(total);
            var i;
            for (i = 0; i < total; i++)
                input.push(i);
            return input;
        };
    });
    
    app.filter("toTime", function(){
        return function(input){
            if(typeof input != "undefined" && input.length == 4){
                 return input.substr(0,2) + ":" + input.substr(2,2);
            }else{
                return input;
            }
        };
    });
    
    app.controller('RaceController', ["$http", "$scope", "$interval", "$sce", "httpq", "tipService", function($http, $scope, $interval, $sce, httpq, tipService){
        var race = this;
        race.odds = [];
        race.result = {};
        $scope.Number = 1;
        $scope.wins = [];
        $scope.plas = [];
        $scope.runner = [];
        $scope.speedIndex = [];
        $scope.fitnessRating = [];
        $scope.newPaperTips = {};
        $scope.updateDate = "";
        $scope.updateTime = "";
        $scope.speedMap = "";
        race.track = "";
        race.jkResult = "";
    
        var dom = "";
        var onccdom = "";
        var result = "";
        
        $scope.numOfRace = 0;
                
        Array.prototype.max = function() {
            return Math.max.apply(null, this);
        };

        Array.prototype.min = function() {
            return Math.min.apply(null, this);
        };
        
        $http.get(tipServiceUrl + "Meeting").success(function(data){
            $scope.numOfRace = parseInt(data);
        });
        
        $scope.isEmptyRace = function(){
            return $scope.race == undefined;
        }
        
        $scope.getOddDropStyle = function (oddDrop){
            return {
                "background" : oddDrop >= 50 ? '#993300' : oddDrop >= 20 ? '#2AA216' : '#FFFFFF',
                "color" : oddDrop >= 50 ? '#FFFFFF' : oddDrop >= 20 ? '#FFFFFF' : '#000000'
            }
        }
        
        $scope.getOddStyle = function (hf){
            return {
                "background": hf == 1 ? '#C80000' : 'FFFFFF',
                "color" : hf == 1 ? '#FFFFFF' : '#000000'
            }
        }
        
//        $scope.getSpeedIndex = function(runner){
//            return $scope.speedIndex[runner.HORSE_NAME_C] == undefined ? 0 : parseInt($scope.speedIndex[runner.HORSE_NAME_C]);
//        }
        
        race.getTips = function(horseName){
            var result = [];
            var keys = [];
            for (var key in $scope.newPaperTips) {
                if ($scope.newPaperTips[key].indexOf(horseName) > -1) {
                    result.push(key.substr(0, 1));
                }
            }
            return result.join(" ");
        }
        
        race.getOnccTip = function(horseName){
            return $scope.jockyTip[horseName];
        }
        
        $scope.getPlaFairValue = function(number, bar){
            if($scope.race.RUNNER[number] != undefined){
                var jp = ($scope.race.RUNNER[number].JOCKEY_PLA_STAT) / 100
                //var jp = (parseInt(jockyRate[0]) + parseInt(jockyRate[1]) + parseInt(jockyRate[2]))/parseInt(jockyRate[4]);
                //var hp = parseInt($scope.race.RUNNER[number].PLA_LAST5)/ 20;
                var bp = $scope.barDrawWinChance[$scope.Number + "_" + bar].Item2 / 100
                var value = 1/(jp + bp - jp * bp );
                //var value = 1/jp;
                return Math.round(value * 100) / 100;
            }
            
            return NaN;
        }
        
        $scope.getArrowIcon = function(actual, fair){
            if(actual >= fair){
                return "glyphicon glyphicon-plus";
            }else{
                return "glyphicon glyphicon-minus";
            }
        }
        
        $scope.getArrowColor = function(actual, fair){
            if(actual >= fair){
                return "color: green; font-size: 10pt";
            }else{
                return "color: red; font-size: 10pt";
            }
        }
        
        $scope.getWinFairValue = function(number, bar){
            if($scope.race.RUNNER[number] != undefined){
                var jp = $scope.race.RUNNER[number].JOCKEY_WIN_STAT / 100;
                //var hp = parseInt($scope.race.RUNNER[number].WIN_LAST5) / 20;
                var bp = $scope.barDrawWinChance[$scope.Number + "_" + bar].Item1 / 100
                var value = 1/(jp + bp - jp * bp );
                return Math.round(value * 100) / 100;
            }
            
            return NaN;
        }
        
        $scope.isMax = function(number) {
             var values = $.map($scope.speedIndex, function(v) { return v; });
             return {
                "background": Math.max.apply(null, values) == number ? '#C80000' : 'FFFFFF',
                "color" : Math.max.apply(null, values) == number ? '#FFFFFF' : '#000000'
            }
        }
        
        $scope.getBarChance = function(bar){
            if(bar === "(Null)"){
                return NaN;
            }
            return $scope.barDrawWinChance[$scope.Number + "_" + bar].Item2;
        }
        
        $scope.getJockyWin = function(number){
            var jockyRate = $scope.race.RUNNER[number].JOCKEY_STAT.split(",");
            var jp = (parseInt(jockyRate[0]) +parseInt(jockyRate[1]) + parseInt(jockyRate[2]))/parseInt(jockyRate[4]);
            return jp;
        };
        
        $scope.getWinIndex = function(runner, number, bar){
            try{
                var values = $.map($scope.speedIndex, function(v) { return v; });
                var ratio = [1.5, 0.5, 0.02, 0.02, 0.0001, 0.05]
                var chanceRate = (1 / $scope.getPlaFairValue(number, bar)) * ratio[0];
                var plaRate = ((($scope.plas[number].MIN_WILLPAY / 1000) / $scope.getPlaFairValue(number, bar))) * ratio[1];
                var plaDrop = ($scope.plas[number].ODDSDROP)/100 * ratio[2];
                var winDrop = ($scope.wins[number].ODDSDROP)/100 * ratio[3];
                var fitnessRate = ((($scope.fitnessRating[runner] - 1)/ 2)) * ratio[4];
                var speedRate = (($scope.speedIndex[runner] - values.min())/(values.max() - values.min())) * ratio[5];
                var result = ( chanceRate  + speedRate + fitnessRate + plaDrop + winDrop)
                return Math.floor( result * 100)
            }catch(err){
                return NaN;
            }
        }
        
        $scope.setRaceNumber = function(number){
            $scope.Number = number;
            tipService.getRace($scope.Number).then(function(data){
                var root = data.data;
                var today = new Date();
                $.each(root, function(key, value){
                    if(value.DATE != undefined){
                        $scope.race = value.RACE;
                        $scope.race["track"] = value.MEETING_TRACK;
                    }
                });
                scope.$apply();
            });
            $scope.updateOdds(number);
        }
        
        $scope.updateOdds = function(number) {
            $scope.Number = number;
                //$scope.race = root.STARTERS[1].RACE;
                httpq.get(tipServiceUrl + "Win/" + number).then(function(data){
                    var root = data;
                    if(root != undefined){
                        $scope.updateDate = root.WIN.updateDate;
                        $scope.updateTime = root.WIN.updateTime;
                        $.each(root, function(key, value){
                            //if(value.DATE === formatDate(today)){
                                $scope.wins = value.RACE.OUT;
                            //}
                        });
                    }
                });
                
                httpq.get(tipServiceUrl + "Place/" + number).then(function(data){
                    var root = data;
                    $.each(root, function(key, value){
                        //if(value.DATE === formatDate(today)){
                            $scope.plas = value.RACE.OUT;
                        //}
                    });
                });
                


            
            $http.get(tipServiceUrl + "Speed/" + $scope.Number).success(function(data){
                race.speedMap = speedMapUrl + data.ImagePath;
                $scope.speedIndex =  data.SpeedIndex;
                $scope.fitnessRating = data.FitnessRating;
                $scope.newPaperTips = data.NewsPaperTip;
                $scope.jockyTip = data.JockyTip;
            });
            
            $http.get(tipServiceUrl + "Result/" + $scope.Number).success(function(data){
                race.result = data;
            });
            
//            $http.get(tipServiceUrl + "JockyFairValue").success(function(data){
//                $scope.fairValue = data;
//            });
            
            //$http.get(jkresultUrl).success(function(data){
            //    $scope.jkResult = $sce.trustAsHtml($(data).find(".bigborder").last().parent().html());
            //});
        }
        
        
        
        tipService.getBarDrawChance().then(function(data){
            $scope.barDrawWinChance = data.data;
            $scope.updateOdds($scope.Number);
            $interval(function(){
              $scope.updateOdds($scope.Number);
            }, 5000); 
        });
 
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

$( document ).ready(function() {
    $("body").on("click", "a", function(){
        if($(this).attr("id") != undefined){
            chrome.tabs.create({ url: $(this).attr("href") });
        }
    });
});

