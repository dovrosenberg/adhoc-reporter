Template.resultsCollapsible_panel.events({ 
	'click .panel-heading span.clickable': function (event) {
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
