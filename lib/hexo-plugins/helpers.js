var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var glob = require("glob");
var production = process.env.NODE_ENV == 'production';

// Return only base file name without dir
function getMostRecentFileName(dir) {
  var files = fs.readdirSync(dir);

  // use underscore for max()
  return _.max(files, function (f) {
      var fullpath = path.join(dir, f);

      // ctime = creation time is used
      // replace with mtime for modification time
      return fs.statSync(fullpath).ctime;
  });
}

function pick(data) {
  for(var i=0;i<data.length;i++) {
    if (data[i] != null) return data[i];
  }
}

function toArray(col) {
  var arr = [];
  col.each(function(item) {
    arr.push(item);
  });
  return arr;
}

hexo.extend.helper.register('pick', function() {
  return pick(arguments);
});

hexo.extend.helper.register('pick_site_image', function() {
  var image = pick(arguments) || 'default.png';
  if (image.charAt(0) != '/') {
    image = '/images/site/' + image;
  }
  return image;
});

hexo.extend.helper.register('json', function() {
  return '<pre>' + JSON.stringify(arguments[0]) + '</pre>';
});

hexo.extend.helper.register('each', function(items, fn) {
  _.each(items, fn);
});

hexo.extend.helper.register('guides', function(pages) {
  return pages.find({
    layout: 'guide'
  });
});

hexo.extend.helper.register('limit', function(array) {
  return array.slice(0,2);
});

hexo.extend.helper.register('is_production', function() {
  return production;
});

function mostRecentFile(globPattern) {
  var files = glob.sync(globPattern, {});
  return _.max(files, function (f) {
    return fs.statSync(f).ctime;
  });
}

function makeRelativeToDist(file) {
  return file.replace(/^.+?\/dist\//,'/dist/');
}

hexo.extend.helper.register('production_app_js', function() {
  var file = makeRelativeToDist(mostRecentFile('./assets/dist/combined-*.js'));
  return '<script type="text/javascript" src="' + file + '"></script>';
});

hexo.extend.helper.register('production_app_css', function() {
  var file = makeRelativeToDist(mostRecentFile('./assets/dist/combined-*.css'));
  return '<link rel="stylesheet" type="text/css" href="' + file + '" />';
});

var NOW = Math.floor(Date.now() / 1000);
hexo.extend.helper.register('timestamp', function() {
  return NOW;
});

hexo.extend.helper.register('resolvePageTitle', function(locals, config) {
  if (locals.page && locals.page.title) {
    return locals.page.title + ' ' + config.title_suffix;
  } else {
    return config.home_page_title
  }
});

hexo.extend.helper.register('resolvePermalink', function(link) {
  link = link.replace('/index.html', '/');
  link = link.replace(/https?:\/\/.+?\//,'/');
  return link;
});

hexo.extend.helper.register('resolvePostImage', function(image) {
  if (!image || image.length == 0) {
    image = "/images/clouds-yom.png";
  }
  return image;
});

hexo.extend.helper.register('resolvePostPattern', function(pattern) {
  return pattern ? 'has-pattern pattern-' + pattern : '';
});

hexo.extend.helper.register('numericAnchors', function(code) {
  var outer = 0;
  var inner = 0;
  var regex = /<(h[1-6]).+?>.+?<\/\1>/g
  _.each(code.match(regex), function(heading) {
    var match = heading.match(/<h(\d).+?>(.+?)<\/h\d>/i);
    if (!match && match.length <= 1) return;

    var html = match[0];
    var num = parseInt(match[1]);
    var heading = match[2];

    if (num > 2) return;

    if (num == 1) {
      outer++;
      inner = 0;
    } else {
      inner++;
    }

    var newHtml = html + '';
    var label = outer + '.' + inner;
    newHtml = newHtml.replace('>' + heading, '>' + label + ' ' + heading);
    code = code.replace(html, newHtml);
  });

  return code;
});
