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
