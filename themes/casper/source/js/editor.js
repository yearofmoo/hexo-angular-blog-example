angular.module('HexoEditor', ['HexoPlainView'])

  .factory('syntaxHighlight', ['$window', function($window) {
    return function(element, type) {
      $window.hljs.highlightBlock(element.find('code')[0]);
    };
  }])

  .directive('pre', ['syntaxHighlight', function(syntaxHighlight) {
    return function(scope, element, attrs) {
      if (element.hasClass('hexo-editor-slide')) return;
      syntaxHighlight(element, element.attr('class'));
    }
  }])

  .directive('hexoEditor', ['syntaxHighlight', 'tpl', function(syntaxHighlight, tpl) {
    return {
      restrict: 'C',
      scope: true,
      templateUrl : tpl('/ng-templates/code_editor_tpl.html'),
      transclude: true,
      controllerAs : 'editor',
      controller : function() {
        this.files = [];
        this.setFile = angular.noop;
      },
      link : function(scope, element, attrs, editor) {
        var slides = element.find('.hexo-editor-slide');
        var elements = [];

        angular.forEach(slides, function(slide) {
          var elm = angular.element(slide);
          var file = elm.attr('data-title');
          editor.files.push(file);
          elements.push(elm);

          if (editor.current != null) {
            hide(elm);
          } else {
            editor.current = 0;
            highlight(elm, elm.attr('data-type'));
            show(elm);
          }
        });

        editor.setCurrent = function(index) {
          if (index != editor.current) {
            var target = elements[index];

            show(target);
            highlight(target, target.attr('data-type'));

            hide(elements[editor.current]);
            editor.current = index;
          }
        };
      }
    }

    function show(elm) {
      elm.css('display','block');
    }

    function hide(elm) {
      elm.css('display','none');
    }

    function highlight(element, type) {
      if (element.data('highlighted')) return;

      syntaxHighlight(element, type);
      element.data('highlighted', true);
    }
  }])
