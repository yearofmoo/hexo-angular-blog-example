angular.module('HexoNewsletter', ['MailChimp', 'ngCookies'])

  .value('mcOptions', {
    u : '2dcb5d3cfdb463385b76f0175',
    id : '54b9be8076',
    username: 'yearofmoo',
    dc: 'us8'
  })

  .controller('NewsletterFormController', ['mcSignup', function(mcSignup) {
    this.submit = function(isValid, data) {
      if (!isValid) return;

      var ctrl = this;
      var name = splitName(data.name);

      ctrl.failure = false;
      ctrl.loading = true; 

      mcSignup(name[0], name[1], data.email).then(function(message) {
        ctrl.success = true;
        ctrl.message = message;
        ctrl.submitted = true;
      }, function(message) {
        ctrl.failure = true;

        message = screenErrorMessage(message);
        if (message.closeForm) {
          ctrl.submitted = true;
        }
        ctrl.message = message.message;
      }).finally(function() {
        ctrl.loading = false; 
      });
    };

    function screenErrorMessage(message) {
      if (/is already subscribed/.test(message)) {
        return {
          closeForm: true,
          message: 'You have already subscribed to this newsletter using that email'
        };
      }

      if (/We need to confirm your email address/.test(message)) {
        message = 'Good stuff! Now please visit your email inbox to confirm your subscription';
      }
      else if (/The username portion of the email address/.test(message)) {
        message = 'Please enter a valid email address';
      }
      else if (/\#6592/.test(message)) {
        message = 'Please try again in about 5 min';
      }

      return { message : message };
    }

    function splitName(name) {
      var vals = name.split(/[\s\+]+/)
      var first = vals.shift();
      var last = vals.join(" ");
      return [first, last];
    }
  }])
