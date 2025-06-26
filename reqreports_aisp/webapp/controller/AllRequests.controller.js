sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/format/DateFormat"

], (Controller,DateFormat) => {
    "use strict";

    return Controller.extend("com.reqreportsaisp.reqreportsaisp.controller.AllRequests", {
        onInit() {
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
        handleProcessTable_RowClick: function (oEvent) {
            debugger;
            let url = oEvent.getSource().getBindingContext().getObject().REQUEST_NO;
            this.getOwnerComponent().getRouter().navTo("ReportObj", { id: url });
        },
    });
});