/* a keySet: {
      collections: ['a','b','c'],   // list of collecions hit
      keys: ['dskjhKASDFw3r9hASFHs','dskjhKAfdFw3r9hASFHs']    // list of keys used
   }
*/

/*keyDescriptor:
{
   ID: 'dskjhKASDFw3r9hASFHs',
   from: 'LPCommitments'
   localKey: 'investorID',
   to: 'Investors',
   foreignKey: '_id',
   name: 'Investor',
   reverseName: 'Commitments'
}

*/

addForeignKeyToKeySets = function(allKeySets, keySetsByCollection, canReachFromCollection, keyDescriptor){
   // note: we don't check for duplicates - instead assuming input data
   //    doesn't include them

   // add to other keySets that contain either collection in this key
   // we search keySets backward to avoid checking keySets we just added
   var l = allKeySets.length, i;

   matchingCollection = function (item) { return (item===keyDescriptor.to || item===keyDescriptor.from); };
   for (i=l-1; i>=0; i--) {
      var keySetToCheck = allKeySets[i];

      // if the keySet contains either the from or to collection, we need to
      //    create a new keySet with the current one plus the key
      if (_.some(keySetToCheck.collections, matchingCollection)) {
         // just make sure this key isn't already in it
         if (!_.contains(keySetToCheck.keys, keyDescriptor.ID))
            addToKeySets(allKeySets, keySetsByCollection, canReachFromCollection, keySetToCheck, keyDescriptor);
      }
   }

   // add this basic keySet to the list - do this last so this keySet doesn't get
   //    picked up by loop above
   addBasicKeySet(allKeySets, keySetsByCollection, canReachFromCollection, keyDescriptor);
};

addBasicKeySet = function(allKeySets, allKeySetsByCollection, canReachFromCollection, keyDescriptor) {
   addToKeySets(allKeySets, allKeySetsByCollection, canReachFromCollection,
         { collections: [], keys: [] }, keyDescriptor);
};

addToKeySets = function(allKeySets, keySetsByCollection, canReachFromCollection, keySetToAdjust, keyDescriptor) {
   var keySetObject;

   // make a copy of the keySet to adjust, because we're creating a new one
   keySetObject = jQuery.extend(true, {}, keySetToAdjust);

   var collections = keySetObject.collections;
   if (!_.contains(collections, keyDescriptor.to))
      collections.push(keyDescriptor.to);
   if (!_.contains(collections, keyDescriptor.from))
      collections.push(keyDescriptor.from);

   keySetObject.keys.push(keyDescriptor.ID);

   // need to add the keySet to each mapping in keySetsByCollection
   if (!keySetsByCollection[keyDescriptor.to])
      keySetsByCollection[keyDescriptor.to] = [];
   if (!keySetsByCollection[keyDescriptor.from])
      keySetsByCollection[keyDescriptor.from] = [];

   _.each(keySetObject.collections, function(item) {
      keySetsByCollection[item].push(keySetObject);

      if (!canReachFromCollection[item]) canReachFromCollection[item] = [];
      if (item!==keyDescriptor.from &&
            !_.contains(canReachFromCollection[item], keyDescriptor.from))
         canReachFromCollection[item].push(keyDescriptor.from);

      if (!canReachFromCollection[item]) canReachFromCollection[item] = [];
      if (item!==keyDescriptor.to &&
            !_.contains(canReachFromCollection[item], keyDescriptor.to))
         canReachFromCollection[item].push(keyDescriptor.to);
   });

   // and add to master list
   allKeySets.push(keySetObject);
};

