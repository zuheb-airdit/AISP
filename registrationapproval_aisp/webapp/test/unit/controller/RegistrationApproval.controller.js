/*global QUnit*/

sap.ui.define([
	"com/registration/registrationapprovalaisp/controller/RegistrationApproval.controller"
], function (Controller) {
	"use strict";

	QUnit.module("RegistrationApproval Controller");

	QUnit.test("I should test the RegistrationApproval controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
