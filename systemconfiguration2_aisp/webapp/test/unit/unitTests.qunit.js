/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/sconfig/systemconfiguration2aisp/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
