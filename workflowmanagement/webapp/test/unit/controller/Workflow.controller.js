/*global QUnit*/

sap.ui.define([
	"com/demo/workflowmanagement/controller/Workflow.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Workflow Controller");

	QUnit.test("I should test the Workflow controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
