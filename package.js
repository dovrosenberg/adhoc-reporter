Package.describe({
  name: 'dovrosenberg:ad-hoc-reporter',
  version: '0.1.0',
  summary: 'The beginning of an ad-hoc reporting package',
  // URL to the Git repository containing the source code for this package.
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.1');

  api.addFiles([
     './client/bs-collapse-panel/bs-collapse-panel.html',
     './client/bs-collapse-panel/bs-collapse-panel.js',
     './client/reporter.html',
     './client/keySets.js',
     './client/reporter.js'
  ],'client');

  api.addFiles([
     './common/adHocReporter.js',
     './common/results.js',
     './common/joins.js'
 ],['client','server']);

  api.addFiles([
     './server/publication.js'
  ],['server']);

  api.use([
     'standard-app-packages',    // TODO: maybe just include the ones we really need
     'reactive-var',
     'uzumaxy:jstree',
     //'aldeed:tabular'
     'mizzao:user-status'
  ]);

// tabular
api.use(['check', 'underscore', 'mongo', 'blaze', 'templating', 'reactive-var', 'tracker']);

api.use(['meteorhacks:subs-manager@1.2.0'], ['client', 'server'], {weak: true});

api.export('Tabular');

api.addFiles('meteor-tabular/common.js');
api.addFiles('meteor-tabular/server/tabular.js', 'server');
api.addFiles([
  'meteor-tabular/client/lib/jquery.dataTables.js',
  'meteor-tabular/client/lib/dataTables.bootstrap.js',
  'meteor-tabular/client/lib/dataTables.bootstrap.css',
  'meteor-tabular/client/tabular.html',
  'meteor-tabular/client/util.js',
  'meteor-tabular/client/tableRecords.js',
  'meteor-tabular/client/tableInit.js',
  'meteor-tabular/client/pubSelector.js',
  'meteor-tabular/client/tabular.js',
  // images
  'meteor-tabular/images/sort_asc.png',
  'meteor-tabular/images/sort_asc_disabled.png',
  'meteor-tabular/images/sort_both.png',
  'meteor-tabular/images/sort_desc.png',
  'meteor-tabular/images/sort_desc_disabled.png'
], 'client');
});
