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
   'createTabularTable': function(columns,ID,dom) {
      // TODO: add data type to columns (https://datatables.net/reference/option/columns.type)
      //    based on what's indicated by the schema
      // TODO: allow package user to specify a formatting function
      //    for each data type
      TabularTables.Results.set(new Tabular.Table({
         name: ID,
         collection: ReporterResults,
         columns: columns,
         'processing': true,
         dom: dom,
         selector: function() { return {queryID: ID}; }
      }));
   },
   'createResultsSet': function(ID, selectedFields, selectedKeys) {
      if (Meteor.isServer) {
         loadAllData(ID, selectedKeys, selectedFields);
      }
   }
});


getCollection = function (string) {
   if (string==='Users')
      return Meteor.users;

   for (var globalObject in this) {
      if (this[globalObject] instanceof Meteor.Collection && globalObject === string)
         return (this[globalObject]);
   }
   return undefined; // if none of the collections match
};

makeID = function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 20; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

// selectedKeys is an array of keys
// selectedFields is keyed by collection name
loadAllData = function(ID, selectedKeys, selectedFields) {
   var fieldsByCol = {};
   var cumulativeData = [];
   var colName;

   // setup all the fields
   _.each(selectedFields, function(fld) {
      if (!fieldsByCol[fld.data.collectionName])
         fieldsByCol[fld.data.collectionName] = [];
      fieldsByCol[fld.data.collectionName].push(fld.data.fieldName);
   });

   // pick a collection to start
   if (selectedKeys.length===0) {
      // single collection - pull from fields
      colName = selectedFields[0].data.collectionName;
      cumulativeData = loadCollection(colName, fieldsByCol[colName]);
   } else {
      // go through keys to make a list for each collection of all the key fields
      //    needed
      var pulledCols = [];
      var unusedKeys = selectedKeys.slice();    // make a copy b/c we're going to remove items

      _.each(unusedKeys, function(key) {
         if (!fieldsByCol[key.from])
            fieldsByCol[key.from] = [];
         if (!_.contains(fieldsByCol[key.from],key.localKey))
            fieldsByCol[key.from].push(key.localKey);

         if (!fieldsByCol[key.to])
            fieldsByCol[key.to] = [];
         if (!_.contains(fieldsByCol[key.to],key.foreignKey))
            fieldsByCol[key.to].push(key.foreignKey);
      });

      // just pick a colleciton to start
      // TODO: optimize, probably by pulling smallest results first
      colName = unusedKeys[0].from;
      pulledCols.push(colName);

      cumulativeData = loadCollection(colName, fieldsByCol[colName]);

      // as long as any keys are left, find one that touches at least one collection
      //    already loaded and load it
      while (unusedKeys.length>0) {
         // find a key
         var nextCol;
         var nextKey;
         var forward;

         for (var i=0; i<unusedKeys.length; i++) {
            if (_.contains(pulledCols, unusedKeys[i].from)) {
               nextCol = unusedKeys[i].to;
               forward = true;
               break;
            } else if (_.contains(pulledCols, unusedKeys[i].to)) {
               nextCol = unusedKeys[i].from;
               forward = false;
               break;
            }
         }
         if (!nextCol)     // something went wrong
            throw "Error - cannot find a matching key";
         else {
            pulledCols.push(nextCol);
            nextKey = unusedKeys[i];
            unusedKeys.splice(i,1);
         }

         // load the collection, including any key fields
         var fields = fieldsByCol[nextCol];
         var newData = loadCollection(nextCol, fields);

         // merge it to cumulative data
         cumulativeData = innerJoin(cumulativeData, newData,
               (forward ? nextKey.localKey + ':' + nextKey.from :
                  nextKey.foreignKey + ':' + nextKey.to),
               (forward ? nextKey.foreignKey + ':' + nextKey.to :
                  nextKey.localKey + ':' + nextKey.from));
      }
   }

   pushDataToResults(ID, cumulativeData);
};

loadCollection = function(collectionName, collectFields) {
   var retval = [];
   var fields={};
   _.each(collectFields, function(field) {
      fields[field] = 1;
   });

   _.each(
      // have to rename all the fields when they come back in
      getCollection(collectionName).find({},{fields: fields}).fetch(),
      function(item) {
         var data={};

         _.each(collectFields, function(field) {
            data[field+':'+collectionName] = item[field];
         });

         retval.push(data);
      }
   );

   // merge with cumulative data
   return retval;
};

pushDataToResults = function(ID, cumulativeData) {
   _.each(cumulativeData, function(data) {
      data.queryID = ID;
      ReporterResults.insert(data);
   });

   ReporterResultsReady.insert({
      userID: Meteor.userId(),
      queryID: ID,
      ready: true
   });
};
