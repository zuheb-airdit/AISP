/*global QUnit*/

sap.ui.define([
	"comrequestmanagement/requestmanagement/controller/RequestManagement.controller"
], function (Controller) {
	"use strict";

	QUnit.module("RequestManagement Controller");

	QUnit.test("I should test the RequestManagement controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
