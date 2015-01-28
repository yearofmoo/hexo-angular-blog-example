angular.module('HexoPlainView', ['HexoCore'])

  .factory('hexoTimestamp', ['$document', function($document) {
    var body = angular.element($document[0].body);
    var ts = parseInt(100);
    return ts;
  }])

  .factory('tpl', ['hexoTimestamp', function(hexoTimestamp) {
    return function(tpl) {
      return tpl + ((tpl.indexOf("?") == -1) ? "?" : "&") + hexoTimestamp;
    };
  }])

  .factory('searchQSParams', ['$window', function($window) {
    return function parseQS(qs) {
      qs = qs || $window.location.search || '';
      if (qs.charAt(0) == '?') qs = qs.substr(1);

      var data = {};
      var tokens = qs.split('&');
      angular.forEach(tokens, function(token) {
        var i = token.indexOf('=');
        var key = token.substr(0,i);
        var value = token.substr(i + 1);
        data[key]=value;
      });

      return data;
    };
  }])

  // damn $location service won't give up
  .factory('$location', ['$window', 'searchQSParams', function($window, searchQSParams) { 
    return {
      hash : function() {
        return $window.location.hash
      },
      search : function() {
        return searchQSParams();
      }
    }
  }])

  .factory('hexoPage', ['$window', 'plainview', '$document', '$animate', '$compile', '$rootScope',
               function($window,   plainview,   $document,   $animate,   $compile,   $rootScope) {

    var prevUrl;
    var bodyView, bodyScope;
    var view, scope;
    var body = $($document[0].body);
    return function(url) {
      if (!bodyScope) {
        view = bodyView = angular.element(body.find('main'));
        bodyScope = bodyView.scope();
      }

      $rootScope.$broadcast('plainview:request');
      plainview(url).then(loadNewPage, function() {
        $window.location = url;
      });

      function loadNewPage(data) {
        var newView = data.element;
        var newScope = bodyScope.$new();
        $compile(newView)(newScope);
        $animate.enter(newView, body);
        $animate.leave(view);
        if (scope) {
          scope.$destroy();
        }
        view = newView;
        scope = newScope;

        $rootScope.$broadcast('plainview:reload');
      }
    };
  }])

  .factory('hexoLocation', ['$window', 'hexoPage', function($window, hexoPage) {
    return function(url, skipUpdate) {
      url = prepareAddressUrl(url);
      if (!$window.history) {
        $window.location = url;
      } else if($window.location.href != url) {
        var previousPath = prepareAddressUrl($window.location.pathname);
        $window.history.pushState({ data : '...' }, null, url);

        var index = minIndexOf(url.indexOf('?'), url.indexOf('#'));
        var path = index > 0
            ? prepareAddressUrl(url.substring(0, index))
            : url;

        if (previousPath != path) {
          preivousPath = path;
          hexoPage(url);
        }
      }
    }

    function minIndexOf(a,b) {
      a = Math.max(a,0);
      b = Math.max(b,0);
      return a > 0 && b > 0
          ? Math.min(a,b)
          : a || b;
    }

    function prepareAddressUrl(url) {
      if (url.charAt(0) == '#') {
        if (url.length == 1) {
          url = '';
        }
      } else if (url
                  && url.length
                  && !/\.html/.test(url)
                  && url.indexOf('#') == -1
                  && url.indexOf('?') == -1
                  && url.charAt(url.length-1) != '/') {
        url += '/';
      }
      return url;
    }
  }])

  .value('allowClick', function(url, target, event) {
    if (!url || url.length == 0) return;
    if (/^\w+:\/\//.test(url)) return;
    if (target && target.length) return;
    if (event.which == 2 || event.shiftKey || event.ctrlKey || event.metaKey) return;
    return true;
  })

  .value('prepareAjaxContent', function(html) {
    var parts = html.match(/(<main.+?>)([\s\S]+)(<\/main>)/m);
    var html = parts[2];
    var element = $(parts[1] + parts[3]);
    element.html(html);

    return { element   : element }
  })

  .factory('prepareAjaxUrl', ['tpl', function(tpl) {
    return function(url) {
      url = url.replace(/\/(?=$|\#|\?)/, '/index.html');
      url = url.replace('.html','_plain.html');
      return tpl(url);
    };
  }])

  .factory('plainview',
             ['$http', '$document', 'prepareAjaxUrl', 'prepareAjaxContent', 'hexoTimestamp', '$q',
      function($http,   $document,   prepareAjaxUrl,   prepareAjaxContent,   hexoTimestamp,   $q) {

    return function(url) {
      var production = $($document[0].body).data('plainview') == 'on';

      if (production) {
        url = prepareAjaxUrl(url);
      }
      return $http.get(url).then(function(response) {
        var content = prepareAjaxContent(response.data);
        return content;
      });
    };
  }])

  .directive('plainview', ['$window', 'allowClick', 'hexoLocation', 'hexoPage',
                   function($window,   allowClick,   hexoLocation,   hexoPage) {

    return function(scope, element, attrs) {
      var formerPath;
      scope.$watch(function() {
        return $window.location.pathname;
      }, function(v) {
        formerPath = v;
      });

      element.delegate('a', 'click', function(e) {
        var elm = $(this);
        var url = elm.attr('href');
        var target = elm.attr('target');
        if (url.length == 0) {
          e.preventDefault();
          return;
        } else if (url.charAt(0) == '#') {
          return;
        }

        if (allowClick(url, target, e) && !elm.hasClass('ignore')) {
          e.preventDefault();
          hexoLocation(url);
        }
      });

      $($window).on('popstate', function(e) {
        if (formerPath != $window.location.pathname) {
          formerPath = $window.location.pathname;
          hexoPage($window.location);
        }
      });
    };
  }])
