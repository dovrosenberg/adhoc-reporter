TabularTables = {};

if (Meteor.isClient) {
   UI.registerHelper("resultsTable", function() { return TabularTables.Results.get(); });
   UI.registerHelper("hasResultsTable", function() { return TabularTables.Results.get()!==null; });
}

Meteor.startup(function(){
   TabularTables.Results = new ReactiveVar();
   TabularTables.Results.set(null);

   if (Meteor.isClient) {
      Meteor.subscribe('reporterResultsReady');
      Meteor.subscribe('reporterResults');      // just so we can have access to the collection
   }
});

Meteor.methods({
   'createTabularTable': function(columns,ID,dom,selector) {
      // TODO: add data type to columns (https://datatables.net/reference/option/columns.type)
      //    based on what's indicated by the schema
      var joinedSelector;

      if ((typeof selector!=='object') || isEmptyObject(selector))
         joinedSelector = {queryID: ID};
      else
         joinedSelector = { $and: [
            {queryID: ID},
            selector
         ]};

      TabularTables.Results.set(new Tabular.Table({
         name: ID,
         collection: ReporterResults,
         columns: columns,
         'processing': true,
         dom: dom,
         selector: function() { return joinedSelector; }
      }));
   },
   'createResultsSet': function(ID, selectedFields, filterFields, selectedKeys) {
      if (Meteor.isServer) {
         loadAllData(ID, selectedKeys, selectedFields, filterFields);
      }
   }
});


function isEmptyObject(object) { for(var i in object) { return false; } return true; }

makeID = function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 20; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};
