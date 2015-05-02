# meteor-reporter

The beginnings of an ad hoc reporter package for meteor

## Features

* jstree control to view collections and fields
* Fields can be given user-friendly names
* Allows for specification of field types (currency, date, etc.) and application of custom formatting based on those field types
* Based on a defined schema, identifies all possible paths between collections and automatically joins tables correctly without user intervention
* DataTables for output supports sorting, paging, exporting to Excel/pdf/etc
* Advanced filtering options based on type of field, as well as ability to specify boolean logic

## Future features
* Drag and drop fields into and out of the report
* Prettify the package appearance generally (better loading screens, etc.)
* Allow grouping, formula fields
* Support subdocuments
* Add some tests for package maintenance

## Other things perhaps it should do (but not even on the roadmap yet)
* Make UI more template driven for better visual integration into Meteor apps
* Adapt UI for smaller screens (mobile)

## Known bugs
* Doesn't support removing fields from the report

## Getting Started

**To install:**

`meteor add dovrosenberg:ad-hoc-reporter`

You also need to have some version of bootstrap 3 installed, including modal.js and dropdown.js.

**To use:**

    {{> reporter <parameters>}}

Parameters:
* schemas (required): an object showing the collections and fields you want to include. The format of the object is:

        {
            'Books': {                  // the name of the Meteor collection object
               label: 'Books',          // the text to display the user when referring to the collection (ex. in the treeview)
               fields: {
                  title: {              // the field name
                      label: 'Title',   // the text label to display the user when referring to this field
                      format: 'Title text',  // optional, the name of format function (see below) to be applied
                      type: 'String'    // optional, used to ensure filtering/sorting works properly ('Number', 'Boolean', or 'Date'... anything else ignored and assumed to be String)
                  },
                  ...
               },
               foreignKeys: [           // an array of foreign key descriptors
                  {
                     localKey: 'authorID',   // the field in this collection that connect it to the other
                     to: 'Authors',          // the collection to which this is connected
                     foreignKey: '_id',      // the field in "to" on which to match
                     name: 'Author',         // a descriptor for this connection when viewing it from this side (i.e. "a Book has an Author")
                     reverseName: 'Books'    // a descriptor for this connection when viewing it from the other side (i.e. "an Author has one or more Books")
                   },
                  ...
               ]
            },
            ...
        }

   Note: you only need to include fields that you want to be reportable here.  You DO NOT need to include key fields unless you want the user to actually see the values of those fields.

   Note: foreign keys should only be described in one collection, as they are reversed by the package.  That is, you should not describe the relationship shown above under the "Authors" collection as well.  

   Note: version 0.3 specifies a different, incompatible schema format than prior versions
* formats (optional): an object describing any available custom formatting functions.  The format of the object (no pun intended) is:

        {
            'dollars':
               function (amount) {
            	   return accounting.formatNumber(amount,2);
               },
            'Title text':
               function (value) {
                  // add text before every item shown in the grid - probably
                  //    not a very useful example
            	   return 'The title is: ' + value;
               },
            ...
        }

* tableDOM (optional): a string to be passed to the dom property of the DataTable containing the results (see https://datatables.net/reference/option/dom for more information.)  And DataTables extensions (css and js) you require should be placed into your /client/compatibility directory.  And if you want to use the tabletools extension, you should also place the swf file in public/swf.


## License
Copyright (c) 2015 Dov Rosenberg

Licensed under the [MIT license][mit].
[mit]: http://www.opensource.org/licenses/mit-license.php
