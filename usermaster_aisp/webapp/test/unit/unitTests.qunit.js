/* global QUnit */
// https://api.qunitjs.com/config/autostart/
QUnit.config.autostart = false;

sap.ui.require([
	"comusermaster_aisp/usermaster_aisp/test/unit/AllTests"
], function (Controller) {
	"use strict";
	QUnit.start();
});