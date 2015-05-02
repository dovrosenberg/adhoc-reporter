Template.logicRow.rendered = function(){
   $('#combinator').val(this.data.startingCombinator);
};

Template.logicRow.events({
   "click #ahr-btnResetCombinator": function(event, template) {
      $('#combinator').val(this.startingCombinator);
   },
   "input #combinator": function(event, template){
      // throttle calls so it only reparses when user stops typing for 500ms
      if (handle)
         clearTimeout(handle);
      var handle = setTimeout(function () {
         template.parent(1).combinator.set($(event.target).val());
      }, 500);
   }
});
