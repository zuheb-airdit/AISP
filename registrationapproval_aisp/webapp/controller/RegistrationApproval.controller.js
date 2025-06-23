sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/format/DateFormat"

], (Controller,DateFormat) => {
    "use strict";

    return Controller.extend("com.registration.registrationapprovalaisp.controller.RegistrationApproval", {
        onInit: function () {
            let oModel = this.getOwnerComponent().getModel("request-process");
            this.getView().setModel(oModel);
            // this.getOwnerComponent().getRouter().getRoute("RegisterApproval").attachPatternMatched(this.onObjectMatchedS, this);
            const customizeConfig = {
                autoColumnWidth: {
                    '*': { min: 2, max: 7, gap: 1, truncateLabel: false },
                    'REQUEST_NO': { min: 2, max: 2, gap: 1, truncateLabel: false },
                    'VENDOR_NAME1': { min: 2, max: 7, gap: 1, truncateLabel: false },
                    'REGISTERED_ID': { min: 2, max: 10, gap: 1, truncateLabel: false },
                    'SUPPL_TYPE': { min: 2, max: 6, gap: 1, truncateLabel: false },
                    "SUPPL_TYPE_DESC": { min: 2, max: 6, gap: 1, truncateLabel: false },
                    'STATUS': { min: 2, max: 8, gap: 1, truncateLabel: false },
                    "BP_TYPE_CODE": { min: 2, max: 6, gap: 1, truncateLabel: false }
                }
            };
            this.oSmartTable = this.getView().byId('idSmartTableApprovalRegister');
        },

        onObjectMatchedS: function () {
            console.log("test")
            this.byId("idSmartTableApprovalRegister").rebindTable();
        },

        selectionChangeHandlerRregister: function (oEvent) {
            debugger;
            var oSelectedItem = oEvent.getParameter("listItem") || oEvent.getSource();
            var oContext = oSelectedItem.getBindingContext();
            var sObjectId = oContext.getProperty("REQUEST_NO");
            var navPath = sap.ui.getCore().byId(oEvent.getParameter('id')).getBindingContext();
            this.getOwnerComponent().getRouter().navTo('DetailedViewProjects', { id: navPath.getPath().split("'")[1] });
        },

        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        handleProcessTable_RowClick: function (oEvent) {
            debugger;
            let url = oEvent.getSource().getBindingContext().getObject().REQUEST_NO;
            this.getOwnerComponent().getRouter().navTo("RegisterObjPage", { id: url });
        },
        
        onSearchRequestNoChange: function (oEvent) {
            debugger;
            var oTable = this.byId("idTest");
            var oBinding = oTable.getBinding("items");
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
            var aFilters = [];
            if (sQuery) {
                aFilters.push(new Filter("REQUEST_NO", FilterOperator.Contains, sQuery));
            }
            oBinding.filter(aFilters);
        },

        onRebindSmartTableRegister: function (oEvent) {
            debugger;
            var filterStatus4 = new sap.ui.model.Filter("STATUS", sap.ui.model.FilterOperator.EQ, "4");
            var filterStatus5 = new sap.ui.model.Filter("STATUS", sap.ui.model.FilterOperator.EQ, "5");
            var combinedFilter = new sap.ui.model.Filter({
                filters: [filterStatus4, filterStatus5],
                and: false
            });
            debugger
            oEvent.getParameter("bindingParams").filters.push(combinedFilter);
        },

        statusFormatter: function (status, role) {
            console.log(status)
            if (role == "ADMIN") {
                role = "ADM"
            }
            switch (status) {
                case 15:
                    return `In RegApproval-${role}`
                case 2:
                    return `In RegApproval-${role}`

                case 3:
                    return `In RegApproval-${role}`
                case 4:
                    return `In RegApproval-${role}`
                default:
                    return "Registration Completed"
            }
        },

        formatRequestInfo: function (sValue, reqType) {
            if (!sValue) {
                return "";
            }
            var oNumberFormat = NumberFormat.getIntegerInstance({
                groupingEnabled: false
            });
            let num = oNumberFormat.format(sValue);
            var sFormattedText = "<span style='color:red'>" + num + "</span> <span style='color:black'>" + reqType + "</span>";
            return sFormattedText
        },

        onSearchRequestNoChange: function (oEvent) {
            debugger;
            var oTable = this.byId("idTest");
            var oBinding = oTable.getBinding("items");
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
            var aFilters = [];
            if (sQuery) {
                aFilters.push(new Filter("REQUEST_NO", FilterOperator.Contains, sQuery));
            }
            oBinding.filter(aFilters);
        },

        createdOnAndByFormatter: function (createdOn) {
            if (!createdOn) {
                return "";
            }
            var oDateFormat = DateFormat.getDateInstance({
                pattern: "dd-MM-yyyy"
            });
            var formattedDate = oDateFormat.format(new Date(createdOn));
            return formattedDate;
        },
    });
});