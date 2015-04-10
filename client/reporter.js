isLoading = new ReactiveVar(true);

Template.reporterResults.helpers({
   isLoading: function(){
      return isLoading.get();
   }
});

Template.reporter.created = function(){
   var template = Template.instance();

    // parse the schema into our format
    template.schema = [];
    var collections = template.data.collections;
    var schemas = template.data.schemas;

    _.each(collections, function(item, index) {
      var collectionData = {
         text: item.label,    // collection label
         id: item.name,
         state: {
            opened: true
         },
         children: []
      };

      // read the schema from the corresponding schema item
      _.each(schemas[index], function(value, key) {
         var child = {
            id: key + ':' + item.name,    //use ':' because item.name can't start with it
            text: value.label,
            data: {
               fieldName: key,
               collectionName: item.name
            }
         };

         collectionData.children.push(child);
      });

      template.schema.push(collectionData);
   });

   // convert the list of foreign keys into a complete map of all of the
   //   collections connected to any others
   // a "keySet" is a set of keys that go together to connect a set of collections
   /* a keySet: {
         collections: ['a','b','c'],   // list of collecions hit
         keys: ['dskjhKASDFw3r9hASFHs','dskjhKAfdFw3r9hASFHs']    // list of keys used
      }
   */
   template.allKeySets = [];       // just an array of keySets
   template.keySetsByCollection = {}; // keyed by collection name, with each element an array of all keySets containing that collection
   template.allKeys = {};
   template.canReachFromCollection = {}; // keyed by collection name, with each element an array of all collections sharing a keySet with that one

   // convert foreignKeys object structure into a simple one keyed by ID
   //    with the from and ID fields added
   // then add each one into the keySets
   _.each(template.data.foreignKeys, function(keyList, fromCol) {
      _.each(keyList, function(keyObject) {
         keyObject.from = fromCol;
         keyObject.ID =  makeID();

         template.allKeys[keyObject.ID] = keyObject;
         addForeignKeyToKeySets(template.allKeySets, template.keySetsByCollection, template.canReachFromCollection, keyObject);
      });
   });

   template.selectedKeys = [];
   template.selectedCollections = [];
   TabularTables.Results.set(null);
};

Template.reporter.rendered = function(){
   template = Template.instance();
   templateData = Template.currentData();

   $('#collectionTree').on(
      'select_node.jstree', function(e, data) {
         var curNode = data.node;

         // make sure it's a selectable node (not a collection name)
         if (curNode.children.length>0) {
            data.instance.deselect_node(curNode);
            data.instance.toggle_node(curNode);
            return;
         }

         // if it's already in the selected collections, we can skip all the
         //    recalculating stuff
         var clickedCollection = curNode.data.collectionName;
         var addCollection = (!_.contains(template.selectedCollections, clickedCollection));


         isLoading.set(true);

         if (addCollection) {
            // see if we're turning this node on or off
            if (curNode.state.selected) {
               // turning on - disable any trees no longer available
               template.selectedCollections.push(clickedCollection);

               if (template.selectedCollections.length===1) {
                  // save the collection of the 1st item picked---we use it to filter
                  //   possible keySets when we pick the 2nd item
                  template.originalNode = curNode.parent;

                  // if 1st node, just turn off anything that doesn't have a keySet with this node
                  _.each(data.instance.get_json(),function(item) {
                     // if it's the parent of this item or already hidden, skip it
                     if (item.id!==clickedCollection && !item.state.disabled) {
                        // otherwise, if it's not in the list, disable it
                        if (!_.contains(template.canReachFromCollection[clickedCollection],item.id)) {
                           data.instance.disable_node(item);
                           data.instance.close_node(item);
                        }
                     }
                  });
               } else {
                  // find all keySets that include the new node, every previously selected
                  //    key, or (if none), the original node
                  var possibleKeySets = getPossibleKeySets(template.keySetsByCollection[clickedCollection], template.selectedKeys, template.originalNode);
                  var chosenKeySet;

                  //if there is more than one, show user the list and ask them to pick one
                  var cleanedSets = cleanupKeySets(possibleKeySets, template.selectedKeys);
                  if (cleanedSets.length>1) {
                     // show the different possibilities - get a cleaned up list of choices
                     //    and then let the user pick from them
                     var pathStrings = _.map(cleanedSets, function(set) {
                        return createStringFromPath(createPathFromKeySet(template.allKeys, set, template.selectedKeys, clickedCollection, template.originalNode));
                     });

                     // show the modal
                     var modal = createModal(clickedCollection, pathStrings, cleanedSets, template, templateData, data);
                     modal.show();

                     // we're done because we can't add the new collection until the modal returns
                     return;
                  } else {
                     selectCleanedSet(cleanedSets[0]);
                  }

                  // don't have to turn anything off in the tree because after 1st node is picked,
                  //    everything left can be connected somehow
               }
            } else {
               // TODO:
               // deselected a node... what to do
            }
         }

         finishLoadingData(template, templateData, data);
      }
   )
   .jstree({
      'core' : {
         'multiple': true,
         'data': template.schema
      }
   });
};

Template.reporter.events({
   "click #resetTree": function(event, template){
       isLoading.set(true);
       template.selectedKeys = [];
       template.selectedCollections = [];
       $('#collectionTree').jstree('refresh',false,true);
   }
});

// chosenKeyList is an array of key IDs
selectCleanedSet = function(chosenKeyList) {
   _.each(chosenKeyList, function(item) {
      if (!_.contains(template.selectedKeys, item))
         template.selectedKeys.push(item);
   });
};

finishLoadingData = function(template, templateData, data) {
   var selectedFields = _.map(data.selected, function(item) {
      var node = data.instance.get_node(item);
      return node;
   });
   var ID = makeID();

   Meteor.call('createResultsSet', ID, selectedFields, _.map(template.selectedKeys, function(key) { return template.allKeys[key]; }));

   var columns = _.map(selectedFields, function(item) {
      return {
         data: item.id,
         title: item.text
      };
   });
   if (columns.length===0)
      TabularTables.Results.set(null);
   else {
      //wait until server has created the data; need this because
      //    tabular doesn't reactively show new data, but even
      //    if it did, I don't think we'd want to see the data
      //    loading incrementally
      template.autorun(function(computation){
         if (ReporterResultsReady.find({queryID:ID, ready:true}).count()>0) {
            isLoading.set(false);
            Meteor.call('createTabularTable',columns, ID, templateData.tableDOM);
            computation.stop();
         }
      });
   }
};
