Template.inputRow.created = function(){
   Template.instance().fieldType = new ReactiveVar('');
   Template.instance().fieldId = new ReactiveVar('');
   Template.instance().reachableSchema = _.filter(Template.parentData(0).schema, function(item) {
      return _.contains(Template.parentData(0).reachableCollections, item.id);
   });
};

Template.inputRow.rendered = function() {
   var template = Template.instance();
   template.fieldType.set(template.reachableSchema[0].children[0].data.type);
   template.fieldId.set(template.reachableSchema[0].children[0].id);
};

Template.inputRow.helpers({
   filterNum: function() { return this.numFilters+1; },
   fieldType: function(){ return Template.instance().fieldType.get(); },
   fieldId: function(){ return Template.instance().fieldId.get(); },
   reachableSchema: function() { return Template.instance().reachableSchema; }
});

Template.inputRow.events({
   "change #ahr-chooseField": function(event, template){
      template.fieldType.set(this.fields[$(event.target).val()].data.type);
      template.fieldId.set($(event.target).val());
   }
});

Template.properInputs.created = function(){
    Template.instance().selectorName = new ReactiveVar('');
};

Template.properInputs.rendered = function(){
   Template.instance().selectorName.set('');
};

Template.properInputs.helpers({
   selectorName: function(){ return Template.instance().selectorName.get(); },
   between: function() { return Template.instance().selectorName.get()==='between'; },
   isDate: function() { return this.fieldType==='Date'; },
   isBoolean: function() { return this.fieldType==='Boolean'; },
   isString: function() { return this.fieldType==='String'; },
   isNumber: function() { return this.fieldType==='Number'; },
   customDate: function() { return Template.instance().selectorName.get()==='customDate'; },
   singleInputDate: function() { return _.contains(['nextNDays','lastNDays','onOrBefore','onOrAfter'],
         Template.instance().selectorName.get()); },
   somethingSelected: function() { return Template.instance().selectorName.get()!==''; },
   showAdd: function() {
      // TODO: validate in here?
      if (Template.instance().selectorName.get()==='')
         return false;
      switch (this.fieldType) {
         case 'Boolean':
            return true;  // selector is just yes/no
         case 'Date':
            if (Template.instance().selectorName.get()==='customDate')  // need two dates
               return ($('ahr-filterInput-1').val()!=='' && ($('ahr-filterInput-2').val()!==''));
            if (_.contains(['nextNDays','lastNDays','onOrBefore','onOrAfter'],
                  Template.instance().selectorName.get()))  // need one date
               return ($('ahr-filterInput-1').val()!=='');
            return true;      // other date selectors need nothing
         case 'Number':
            if (Template.instance().selectorName.get()==='between')  // need two numbers
               return ($('ahr-filterInput-1').val()!=='' && ($('ahr-filterInput-2').val()!==''));
            return ($('ahr-filterInput-1').val()!=='');     // need one number
         case 'String':
            return ($('ahr-filterInput-1').val()!=='');     // need one string
      }
      return false;     // should never get here
    }
});

Template.properInputs.events({
   "change #ahr-chooseNumberSelector": function(event, template){
      template.selectorName.set($(event.target).val());
   },
   "change #ahr-chooseStringSelector": function(event, template){
      template.selectorName.set($(event.target).val());
   },
   "change #ahr-chooseDateSelector": function(event, template){
      template.selectorName.set($(event.target).val());
   },
   "click #ahr-btnCancelFilter": function(event, template){
      // clean everything out

      template.parent(2).showInputRow.set(false);
   },
   "click #ahr-btnAddFilter": function(event, template){
      // TODO: validate input
      var selectedOpt = $('#ahr-chooseField option:selected');

      var newSelector = createSelector(this.fieldId, selectedOpt.text(), selectedOpt.parent()[0].label,
            this.fieldType, template.parent(3).formats[this.fieldId], template.selectorName.get(),
            $('#ahr-filterInput-1').val(), $('#ahr-filterInput-2').val());
      var filterRows = template.parent(2).filterRows.get();
      newSelector.index = filterRows.length+1;
      filterRows.push(newSelector);
      template.parent(2).filterRows.set(filterRows);
      template.parent(2).showInputRow.set(false);

      var splitId = this.fieldId.split(':');
      template.parent(3).adjustSelectedFields(false, splitId[0], splitId[1], '', this.fieldType, true);
   }
});

