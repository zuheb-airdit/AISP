/*global QUnit*/

sap.ui.define([
	"com/reqreportsaisp/reqreportsaisp/controller/AllRequests.controller"
], function (Controller) {
	"use strict";

	QUnit.module("AllRequests Controller");

	QUnit.test("I should test the AllRequests controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
