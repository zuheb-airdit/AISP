/*global QUnit*/

sap.ui.define([
	"comusermaster_aisp/usermaster_aisp/controller/Usermaster.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Usermaster Controller");

	QUnit.test("I should test the Usermaster controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