/* returns object {
      selector: the selector
      text: the text to display in the fixed row
   }
*/
// TODO: pass in fieldname for the text output and the format function to apply for text output
function createSelector(fieldId, fieldText, collectionText, fieldType, formatFn, selectorName, box1, box2) {
   var retval = {
      text: '',
      selector: {},
      fieldId: fieldId
   };
   var fieldName = collectionText + ' : ' + fieldText;

   var numLookup = {
      '$ne': 'not equal to',
      '$gt': 'greater than',
      '$gte': 'greater than or equal to',
      '$lt': 'less than',
      '$lte': 'less than or equal to'
   };
   var gte = {}, lte = {};

   var applyFormat = (formatFn || function(data) { return data; });

   switch (fieldType) {
      case 'Number':
         switch (selectorName) {
            case '$ne':
            case '$gt':
            case '$lt':
            case '$gte':
            case '$lte':
               retval.selector[fieldId] = {};
               retval.selector[fieldId][selectorName] = Number(box1);
               retval.text = '<mark>' + fieldName + '</mark> ' + numLookup[selectorName] +
                     ' <mark>' + applyFormat(box1) + '</mark>';
               break;
            case '$eq':
               retval.selector[fieldId] = Number(box1);
               retval.text = '<mark>' + fieldName + '</mark> equals <mark>' + applyFormat(box1) + '</mark>';
               break;
            case 'between':
               gte[fieldId] = {$gte: Number(box1)};
               lte[fieldId] = {$lte: Number(box2)};
               retval.selector = {$and: [gte, lte]};
               retval.text = '<mark>' + fieldName + '</mark> between <mark>' + applyFormat(box1) +
                     '</mark> and <mark>' + applyFormat(box2) + '</mark>';
         }
         break;
      case 'Date':
         // there are really only 3 cases... 1) before, 2) after, 3) everything else
         if (selectorName==='onOrBefore') {
            retval.selector[fieldId] = {};
            retval.selector[fieldId].$lte = moment(box1,["M-D-YYYY","M-D-YY"]).toISOString();
            retval.text = '<mark>' + fieldName + '</mark> on or before <mark>'  + applyFormat(box1) + '</mark>';
         } else if (selectorName==='onOrAfter'){
            retval.selector[fieldId] = {};
            retval.selector[fieldId].$gte = moment(box1,["M-D-YYYY","M-D-YY"]).toISOString();
            retval.text = '<mark>' + fieldName + '</mark> on or after <mark>'  + applyFormat(box1) + '</mark>';
         } else {
            // find the correct start and end dates
            var date1, date2;

            switch (selectorName) {
               case 'customDate':
                  date1 = moment(box1,["M-D-YYYY","M-D-YY"]);
                  date2 = moment(box2,["M-D-YYYY","M-D-YY"]).endOf('day');
                  retval.text = '<mark>' + fieldName + '</mark> between <mark>'  + applyFormat(date1) +
                        '</mark> and <mark>' + applyFormat(date2) + '</mark>';

                  // TODO: throw formatting errors throughout this section and display somewhere
                  break;
               case 'currentYear':
                  date1 = moment().startOf('year');
                  date2 = moment().endOf('year');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>current year</mark>';
                  break;
               case 'lastYear':
                  date1 = moment().subtract(1,'year').startOf('year');
                  date2 = date1.endOf('year');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>last year</mark>';
                  break;
               case 'nextYear':
                  date1 = moment().add(1,'year').startOf('year');
                  date2 = date1.endOf('year');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>next year</mark>';
                  break;
               case 'yearToDate':
                  date1 = moment().startOf('year');
                  date2 = moment().endOf('day');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>year to date</mark>';
                  break;
               case 'currentQuarter':
                  date1 = moment().startOf('quarter');
                  date2 = moment().endOf('quarter');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>current quarter</mark>';
                  break;
               case 'lastQuarter':
                  date1 = moment().subtract(1,'quarter').startOf('quarter');
                  date2 = date1.endOf('quarter');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>last  quarter</mark>';
                  break;
               case 'nextQuarter':
                  date2 = date1.endOf('quarter');
                  date1 = moment().add(1,'quarter').startOf('quarter');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>next quarter</mark>';
                  break;
               case 'quarterToDate':
                  date1 = moment().startOf('quarter');
                  date2 = moment.endOf('day');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>quarter to date</mark>';
                  break;
               case 'currentMonth':
                  date1 = moment().startOf('month');
                  date2 = moment().endOf('month');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>current month</mark>';
                  break;
               case 'lastMonth':
                  date1 = moment().subtract(1,'month').startOf('month');
                  date2 = date1.endOf('month');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>last month</mark>';
                  break;
               case 'nextMonth':
                  date1 = moment().add(1,'month').startOf('month');
                  date2 = date1.endOf('month');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>next month</mark>';
                  break;
               case 'monthToDate':
                  date1 = moment().startOf('month');
                  date2 = moment.endOf('day');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>month to date</mark>';
                  break;
               case 'currentWeek':
                  date1 = moment().startOf('week');
                  date2 = moment().endOf('week');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>current week</mark>';
                  break;
               case 'lastWeek':
                  date1 = moment().subtract(1,'week').startOf('week');
                  date2 = date1.endOf('week');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>last week</mark>';
                  break;
               case 'nextWeek':
                  date1 = moment().add(1,'week').startOf('week');
                  date2 = date1.endOf('week');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>next week</mark>';
                  break;
               case 'weekToDate':
                  date1 = moment().startOf('week');
                  date2 = moment().endOf('day');
                  retval.text = '<mark>' + fieldName + '</mark> is during <mark>week to date</mark>';
                  break;
               case 'today':
                  date1 = moment().startOf('day');
                  date2 = moment().endOf('day');
                  retval.text = '<mark>' + fieldName + '</mark> is <mark>today</mark>';
                  break;
               case 'yesterday':
                  date1 = moment().add(1,'day').startOf('day');
                  date2 = date1.endOf('day');
                  retval.text = '<mark>' + fieldName + '</mark> is <mark>yesterday</mark>';
                  break;
               case 'tomorrow':
                  date1 = moment().subtract(1,'day').startOf('day');
                  date2 = date1.endOf('day');
                  retval.text = '<mark>' + fieldName + '</mark> is <mark>tomorrow</mark>';
                  break;
               case 'lastNDays':
                  date1 = moment().subtract(box1,'day').startOf('day');
                  date2 = moment().endOf('day');
                  retval.text = '<mark>' + fieldName + '</mark> during <mark>last ' + box1 + ' days</mark>';
                  break;
               case 'nextNDays':
                  date1 = moment().startOf('day');
                  date1 = moment().add(box1,'day').endOf('day');
                  retval.text = '<mark>' + fieldName + '</mark> during <mark>next ' + box1 + ' days</mark>';
                  break;
            }
            gte[fieldId] = {$gte: date1.toISOString()};
            lte[fieldId] = {$lte: date2.toISOString()};
            retval.selector = {$and: [gte, lte]};
         }
         break;
      case 'String':
         switch (selectorName) {
            case '$eq': // have to use regex so it's case insensitive
               // TODO: if these searches take too long, it's because mongo can't use an index
               //   fix is hard, though, inside a package... you'd want to create duplicate
               //   search fields for every string search that are all lowercase when you save
               //   the string; then could just search the lowercase version here, but use the
               //   other for displaying
               retval.selector[fieldId] = new RegExp(box1,'i');
               retval.text = '<mark>' + fieldName + '</mark> equals <mark>' + applyFormat(box1) + '</mark>';
               break;
            case '$ne':
               retval.selector[fieldId] = {};
               retval.selector[fieldId].$not = new RegExp(box1,'i');
               retval.text = '<mark>' + fieldName + '</mark> is not equal to <mark>' + applyFormat(box1) + '</mark>';
               break;
            case 'contains':
               retval.selector[fieldId] = new RegExp('*' + box1 + '*$','i');
               retval.text = '<mark>' + fieldName + '</mark> contains <mark>' + applyFormat(box1) + '</mark>';
               break;
            case 'startsWith':
               retval.selector[fieldId] = new RegExp(box1 + '*$','i');
               retval.text = '<mark>' + fieldName + '</mark> starts with <mark>' + applyFormat(box1) + '</mark>';
         }
         break;
      case 'Boolean':
         retval.selector[fieldId] = (selectorName==='true');
         if (selectorName==='true')
            retval.text = 'is <mark>' + fieldName + '</mark>';
         if (selectorName==='true')
            retval.text = 'is not <mark>' + fieldName + '</mark>';
   }

   return retval;
}

Template.inputBox.rendered = function(){
   this.$('.datepicker').datepicker();
};
