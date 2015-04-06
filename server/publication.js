Meteor.publish('reporterResultsReady', function() {
   return ReporterResultsReady.find({userID: this.userId});
});
Meteor.publish('reporterResults', function() {
   // returns nothing; just here so client can see the collection
   return ReporterResults.find({userID: ''});
});

Meteor.users.find({ "status.online": true }).observe({
   removed: function(id) {
      // id just went offline; clean up reports
      ReporterResults.remove({userID: id},{multi:true});
      ReporterResultsReady.remove({userID: id},{multi:true});
   }
});
