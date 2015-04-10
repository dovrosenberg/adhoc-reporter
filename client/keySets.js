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
   // note: we don't check for duplicate keys - instead assuming input data
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
         // make sure this key isn't already in it
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

   var newSet = keySetObject.keys;
   newSet.push(keyDescriptor.ID);

   var containedInNewSet = function(key) { return _.contains(newSet,key); };

   // make sure this keySet doesn't exist already... do that by the keys
   if (!_.find(allKeySets, function(keySet) {
      return keySet.keys.length=== keySetObject.keys.length && _.every(keySet.keys, containedInNewSet);
   })) {
      // for now, we don't allow loops; so make sure either the from or the to isn't already in the set
      // (at least one of them will be, because that's why we're adding this key)
      var collections = keySetObject.collections;
      var addedCol = false;
      if (!_.contains(collections, keyDescriptor.to)) {
         collections.push(keyDescriptor.to);
         addedCol = true;
      }
      if (!_.contains(collections, keyDescriptor.from)) {
         collections.push(keyDescriptor.from);
         addedCol = true;
      }
      if (!addedCol)        // both collections already in the list
         return;

      // need to add the keySet to each mapping in keySetsByCollection
      if (!keySetsByCollection[keyDescriptor.to])
         keySetsByCollection[keyDescriptor.to] = [];
      if (!keySetsByCollection[keyDescriptor.from])
         keySetsByCollection[keyDescriptor.from] = [];
      if (!canReachFromCollection[keyDescriptor.from])
         canReachFromCollection[keyDescriptor.from] = [];
      if (!canReachFromCollection[keyDescriptor.to])
         canReachFromCollection[keyDescriptor.to] = [];

      _.each(keySetObject.collections, function(item) {
         keySetsByCollection[item].push(keySetObject);

         if (!canReachFromCollection[item]) canReachFromCollection[item] = [];
         if (item!==keyDescriptor.from) {
            if (!_.contains(canReachFromCollection[item], keyDescriptor.from))
               canReachFromCollection[item].push(keyDescriptor.from);
            if (!_.contains(canReachFromCollection[keyDescriptor.from], item))
               canReachFromCollection[keyDescriptor.from].push(item);
         }

         if (item!==keyDescriptor.to) {
            if (!_.contains(canReachFromCollection[item], keyDescriptor.to))
               canReachFromCollection[item].push(keyDescriptor.to);
               if (!_.contains(canReachFromCollection[keyDescriptor.to], item))
                  canReachFromCollection[keyDescriptor.to].push(item);
         }
      });

      // and add to master list
      allKeySets.push(keySetObject);
   }
};

// given a keyset containing collections from and to, returns an array
//    which is an ordered set of the keys that starts at from, ends at to,
//    and where each key is oriented in the proper direction
// assumes there are no extraneous keys (because it's been cleaned ahead of time)
// from is only used if there are no priorKeys
// priorKeys should be list of key IDs
createPathFromKeySet = function(allKeys, keys, priorKeys, to, from) {
   var keysRemaining;
   var retval = [];
   var toKey;
   var i,l;
   var keyToCheck;
   var lastStep;
   var finalKey;

   // pull all the key details
   keysRemaining = _.map(keys, function(key) {
      return allKeys[key];
   });

   // find the starting collection...
   // TODO: I think there should only be one key that touches a key
   //    already in the set and the point it touches must be the starting
   //    point... I can't prove that's the case, though, which could cause
   //    this not to work
   l=keysRemaining.length;

   if (l>0) {
      if (priorKeys.length===0) {
         lastStep = from;
      } else {
         l = keysRemaining.length;

         fromMatchesPriorTo = function(priorKey) {
            return allKeys[priorKey].to===keyToCheck.from;
         };
         toMatchesPriorFrom = function(priorKey) {
            return allKeys[priorKey].from===keyToCheck.to;
         };

         for (i=0; i<l; i++) {
            keyToCheck = keysRemaining[i];
            var matchingKey = _.find(priorKeys, fromMatchesPriorTo);

            // if we found a key in the set that ends where this begins, then keyToCheck
            //    is the 1st key in our new path
            if (matchingKey) {
               lastStep = allKeys[matchingKey].to;
               retval.push(keyToCheck);
               keysRemaining.splice(i,1);
               break;
            } else {
               matchingKey = _.find(priorKeys, toMatchesPriorFrom);
               if (matchingKey) {
                  lastStep = allKeys[matchingKey].from;
                  retval.push(reverseKey(keyToCheck));
                  keysRemaining.splice(i,1);
                  break;
               }
            }
         }
      }

      // need to go through remaining keys to see how they hook up
      // for now, we only handle simplest case of a straight line
      var done = (keysRemaining.length===0);
      do {
         // find the step starting at lastStep
         l = keysRemaining.length;
         for (i=0; i<l; i++) {
            keyToCheck = keysRemaining[i];
            if (keyToCheck.from===lastStep) {
               keysRemaining.splice(i,1);
               retval.push(keyToCheck);
               lastStep = keyToCheck.to;
               if (lastStep===to)
                  done = true;
               break;
            } else if (keyToCheck.to===lastStep) {
               keysRemaining.splice(i,1);
               retval.push(reverseKey(keyToCheck));
               lastStep = keyToCheck.from;
               if (lastStep===to)
                  done = true;
               break;
            }
         }
      } while (!done);

      if (keysRemaining.length!==0)
         throw "Invalid path found in keySet";
   }

   return retval;
};

createStringFromPath = function(path) {
   var retval;

   retval = _.reduce(path, function(str, item, index) {
      return str + (index!==0 ? '->' :'') + item.from + ' (' + item.name + ')';
   }, '');

   retval += '->' + path[path.length-1].to;

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
// requiredKeys should be list of key IDs
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
// selectedKeys should be list of key IDs
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
      filteredSets = _.sortBy(filteredSets, function(keyList) { return keyList.length; });
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
