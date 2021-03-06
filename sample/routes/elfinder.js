var express = require('express');
var router = express.Router();
var el = require('../../elfinder-connector'),
  path = require('path'),
  promise = require('promise'),
  multer = require('multer'),
  fs = require('fs-extra'),
  _ = require('underscore');
/* GET users listing. */
var media = path.resolve('media');
var user = 'tran';
el.setup({
  router: '/connector',
  tmbroot: path.join(media, '.tmb'),
  volumes: [
    path.join(media, 'public'),
    path.join(media, 'protected'),
    path.join(media, 'private', user),
  ],
  init: function () {
    //create protected and private folder.
    if (!fs.existsSync(path.join(media, 'protected', user))) {
      fs.mkdirSync(path.join(media, 'protected', user));
    }
    if (!fs.existsSync(path.join(media, 'private', user))) {
      fs.mkdirSync(path.join(media, 'private', user));
    }
  }
  //acl: function(user, path){}
})

router.get('/', function (req, res, next) {
  var cmd = req.query.cmd;
  if (cmd == 'file') {
    var target = el.decode(req.query.target);
    res.sendFile(target.absolutePath);
  } else if (el[cmd]) {
    el[cmd](user, req.query).then(function (result) {
      res.json(result);
    }).catch(function (e) {
      res.json({ error: e.message });
    })
  }
});

router.post('/', function (req, res, next) {
  var cmd = req.body.cmd;
  if (cmd && el[cmd]) {
    el[cmd](user, req.body).then(function (result) {
      res.json(result);
    }).catch(function (e) {
      res.json({ error: e.message });
    })
  }
})

var upload = multer({ dest: 'media/.tmp/' });
router.post('/upload', upload.array('upload[]', 10), function(req, res, next){
    el.upload(user, req.body, req.files).then(function (result) {
      res.json(result);
    }).catch(function (e) {
      res.json({ error: e.message });
    });
})

router.get('/tmb/:filename', function (req, res, next) {
  res.sendFile(el.tmbfile(req.params.filename));
})

router.get('/file/:volume/*', function (req, res, next) {
  var file = el.filepath(req.params.volume, req.params['0']);
  if (file)
    res.sendFile(file);
  else {
    res.status(404);
    res.send();
  }
})
module.exports = router;
