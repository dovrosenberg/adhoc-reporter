// declare ReporterResults
// This is the table that returns the results of a query
/*
   queryID

   every instance is different, other than it has a unique key to identify
      the query instance that created it
   all of the rows for that query instance should have the same fields
*/
ReporterResults  = new Mongo.Collection("reporterResults");
ReporterResultsReady = new Mongo.Collection("reporterResultsReady");
