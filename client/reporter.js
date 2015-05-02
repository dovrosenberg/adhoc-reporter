isLoading = new ReactiveVar(true);

Template.reporter.helpers({
   getSchema: function() { return Template.instance().schema; },
   getFields: function() { return Template.instance().fields; },
   selector: function() { return Template.instance().selector.get(); },
   reachableCollections: function() {
      // if we've selected something, the reachable collections for filtering are in the lookup
      //    plus the one we selected
      var node = Template.instance().originalNode.get();
      if (node) {
         var retval = _.clone(Template.instance().canReachFromCollection[node]);
         retval.push(node);
         return retval;
      } else
         return null;
   }
});

Template.reporter.created = function(){
   var template = Template.instance();

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
   template.formats = {};  // keyed by field ID
   template.selector = new ReactiveVar({});
   template.queryID = new ReactiveVar('');
   template.columns = [];

   // parse the schema into our format
   var schemas = template.data.schemas;
   var formats = template.data.formats;
   template.schema = [];
   template.fields = {};

    _.each(schemas, function (collection, colName) {
      var collectionData = {
         text: collection.label,
         id: colName,
         state: {
            opened: true      // TODO: let incoming schema specify this
         },
         children: []
      };

      // read the schema from the corresponding schema item
      _.each(collection.fields, function(fieldDetail, fieldName) {
         var child = {
            id: fieldName + ':' + colName,    //use ':' because item.name can't start with it
            text: fieldDetail.label,
            icon: false,
            data: {
               fieldName: fieldName,
               collectionName: colName,
               type: (_.contains(['Number','Date','Boolean'],fieldDetail.type) ? fieldDetail.type : 'String')
            }
         };
         if (formats)         // I wanted to add these to child.data, but they aren't serializable so can't pass to server
            template.formats[child.id] = formats[fieldDetail.format];

         collectionData.children.push(child);
         template.fields[child.id] = child;
      });

      template.schema.push(collectionData);

      // convert the list of foreign keys into a complete map of all of the collections connected to any others
      // then add each one into the keySets
      _.each(collection.foreignKeys, function(keyObject) {
         keyObject.from = colName;
         keyObject.ID =  makeID();

         template.allKeys[keyObject.ID] = keyObject;
         addForeignKeyToKeySets(template.allKeySets, template.keySetsByCollection, template.canReachFromCollection, keyObject);
      });
   });

   template.selectedKeys = [];
   template.selectedCollections = [];
   template.selectedFields = {};       // holds the visible fields, each {id, text, type, fieldName, collectionName}; keyed by id
   template.filterFields = {};         // holds fields used for filtering
   template.originalNode = new ReactiveVar();
   TabularTables.Results.set(null);
};

