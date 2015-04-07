// inner join between from and to using keys given
innerJoin = function(from, to, localKey, foreignKey) {
   var m = from.length, n = to.length, index = [], c = [];
   var prop, y, i, j;

   for (i = 0; i < m; i++) {     // loop through m items
      var row = from[i];
      if (!index[row[localKey]])
         index[row[localKey]] = [];
      index[row[localKey]].push(row); // create an index for primary table
   }

   function combine(x) {
      var newObj = {};
      for (prop in x)
         newObj[prop] = x[prop];
      for (prop in y)
         newObj[prop] = y[prop];
      c.push(newObj);         // select only the columns you need
   }

   for (j = 0; j < n; j++) {     // loop through n items
      y = to[j];

      if (y[foreignKey])      // get all the corresponding row
         xs = index[y[foreignKey]]; // get corresponding row from primary
      if (xs)
         _.each(xs, combine);
   }

    return c;
};

// returns an object (with keys='.' + ID)
/*innerJoin = function(array1, array1, key1, key2, fields1, fields2) {
    var together = [];//, length = 0;

    function add1(item) {
        var key = '.' + item[key1];
        var obj = {};
        if (!together[key])
            together[key] = obj;
         //together[length++] = pobj;
        //pobj = together[key];
        for (var k in fields1)
            obj[k] = item[k];
    }
    function add2(item) {
        var pkey = '.'+item[key2];
        var obj = {};
        if (!together[pkey])
            together[pkey] = pobj;
        //together[length++] = pobj;
        //pobj = together[pkey];
        for (var k in fields2)
            obj[k] = item[k];
    }
    _.each(array1, add1);
    _.each(array2, add2);

    return together;
};
*/
