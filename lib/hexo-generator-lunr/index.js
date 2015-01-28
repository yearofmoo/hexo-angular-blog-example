var ejs = require('ejs'),
    merge = require('utils-merge'),
    path = require('path'),
    file = hexo.util.file2;

var lunrSrc = path.join(__dirname, 'search-tpl.json.ejs'),
    lunrTpl = ejs.compile(file.readFileSync(lunrSrc));

var generator = hexo.extend.generator;
if (generator.register.length === 1){
  generator.register(lunrSearchGenerator);
} else {
  generator.register('sitemap', lunrSearchGenerator);
}

function lunrSearchGenerator(locals, render, callback){
  var config = hexo.config;

  var lunrConfig = merge({
    path: '/data/search-results.json'
  }, config.lunr);

  if (!path.extname(lunrConfig.path)){
    lunrConfig.path += '.json';
  }

  var posts = [].concat(locals.posts.toArray(), locals.pages.toArray())
    .filter(function(item){
      return item.search !== false;
    })
    .sort(function(a, b){
      return b.updated - a.updated;
    });

  var json = lunrTpl({
    config: config,
    posts: posts,
    sanitize: function(html) {
      return html.replace(/\s*\n+\s*/g, " ").replace(/<\/?.+?>/g,'')
                 .replace(/"/g,'&quot;');
    },
    permalink : function(href) {
      return href.charAt(0) == '/'
          ? href
          : href.replace(/^.+?\/\/.+?(\/.+)$/, function(_, match) {
            return match;
          });
    }
  });

  hexo.route.set(lunrConfig.path, json);
  callback();
};
