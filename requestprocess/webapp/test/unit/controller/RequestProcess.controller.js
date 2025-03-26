/*global QUnit*/

sap.ui.define([
	"com/requestapproval/requestprocess/controller/RequestProcess.controller"
], function (Controller) {
	"use strict";

	QUnit.module("RequestProcess Controller");

	QUnit.test("I should test the RequestProcess controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
