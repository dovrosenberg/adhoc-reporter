Template.reporterFiltering.created = function(){
   var template = Template.instance();
   template.showInputRow = new ReactiveVar(false);
   template.filterRows = new ReactiveVar([]);
   template.filterRowCount = 0;
   template.combinator = new ReactiveVar('');
   template.combinatorErrors = new ReactiveVar('');

   // when filterRows changes, handle default values of combinator
   template.autorun(function() {
      var l = template.filterRows.get().length;

      if (l!==template.filterRowCount) {
         // if we were using the default, then update it
         if (l===0 || l===1 || template.combinator.get()===createDefaultCombinator(template.filterRowCount)) {
            template.combinator.set(createDefaultCombinator(l));
         }
         template.filterRowCount = l;
      }
   });

   // whenever filterRows or combinator change, update selector on parent
   template.autorun(function(){
      var fr = template.filterRows.get();
      var selector;
      var error = '';

      switch (fr.length) {
         case 0:
            selector = null;
            break;
         case 1:
            selector = fr[0].selector;
            break;
         default:
            // parse the combinator and filterRows and pass the resulting selector up to the reporter
            try {
               selector = combinatorParser.parse(template.combinator.get(),{filterRows:fr});
            } catch (e) {
               error = e.message;
            }

            if (!error) {
               // TODO: update parser to track which terms were used, then check here to report
               //    if any of them weren't
            }
      }

      template.combinatorErrors.set(error);

      // if no errors, then update the query
      if (!error) {
         template.parent(1).selector.set(selector);
      }

   });
};

Template.reporterFiltering.helpers({
   combinatorErrors: function() { return Template.instance().combinatorErrors.get(); },
   combinator: function() { return Template.instance().combinator.get(); },
   filterRows: function() { return Template.instance().filterRows.get(); },
   numFilters: function() { return Template.instance().filterRows.get().length; },
   showLogicRow: function() { return Template.instance().filterRows.get().length>1; },
   showInputRow: function() { return Template.instance().showInputRow.get(); }
});

Template.reporterFiltering.events({
   'click #addFilter': function(event, template){
       template.showInputRow.set(true);
   },
   'click #clickableSpan': function (event) {
		var target = $(event.target);
		var body = target.parents('.collapsible-panel').find('.collapsible-panel-body');
		if (body.hasClass('panel-collapsed')) {
			// expand the panel
			body.slideDown();
			body.removeClass('panel-collapsed');
			if (this.glyphicon)
				target.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
			else
				target.removeClass('fa-chevron-down').addClass('fa-chevron-up');
		}
		else {
			// collapse the panel
			body.slideUp();
			body.addClass('panel-collapsed');
			if (this.glyphicon)
				 target.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
			else
				 target.removeClass('fa-chevron-up').addClass('fa-chevron-down');
		}
	}
});

Template.filterRow.events({
   "click #ahr-btnDelFilter": function(event, template){
      // remove from the field set
      var splitId = this.fieldId.split(':');
      template.parent(2).adjustSelectedFields(false, splitId[0], splitId[1], '', this.fieldType, false);

      // remove the filter row (that will trigger recalculation of query)
      var fr = template.parent(1).filterRows.get();
      fr.splice(this.index-1,1);
      template.parent(1).filterRows.set(fr);
   }
});

function createDefaultCombinator (numFilters) {
   switch(numFilters) {
      case 0:
         return '';
      case 1:
         return '1';
      default:
         var retval = '1';

         if (numFilters>1) {
            for (var i=2; i<=numFilters; i++)
               retval += ' AND ' + i;
         }
         return retval;
   }
}
