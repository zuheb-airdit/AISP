/*global QUnit*/

sap.ui.define([
	"com/sconfig/systemconfiguration2aisp/controller/SystemView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("SystemView Controller");

	QUnit.test("I should test the SystemView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