Template.reporter.rendered = function(){
   template = Template.instance();
   templateData = Template.currentData();

   $('#ahr-collectionTree').on('dblclick','.jstree-anchor', function (e) {
      var instance = $.jstree.reference(this);
      var curNode = instance.get_node(this);

      //var curNode = data.node;

      // make sure it's a selectable node (not a collection name)
      if (curNode.children.length>0) {
         instance.deselect_node(curNode);
         //instance.toggle_node(curNode);
         return;
      }
      // remove from the tree and add to the selected fields
      template.adjustSelectedFields(true, curNode.data.fieldName, curNode.data.collectionName, curNode.text, curNode.data.type, curNode.state.selected, instance);
      instance.delete_node(this);
   })
   .jstree({
      'core' : {
         'multiple': true,
         'data': template.schema,
         'check_callback': true
      }
   });

   // this is needed in order to wait until server has created the data; need this because
   //    tabular doesn't reactively show new data, but even
   //    if it did, I don't think we'd want to see the data
   //    loading incrementally
   template.autorun(function(){
      var ID = template.queryID.get();
      var columns = template.columns;
      if (ReporterResultsReady.find({queryID:ID, ready:true}).count()>0) {
         isLoading.set(false);
         Meteor.call('createTabularTable',columns, ID, templateData.tableDOM, template.selector.get());
      }
   });

   // this is a template function because the filter module needs to call it, too
   // curNode is the node in the tree corresponding to the column to add/remove
   // if adding is false, node is being removed
   // if visible is true, it's a normal field, otherwise used for filtering only (i.e. not shown in table)
   template.adjustSelectedFields = function(visible, fieldName, collectionName, fieldText, fieldType, adding, treeInstance) {
      isLoading.set(true);

      var fieldId = fieldName + ':' + collectionName;

      if (adding) {
         // see if the field is already here; if not, see if the collection is
         if (visible) {
            if (!_.contains(template.selectedFields, fieldId)) {
               template.selectedFields[fieldId] = {
                  id: fieldId,
                  text: fieldText,
                  type: fieldType,
                  fieldName: fieldName,
                  collectionName: collectionName
               };
            }
         } else {
            // filter fields can be used more than once... so we track how many uses there are
            if (!_.contains(template.filterFields, fieldId)) {
               template.filterFields[fieldId] = {
                  id: fieldId,
                  text: fieldText,
                  type: fieldType,
                  fieldName: fieldName,
                  collectionName: collectionName,
                  numUsed: 1
               };
            } else {
               template.filterFields[fieldId].numUsed++;
            }
         }

         // if it's already in the selected collections, we can skip all the
         //    recalculating stuff
         if (!_.contains(template.selectedCollections, collectionName)) { // if it's already in there, don't need to do anything
            // see if we're turning this node on or off
            template.selectedCollections.push(collectionName);

            if (template.selectedCollections.length===1) {
               // save the collection of the 1st item picked---we use it to filter
               //   possible keySets when we pick the 2nd item
               template.originalNode.set(collectionName);

               // if 1st node, just turn off anything that doesn't have a keySet with this node
               // note that we might not have a treeInstance if this function's being called
               //    for a filter field, but that's OK because we don't let the user ever pick
               //    one of those before picking at least one real field (so the check here is
               //    belt and suspenders)
               // TODO: need to ensure that if the last visible field is removed, all filter fields
               //    are, too
               if (treeInstance) {
                  _.each(treeInstance.get_json(),function(item) {
                     // if it's the parent of this item or already hidden, skip it
                     if (item.id!==collectionName && !item.state.disabled) {
                        // otherwise, if it's not in the list, disable it
                        if (!_.contains(template.canReachFromCollection[collectionName],item.id)) {
                           treeInstance.disable_node(item);
                           treeInstance.close_node(item);
                        }
                     }
                  });
               }
            } else {
               // find all keySets that include the new node, every previously selected
               //    key, or (if none), the original node
               var possibleKeySets = getPossibleKeySets(template.keySetsByCollection[collectionName], template.selectedKeys, template.originalNode.get());
               var chosenKeySet;

               //if there is more than one, show user the list and ask them to pick one
               var cleanedSets = cleanupKeySets(possibleKeySets, template.selectedKeys);
               if (cleanedSets.length>1) {
                  // show the different possibilities - get a cleaned up list of choices
                  //    and then let the user pick from them
                  var pathStrings = _.map(cleanedSets, function(set) {
                     return createStringFromPath(createPathFromKeySet(template.allKeys, set, template.selectedKeys, collectionName, template.originalNode.get()));
                  });

                  // show the modal
                  var modal = createModal(collectionName, pathStrings, cleanedSets, template);
                  modal.show();

                  // we're done because we can't add the new collection until the modal returns
                  return;
               } else {
                  selectCleanedSet(cleanedSets[0]);
               }

               // don't have to turn anything off in the tree because after 1st node is picked,
               //    everything left can be connected somehow
            }
         }
      } else {
         // TODO:
         // deselected a node... what to do
      }

      finishLoadingData(template);
   };
};

Template.reporter.events({
   "click #resetTree": function(event, template){
       isLoading.set(true);
       template.selectedKeys = [];
       template.selectedCollections = [];
       template.selectedFields = {};
       //template.filterFields = {};
       $('#ahr-collectionTree').jstree('refresh',false,true);
   }
});

// chosenKeyList is an array of key IDs
selectCleanedSet = function(chosenKeyList) {
   _.each(chosenKeyList, function(item) {
      if (!_.contains(template.selectedKeys, item))
         template.selectedKeys.push(item);
   });
};

finishLoadingData = function(template) {
   var ID = makeID();

   Meteor.call('createResultsSet', ID, template.selectedFields, template.filterFields, _.map(template.selectedKeys, function(key) { return template.allKeys[key]; }));

   // don't need to add the filterFields
   template.columns = _.map(template.selectedFields, function(item) {
      var retval = {
         data: item.id,
         title: item.text,
         type: (item.type==='Number' ? 'num-fmt' : (item.type==='Date' ? 'date' : 'string'))
      };

      if (template.formats[item.id])
         retval.render = function(data,type,row,meta) {
            return template.formats[item.id](data);
         };

      return retval;
   });
   if (template.columns.length===0)
      TabularTables.Results.set(null);
   else {
      template.queryID.set(ID);
   }
};
