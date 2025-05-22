sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/StandardListItem",
    "sap/m/Popover",
    "sap/m/List",
    "sap/ui/core/format/DateFormat"
], (Controller, MessageBox, Fragment, StandardListItem, Popover, List, DateFormat) => {
    "use strict";

    return Controller.extend("com.requestapproval.requestprocess.controller.RequestProcess", {
        onInit: function () {
            let oModel = this.getOwnerComponent().getModel("request-process");
            this.getView().setModel(oModel);
            const customizeConfig = {
                autoColumnWidth: {
                    'COMPANY_CODE': { min: 2, max: 4, gap: 1, truncateLabel: false },
                    'REGISTERED_ID': { min: 5, max: 12, gap: 1, truncateLabel: false },
                }
            };
            this.oSmartTable = this.getView().byId('idSmartTableApproval');
            this.oSmartTable.setCustomizeConfig(customizeConfig);
        },

        onBeforeBindTableReqApproval: function (oEvent) {
            debugger;
            let oBindingParams = oEvent.getParameter("bindingParams");
            var oFilter1 = new sap.ui.model.Filter("STATUS", "EQ", "15")
            var oFilter2 = new sap.ui.model.Filter("STATUS", "EQ", 2);
            var oFilter = new sap.ui.model.Filter({
                filters: [oFilter1, oFilter2],
                and: false // Use 'and: false' for OR condition
            });
            oBindingParams.filters.push(oFilter);
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



        onRequestApproval: function (oEvent) {
            this._sActionType = "APPROVE";
            this._sRequestNo = oEvent.getSource().getBindingContext().getObject().REQUEST_NO;
            this._openActionCommentDialog();
        },

        onRequestReject: function (oEvent) {
            this._sActionType = "REJECT";
            this._sRequestNo = oEvent.getSource().getBindingContext().getObject().REQUEST_NO;
            this._openActionCommentDialog();
        },

        _openActionCommentDialog: function () {
            if (!this._pActionCommentDialog) {
                this._pActionCommentDialog = Fragment.load({
                    name: "com.requestapproval.requestprocess.fragments.ActionComment", // update this to your fragment path
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this._pActionCommentDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onCommentSubmit: function () {
            const oDialog = sap.ui.getCore().byId("actionCommentDialog");
            const sComment = sap.ui.getCore().byId("commentInput").getValue();

            if (!sComment) {
                MessageBox.warning("Please enter a comment.");
                return;
            }
            const oDataModel = this.getView().getModel();
            const oPayload = {
                action: this._sActionType,
                inputData: [
                    {
                        REQUEST_NO: this._sRequestNo
                    }
                ]
            };

            if (this._sActionType === "APPROVE") {
                oPayload.inputData[0].APPROVED_COMMENT = sComment;
            } else {
                oPayload.inputData[0].REJECTED_COMMENT = sComment;
            }

            this.getView().setBusy(true);
            oDataModel.create("/RequestProcess", oPayload, {
                success: function (res) {
                    this.getView().setBusy(false);
                    MessageBox.success(res.RequestProcess);
                    this.byId("idSmartTableApproval").rebindTable();
                    oDialog.close();
                }.bind(this),
                error: function (err) {
                    this.getView().setBusy(false);
                    MessageBox.error("Something went wrong");
                    oDialog.close();
                }.bind(this)
            });
        },

        onCommentCancel: function () {
            const oDialog = sap.ui.getCore().byId("actionCommentDialog");
            oDialog.close();
        },



        statusFormatter: function (status, role) {
            if (!role) {
                return "Vendor Invited";
            }

            switch (status) {
                case 15:
                    return `In Req Appr-${role}`
                case 2:
                    return `In Req Appr-${role}`

                case 3:
                    return `In Req Appr-${role}`
                case 4:
                    return `In Progress-${role}`
                default:
                    return "OnProcess"
            }
        },

        statusColorFormatter: function (status) {
            switch (status) {
                case 15:
                    return "Indication15"
                case 2:
                    return "Indication15"

                case 3:
                    return "Indication15"
                case 4:
                    return "Indication15"
                default:
                    return "None"
            }
        },
        // onRequestApproval: function (oEvent) {
        //     debugger;
        //     const oRow = oEvent.getSource().getParent().getParent();
        //     const oContext = oRow.getBindingContext();
        //     const sRequestNo = oContext.getProperty("REQUEST_NO");

        //     // Show confirmation dialog
        //     MessageBox.confirm("Are you sure you want to approve this request?", {
        //         title: "Confirm Approval",
        //         onClose: function (sAction) {
        //             if (sAction === MessageBox.Action.OK) {
        //                 // Prepare the payload for approval
        //                 const oPayload = {
        //                     action: "APPROVE",
        //                     inputData: [
        //                         {
        //                             REQUEST_NO: sRequestNo
        //                         }
        //                     ]
        //                 };

        //                 // Get the OData model
        //                 const oModel = this.getView().getModel(); // Default model

        //                 // Send the payload using model.create
        //                 oModel.create("/RequestProcess", oPayload, {
        //                     success: function (oData, oResponse) {
        //                         MessageBox.success("Request Approved Successfully");
        //                         // Refresh the table to reflect the updated status
        //                         const oTable = this.byId("idSmartTableApproval");
        //                         oTable.getTable().getBinding("items").refresh();
        //                     }.bind(this),
        //                     error: function (oError) {
        //                         let sErrorMessage = "An error occurred while approving the request.";
        //                         if (oError.responseText) {
        //                             try {
        //                                 const oErrorResponse = JSON.parse(oError.responseText);
        //                                 sErrorMessage = oErrorResponse.error?.message || sErrorMessage;
        //                             } catch (e) {
        //                                 sErrorMessage = oError.responseText;
        //                             }
        //                         }
        //                         MessageBox.error(sErrorMessage);
        //                     }.bind(this)
        //                 });
        //             }
        //         }.bind(this)
        //     });
        // },

        // onRequestReject: function (oEvent) {
        //     debugger;
        //     const oRow = oEvent.getSource().getParent().getParent();
        //     const oContext = oRow.getBindingContext();
        //     const sRequestNo = oContext.getProperty("REQUEST_NO");

        //     // Show confirmation dialog
        //     MessageBox.confirm("Are you sure you want to reject this request?", {
        //         title: "Confirm Rejection",
        //         onClose: function (sAction) {
        //             if (sAction === MessageBox.Action.OK) {
        //                 // Prepare the payload for rejection
        //                 const oPayload = {
        //                     action: "REJECT",
        //                     inputData: [
        //                         {
        //                             REQUEST_NO: sRequestNo
        //                         }
        //                     ]
        //                 };

        //                 // Get the OData model
        //                 const oModel = this.getView().getModel(); // Default model

        //                 // Send the payload using model.create
        //                 oModel.create("/RequestProcess", oPayload, {
        //                     success: function (oData, oResponse) {
        //                         MessageBox.success("Request Rejected Successfully");
        //                         // Refresh the table to reflect the updated status
        //                         const oTable = this.byId("idSmartTableApproval");
        //                         oTable.getTable().getBinding("items").refresh();
        //                     }.bind(this),
        //                     error: function (oError) {
        //                         let sErrorMessage = "An error occurred while rejecting the request.";
        //                         if (oError.responseText) {
        //                             try {
        //                                 const oErrorResponse = JSON.parse(oError.responseText);
        //                                 sErrorMessage = oErrorResponse.error?.message || sErrorMessage;
        //                             } catch (e) {
        //                                 sErrorMessage = oError.responseText;
        //                             }
        //                         }
        //                         MessageBox.error(sErrorMessage);
        //                     }.bind(this)
        //                 });
        //             }
        //         }.bind(this)
        //     });
        // }
    });
});