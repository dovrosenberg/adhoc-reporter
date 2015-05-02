createModal = function(collection, paths, cleanedSets, template) {
   var shareDialogInfo = {
       template: Template.selectPathBody,
       title: "How would you like to add " + collection + "?",
       modalBodyClass: "container col-xs-12",
       //modalBodyClass: "share-modal-body", //optional
       //modalFooterClass: "share-modal-footer",//optional
       removeOnHide: true, //optional. If this is true, modal will be removed from DOM upon hiding
       buttons: {
         btnClose: {
            class: 'btn-default',
            label: 'Close',
         },
         btnSave: {
             closeModalOnClick: false,
            class: 'btn-primary',
            label: 'Select'
         }
       },
       doc: {
         paths: _.map(paths, function(text, index) { var retval = {index: index, text: text}; if (index===0) retval.checked = true; return retval; })
       }
   };

   var dialog =  ReactiveModal.initDialog(shareDialogInfo);
   dialog.buttons.btnSave.on('click', function(button) {
      // find the selected path
      var selectedItem = parseInt($('input[name=pathRadios]:checked', '#pathForm').val());

      selectCleanedSet(cleanedSets[selectedItem]);
      finishLoadingData(template);

      dialog.hide();
    });

    return dialog;
 };
