var _    = require('underscore');
var path = require('path');
var fs   = require('fs');

var DEPS_DIR = path.resolve( __dirname, "../../../deps/bower_components");

hexo.extend.tag.register('codeblock', function(args, content, options){
  return '<code>' + _.escape(content) + '</code>';
}, { ends: true });

hexo.extend.tag.register('code', function(args, content, options){
  var dir = path.resolve(
    __dirname, "../../source/", path.dirname(options.locals.source)
  );

  var file = dir + '/' + args[0] + '.json';
  var data = require(file);
  var files = loadContent(data.files, dir);

  var html = "\n<div class=\"hexo-editor\" data-title=\"" + data.title + "\">\n";
  for(var i=0;i<files.length;i++) {
    var file = files[i];
    html += "<pre class=\"" + file.type + " hexo-editor-slide\"" +
                " data-type=\"" + file.type + "\"" +
                " data-title=\"" + file.title + "\"><code>" +
              file.content +
            "</code></pre>\n";
  }

  html += "</div>\n";

  return html;
});

function loadContent(files, dir) {
  var content = [];
  for(var i=0;i<files.length;i++) {
    var file = files[i];
    var sourceCode = fs.readFileSync(dir + '/_' + file.file, "utf8");
    var details = _.extend({
      content: _.escape(sourceCode).trim()
    }, file);
    details.title = details.title || details.file;
    details.type = details.type || getExtension(details.file);
    content.push(details);
  }
  return content;
}

function loadDep(name, file, dir) {
  return fs.readFileSync(dir + "/" + name + "/" + file);
}

function getExtension(path) {
  return path.substr(path.lastIndexOf(".") + 1).toLowerCase();
}
