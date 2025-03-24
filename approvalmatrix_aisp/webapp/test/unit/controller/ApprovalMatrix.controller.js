/*global QUnit*/

sap.ui.define([
	"comapprovalmatrix/approvalmatrix_aisp/controller/ApprovalMatrix.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ApprovalMatrix Controller");

	QUnit.test("I should test the ApprovalMatrix controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
