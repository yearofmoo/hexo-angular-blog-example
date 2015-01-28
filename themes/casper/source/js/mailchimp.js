angular.module('MailChimp', [])

  .value('mcOptions', { })
  .value('mcUrl', function(username, dc) {
    var tpl = '//{USERNAME}.{DC}.list-manage.com/subscribe/post-json';
    return tpl.replace('{USERNAME}', username)
              .replace('{DC}', dc);
  })

  .factory('mcSignup', ['$http', '$q', 'mcOptions', 'mcUrl',
                function($http,   $q,   mcOptions,   mcUrl) {
    return function(firstName, lastName, email) {
      var params = {
        EMAIL : email,
        FNAME : firstName,
        LNAME : lastName,
        c     : 'JSON_CALLBACK',
        u     : mcOptions.u,
        id    : mcOptions.id
      };

      var url = mcUrl(mcOptions.username, mcOptions.dc) + "?" + toQueryString(params);

      return $http.jsonp(url).then(function(response) {
        var data = response.data || {};
        if (data.result == 'success') {
          return data.msg;
        }
        return $q.reject(resolveErrorMessage(data.msg));
      }, function() {
        resolveErrorMessage();
      });

      function toQueryString(obj) {
        var q = '';
        for (var i in obj) {
          q += i + '=' + obj[i] + '&';
        }
        return q;
      }

      function resolveErrorMessage(message) {
        if (message) {
          var split = message.indexOf(' - ');
          if (split >= 0) {
            message = message.substr(split + 3);
          }
        } else {
          message = 'Sorry! An unknown error occured.';
        }
        return message;
      }
    };
  }]);
