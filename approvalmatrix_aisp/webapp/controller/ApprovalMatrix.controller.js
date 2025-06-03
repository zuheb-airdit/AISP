
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], (Controller, MessageBox) => {
    "use strict";

    return Controller.extend("com.approvalmatrix.approvalmatrixaisp.controller.ApprovalMatrix", {
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("RouteApprovalMatrix").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            this.getOwnerComponent().getModel("appView").setProperty("/layout", "OneColumn");
            var oSmartTable = this.getView().byId("approvalMatrixTable");
            oSmartTable.rebindTable();
            let oModel = this.getOwnerComponent().getModel("hierarchydata");
            oModel.setData({ jsonObjects: [] })
        },

        onColumnListItemPress: function (oEvent) {
            debugger;
            let companyCode = oEvent.getSource().getBindingContext().getObject().COMPANY_CODE;
            let apprType = oEvent.getSource().getBindingContext().getObject().APPR_TYPE;
            this.getOwnerComponent().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getOwnerComponent().getRouter().navTo("RouteHierarchyid", {
                id: companyCode,
                appType: apprType,
            });
        },

        onCreateUser: function () {
            this.getOwnerComponent().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getOwnerComponent().getRouter().navTo("RouteHierarchu");
        },

        selectionChange: function () {
            debugger;
            this.byId("idDeleteApprovalMatrix").setEnabled(true)
        },

        onDeleteApprovalMatrix: function () {
            var that = this;
            var oModel = this.getView().getModel();
            var oTable = this.getView().byId('idApprovalTable');
            var aSelectedItems = oTable.getSelectedItems();
            var oSmartTable = this.getView().byId("approvalMatrixTable");
            if (aSelectedItems.length === 0) {
                MessageBox.warning("Please select a company code to delete.");
                return;
            }
            var oSelectedContext = aSelectedItems[0].getBindingContext();
            var oSelectedData = oSelectedContext.getObject();
            var oPayload = {
                "APPR_TYPE": oSelectedData.APPR_TYPE,
                "COMPANY_CODE": oSelectedData.COMPANY_CODE
            };
            MessageBox.confirm(`Are you sure you want to delete company code ${oPayload.COMPANY_CODE} and all related approvals?`, {
                icon: MessageBox.Icon.WARNING,
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.YES,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        that.getView().setBusy(true);
                        oModel.callFunction("/DeleteCompanyCodeType", {
                            method: "POST",
                            urlParameters: oPayload,
                            success: function () {
                                that.getView().setBusy(false);
                                MessageBox.success(`Company Code ${oPayload.COMPANY_CODE} and all related approvals deleted successfully!`);
                                oTable.removeSelections();
                                oSmartTable.rebindTable();
                                that.getView().byId('idSmartTablAppr').rebindTable();
                            },
                            error: function (oError) {
                                that.getView().setBusy(false);
                                MessageBox.error("Failed to delete company code and approvals: " + oError.message);
                            }
                        });
                    }
                }
            });
        },




    });
});