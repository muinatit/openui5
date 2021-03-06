sap.ui.define(['sap/ui/core/UIComponent'],
	function(UIComponent) {
	"use strict";

	var Component = UIComponent.extend("sap.m.sample.Carousel.Component", {

		metadata : {
			rootView : {
				"viewName": "sap.m.sample.Carousel.Carousel",
				"type": "XML",
				"async": true
			},
			dependencies : {
				libs : [
					"sap.m",
					"sap.ui.layout"
				]
			},
			config : {
				sample : {
					stretch : true,
					files : [
						"Carousel.view.xml",
						"Carousel.controller.js"
					]
				}
			}
		}
	});

	return Component;

});
