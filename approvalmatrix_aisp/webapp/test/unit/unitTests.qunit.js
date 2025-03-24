/* global QUnit */
// https://api.qunitjs.com/config/autostart/
QUnit.config.autostart = false;

sap.ui.require([
	"comapprovalmatrix/approvalmatrix_aisp/test/unit/AllTests"
], function (Controller) {
	"use strict";
	QUnit.start();
});