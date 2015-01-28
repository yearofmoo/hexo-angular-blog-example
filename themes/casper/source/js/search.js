angular.module('HexoSearch', ['HexoPlainView'])

  .filter('unsafeHtml', ['$sce', function($sce) {
    return function(text) {
      return $sce.trustAsHtml(text);
    }
  }])

  .factory('searchIndex', [function() {
    return function() {
      var index = lunr(function () {
        this.field('title', {boost: 50})
        this.field('description', { boost : 20 })
        this.field('tags')
        this.ref('id')
      });

      var i = 0;
      return {
        index : index,
        search : function(q) {
          return index.search(q);
        },
        add : function(item) {
          var tags = (item.tags || []).join(' ');
          index.add({
            title: item.title,
            description: item.description,
            tags: tags,
            id: i++
          });
        }
      }
    };
  }])

  .factory('searchRequest', ['$http', '$q', 'searchIndex', function($http, $q, searchIndex) {
    var index, allResults;
    return function(q, startIndex) {
      if (!index) {
        return downloadJSONFile().then(function() {
          return performSearch(q, startIndex);
        });
      } else {
        return $q.when(performSearch(q, startIndex));
      }
    };

    function downloadJSONFile() {
      return $http.get('/data/search-results.json').then(function(response) {
        index = searchIndex();
        allResults = response.data || [];

        angular.forEach(allResults, function(result) {
          index.add(result);
        });
        return index;
      });
    }

    function performSearch(q, startIndex) {
      return fetchResults(index.search(q));
    }

    function fetchResults(matches) {
      var results = [];
      for(var i=0;i<matches.length;i++) {
        var ref = matches[i].ref;
        results[i] = allResults[ref];
      }
      return results;
    }
  }])

  .controller("SearchController", ['$scope', '$window', '$location', 'searchRequest',
                           function($scope,   $window,   $location,   searchRequest) {

    var ctrl = this;
    $scope.$watchCollection(function() { return $location.search(); }, function(data) {
      var q = data.q;
      searchRequest(q).then(function(results) {
        ctrl.results = results;
      });
    });
  }])

  .directive('hexoSearchBar', ['$location', '$window', 'hexoLocation', function($location, $window, hexoLocation) {
    return {
      scope: true,
      controllerAs: 'searchCtrl',
      controller : [function() {
        this.value = function(v) {
          if (arguments.length) {
            hexoLocation('/search?q=' + v);
          } else {
            return ($location.search() || {}).q;
          }
        };
      }]
    }
  }])

  .directive('hexoSearchResults', [function() {
    return {
      templateUrl: '/ng-templates/search_results.html',
      controllerAs: 'searchResultsCtrl',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var ctrl = this;
        $scope.$watchCollection($attrs.hexoSearchResults, function(results) {
          ctrl.results = results
        });
      }]
    }
  }])
