Package.describe({
  name: 'dovrosenberg:ad-hoc-reporter',
  version: '0.4.0',
  summary: 'The beginning of an ad-hoc reporting package',
  git: 'https://github.com/dovrosenberg/adhoc-reporter',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.1');

  api.addFiles([
     './client/keySets.js',
     './client/modal.html',
     './client/modal.js',
     './client/reporter.html',
     './client/reporter.js',
     './client/reporterResults.html',
     './client/reporterResults.js',
     './client/filtering/inputRow.html',
     './client/filtering/inputRow.js',
     './client/filtering/logicRow.html',
     './client/filtering/logicRow.js',
     './client/filtering/parser.js',
     './client/filtering/reporterFiltering.html',
     './client/filtering/reporterFiltering.js'
  ],'client');

  api.addFiles([
     './common/adHocReporter.js',
     './common/results.js'
  ],['client','server']);

  api.addFiles([
     './server/publication.js',
     './server/buildResults.js',
     './server/joins.js'
  ],['server']);

  api.use([
     'standard-app-packages',    // TODO: maybe just include the ones we really need
     'reactive-var',
     'uzumaxy:jstree@3.0.9_1',
     'pahans:reactive-modal@1.0.2',
     'rajit:bootstrap3-datepicker@1.4.1'
     //'aldeed:tabular'          // TODO: reincorporate once pull request is merged (and then remove all the extra files, etc. below)
     //'mizzao:user-status'      // TODO: use this to automatically clean up query results on server when user logs out
  ]);

// tabular - remove everything from here down once tabular package is incorporated directly
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