// TODO: handle cases where there are extraneous keys in the set
// given a keyset containing collections from and to, returns an array
//    which is an ordered set of the keys that starts at from, ends at to,
//    and where each key is oriented in the proper direction
createPathFromKeySet = function(allKeys, keys, from, to) {
   var keysRemaining;
   var retval = [];
   var toKey;
   var l = keys.length;
   var keyToCheck;

   // pull all the key details
   keysRemaining = _.map(keys, function(key) {
      return allKeys[key];
   });

   // find the key with 'from' in it
   for (var i=0; i<l; i++) {
      keyToCheck = keysRemaining[i];
      if (keyToCheck.from===from) {
         retval.push(keyToCheck);
         keysRemaining.splice(i,1);
         break;
      } else if (keyToCheck.to===from) {
         retval.push(reverseKey(keyToCheck));
         keysRemaining.splice(i,1);
         break;
      }
   }

   // find the key with 'to' in it
   l = keysRemaining.length;
   for (i=0; i<l; i++) {
      keyToCheck = keysRemaining[i];
      if (keyToCheck.to===to) {
         retval.push(keyToCheck);
         keysRemaining.splice(i,1);
         break;
      } else if (keyToCheck.from===to) {
         retval.push(reverseKey(keyToCheck));
         keysRemaining.splice(i,1);
         break;
      }
   }

   // need to go through remaining keys to see how they hook up
   // for now, we only handle simplest case of a straight line
   var done = false;
   var lastStep = from;
   do {
      // find the step starting at lastStep
      l = keysRemaining.length;
      for (i=0; i<l; i++) {
         keyToCheck = keysRemaining[i];
         if (keyToCheck.from===from) {
            keysRemaining.splice(i,1);
            retval.push(keyToCheck);
            lastStep = keyToCheck.to;
            if (lastStep===to)
               done = true;
            break;
         } else if (keyToCheck.to===from) {
            keysRemaining.splice(i,1);
            retval.push(verseKey(keyToCheck));
            lastStep = keyToCheck.from;
            if (lastStep===to)
               done = true;
            break;
         }
      }
   } while (!done);

   if (keysRemaining.length!==0)
      throw "Invalid path found in keySet";

   return retval;
};

// returns the same key, but with from and to reversed
reverseKey = function(key) {
   return {
      ID: key.ID,
      from: key.to,
      to: key.from,
      localKey: key.foreignKey,
      foreignKey: key.localKey,
      name: key.reverseName,
      reverseName: key.name
   };
};

// returns array of the keySets in setsToCheck that contain all of the
//    requiredKeys (or, if none, the original node)
getPossibleKeySets = function(setsToCheck, requiredKeys, originalNode) {
   var retval = [];

   if (requiredKeys.length>0) {
      _.each(setsToCheck, function(setToCheck) {
         if (_.every(requiredKeys, function(item) {
                  return (_.contains(setToCheck.keys, item));
               }))
            retval.push(setToCheck);
      });
   } else {
      _.each(setsToCheck, function(setToCheck) {
         if (_.contains(setToCheck.collections, originalNode))
            retval.push(setToCheck);
      });
   }

   return retval;
};

// returns an array of arrays of keys (not keySets), each of which:
//    was in setsToClean, all the selectedKeys have been removed,
//    and it's not a superset of anthing else in the returned array
// note: this is safe because everything in the incoming setsToClean
//    must touch the collection we're trying to get to, so if it's a
//    subset of something else, then the extra path must be extraneous
cleanupKeySets = function(setsToClean, selectedKeys) {
   var filteredSets = [];

   // remove the already selected keys from each
   // we don't use filter b/c don't want to modify setsToClean and
   //    building up is faster than cloning and then filtering
   _.each(setsToClean, function(keySet) {
      var i, l=keySet.keys.length;
      var returnSet = [];

      for (i=0; i<l; i++) {
         if (!_.contains(selectedKeys, keySet.keys[i]))
            returnSet.push(keySet.keys[i]);
      }
      filteredSets.push(returnSet);
   });

   // removing sets that are a superset of another set
   var i, j, l=filteredSets.length;
   if (l>1) {
      // sort by length so we can check the longest first (why?  because if
      //    we can eliminate with a smaller set before having to check a
      //    longer one, that's better)
      _.sortBy(filteredSets, function(keyList) { return keyList.length; });
      setContains = function(item) { return _.contains(filteredSets[j],item); };

      for (i=0; i<l; i++) {
         // check every set larger than it; if the larger set has all
         //    the smaller set's elements, remove it
         // we do this backward because we're removing elements
         for (j=l-1; j>i; j--) {
            if (_.every(filteredSets[i], setContains)) {
               filteredSets.splice(j,1);
               l--;
            }
         }
      }
   }

   return filteredSets;
};
