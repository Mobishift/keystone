module.exports = function (keystone) {
  return function (respectHiddenOption) {
    return function (req, res, next) {
      req.list = keystone.list(req.params.list);
      var hidden_permissions = req.list.get('hidden_permissions') || [];
      if (!req.list || (respectHiddenOption && (req.list.get('hidden') || hidden_permissions.indexOf(req.user.permission) != -1))) {
        req.flash('error', 'List ' + req.params.list + ' could not be found.');
        return res.redirect('');
      }
      next();
    };
  };
};
