/*global QUnit*/

sap.ui.define([
	"com/systemconfiguration/systemconfigurationaisp/controller/SystemConfiguration.controller"
], function (Controller) {
	"use strict";

	QUnit.module("SystemConfiguration Controller");

	QUnit.test("I should test the SystemConfiguration controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
