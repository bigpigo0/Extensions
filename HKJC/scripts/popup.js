var mainUrl = "http://bet.hkjc.com/racing/hr_bet_main_block.aspx?lang=ch&block=1";
var homeUrl = "http://bet.hkjc.com/racing/getXML.aspx";
var tipsUrl = "http://hk.racing.nextmedia.com/other9tips.php";
var meetingsUrl = "http://bet.hkjc.com/racing/getXML.aspx?type=MEETINGS&callback=getMeetingDates";
var resultUrl = "http://bet.hkjc.com/racing/pages/results.aspx?date=26-04-2015&venue=ST&raceno=";
var speedUrl = "http://www.hkjc.com/chinese/formguide/speedmap.asp?FrmRaceNum=";
var speedMapUrl = "http://www.hkjc.com/chinese/formguide/";
var onccTipUrl = "http://racing.on.cc/racing/fav/current/rjfavf0301x0.html";

(function () {
    var app = angular.module('race', []);
    
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
    
    app.controller('RaceController', ["$http", "$scope", "$interval", function($http, $scope, $interval){
        var race = this;
        race.odds = [];
        race.result = {};
        $scope.Number = 1;
        $scope.wins = [];
        $scope.plas = [];
        $scope.runner = [];
        $scope.speedIndex = [];
        $scope.fitnessRating = [];
        $scope.updateDate = "";
        $scope.updateTime = "";
        $scope.speedMap = "";
        race.track = "";
    
        var dom = "";
        var onccdom = "";
        var result = "";
        
        $scope.numOfRace = 0;
                
        $http.get(tipsUrl).success(function(data){
            dom = $(data);
        });
        
        $http.get(onccTipUrl).success(function(data){
            onccdom = $(data);
        });
        
        $http.get(mainUrl).success(function(data){
            var temp = $(data).find('td:contains("賽事:")').parent().find("td:eq(1)").text()
            $scope.numOfRace = parseInt(temp.substr(0, temp.length - 2));
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
        
        race.getTips = function(horseName){
            var result = [];
            var tips = dom.find('table.small tr:has(td:contains("' + horseName + '"))').find('td:eq(0)').text().trim().split('\n\n');
            $.each(tips, function( index, value ) {
                result.push(value.substr(0, 1));
            });
            return result.join(" ");
        }
        
        race.getOnccTip = function(horseName){
            return onccdom.find("a:contains('" + horseName + "')").index();
        }
        
        $scope.updateOdds = function(number) {
            $scope.Number = number;
            $http.get(homeUrl + "?type=starters&RaceNo=" + number).success(function(data){
                var root = $.xml2json(data);
                var today = new Date();
                $.each(root, function(key, value){
                    if(value.DATE != undefined){
                        $scope.race = value.RACE;
                        $scope.race["track"] = value.MEETING_TRACK;
                    }
                });
                //$scope.race = root.STARTERS[1].RACE;
                $http.get(homeUrl + "?type=win&RaceNo=" + number).success(function(data){
                    var root = $.xml2json(data);
                    $scope.updateDate = root.WIN.updateDate;
                    $scope.updateTime = root.WIN.updateTime;
                    $.each(root, function(key, value){
                        //if(value.DATE === formatDate(today)){
                            $scope.wins = value.RACE.OUT;
                        //}
                    });
                });
                
                $http.get(homeUrl + "?type=pla&RaceNo=" + number).success(function(data){
                    var root = $.xml2json(data);
                    $.each(root, function(key, value){
                        //if(value.DATE === formatDate(today)){
                            $scope.plas = value.RACE.OUT;
                        //}
                    });
                });
            });
            
            $http.get(speedUrl + (($scope.Number < 10) ? "0" : "") + $scope.Number).success(function(data){
                race.speedMap = speedMapUrl + $(data).find("img[alt*='Speed Map of meeting']").attr('src');
                $(data).find(".normalfont").each(function(index, value){
                    $scope.speedIndex[$(value).find('td:eq(1)').text().trim()] =  $(value).find('td:eq(4)').text().trim();
                    $scope.fitnessRating[$(value).find('td:eq(1)').text().trim()] = $(value).find('td:eq(5)').find("img").length
                });

            });
            
            $http.get(resultUrl + $scope.Number).success(function(data){
                result = $(data);
                race.result[$(data).find("td:contains('名次'):eq(3) table tr:eq(1) td:eq(2)").text()] = 1;
                race.result[$(data).find("td:contains('名次'):eq(3) table tr:eq(2) td:eq(2)").text()] = 2;
                race.result[$(data).find("td:contains('名次'):eq(3) table tr:eq(3) td:eq(2)").text()] = 3;
                race.result[$(data).find("td:contains('名次'):eq(3) table tr:eq(4) td:eq(2)").text()] = 4;
            });
        }
        
        
        $interval(function(){
          $scope.updateOdds($scope.Number);
        }, 5000);  
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

