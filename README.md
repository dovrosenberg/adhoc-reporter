# meteor-reporter

The beginnings of an ad hoc reporter package for meteor

## Features

* jstree control to view collections and fields
* Fields can be given user-friendly names
* Based on a defined schema, identifies all possible paths between collections and automatically joins tables correctly without user intervention
* DataTables for output supports sorting, paging, exporting to Excel/pdf/etc

## Future features (in progress)
* Allow specification of field types (currency, date, etc.) and apply custom formatting to output based on those field types
* Allow filtering, grouping, formula fields
* Support subdocuments
* More to come once those are done

## Known bugs
* Doesn't actually work yet :)  There's a (believed to be minor) bug in joining >2 tables that is currently being investigated.
* Doesn't support adding tables that can be added to the join in more than one place

## Getting Started

To install:

      meteor add dovrosenberg:addhoc-reporter

To use:

    {{> reporter <options>}}

Parameters:
* collections (required): an array of the the collections you want to include as options to report on.  The format of each collection is:

      {
           name: 'Books',       // should be the name of the Meteor collection object
           label: 'Books'       // the text to display the user when referring to the collection
        }
* schemas (required): an array showing the fields you want to include; this array must match collections in size and order, i.e. schemas[0] contains the fields that go with collections[0].  The format of each schema is:

      {
         title: {                 // the field name
            label: 'Title'        // the text label to display the user when referring to this field
         },
         ...
      }

   Note that you only need to include fields that you want to be reportable here.  You DO NOT need to include key fields unless you want the user to actually see the values of those fields.
* foreignKeys (required, if there are any connections between collections): an object describing the ways in which collections are connected.  Has the format:

       {
         'Books': [           // Meteor collection name (matches value in collections)
            {
               localKey: 'authorID',   // the field in this collection that connect it to the other
               to: 'Authors',          // the collection to which this is connected
               foreignKey: '_id',      // the field in "to" on which to match
               name: 'Author',         // a descriptor for this connection when viewing it from this side (i.e. "a Book has an Author")
               reverseName: 'Books'    // a descriptor for this connection when viewing it from the other side (i.e. "an Author has one or more Books")
            },
            ...
         ]
      }

   Note: keys need only be described in one collection, as they are reversed by the package.  That is, you would not need to describe the relationship shown above under the "Authors" collection as well.  
* tableDOM: a string to be passed to the dom property of the DataTable containing the results (see https://datatables.net/reference/option/dom for more information.)  And DataTables extensions (css and js) you require should be placed into your /client/compatibility directory.
* glyphicons (not required, but defaults to Font Awesome): if true, uses Glyphicons for the collapsible panel icons; if false, uses Font Awesome

You also need to have some version bootstrap 3 installed.  And Font Awesome or Glyphicons (for glyphicon-chevron-down/fa-chevron-down and  glyphicon-chevron-up/fa-chevron-up)


## License
Copyright (c) 2015 Dov Rosenberg

Licensed under the [MIT license][mit].
[mit]: http://www.opensource.org/licenses/mit-license.php
