sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"

], (Controller, JSONModel, MessageBox) => {
    "use strict";

    return Controller.extend("com.sconfig.systemconfiguration2aisp.controller.SuppliercommConfig", {
        onInit() {
        },

        onEditPress: function (oEvent) {
            debugger;
            var oTable = this.byId("LineItemSmartTable").getTable();
            var oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                sap.m.MessageToast.show("Please select a supplier first.");
                return;
            }


            var oContext = oSelectedItem.getBindingContext();

            // Get the data of the selected row
            var oSupplierData = oContext.getObject();

            // Create JSON model for selected supplier
            var oSelectedSupplierModel = new sap.ui.model.json.JSONModel(oSupplierData);
            this.getView().setModel(oSelectedSupplierModel, "selectedSupplier");

            // Load the fragment if not already loaded
            if (!this._oEditDialog) {
                this._oEditDialog = sap.ui.xmlfragment(this.getView().getId(), "suppliercomconfig.Fragment.EditSupplier", this);
                this.getView().addDependent(this._oEditDialog);
            }

            // Open the dialog
            this._oEditDialog.open();
        },


        // onSaveDialog: function () {
        //     var oSupplierModel = this.getView().getModel("selectedSupplier");
        //     var oData = oSupplierModel.getData();

        //     // Construct payload for update
        //     var oPayload = {
        //         SAP_VENDOR_CODE: oData.SAP_VENDOR_CODE, // key
        //         INVOICE_EMAIL: oData.INVOICE_EMAIL      // new email
        //     };

        //     // OData model
        //     var oODataModel = this.getView().getModel();

        //     // Build the path using the key (SAP_VENDOR_CODE)
        //     var sPath = "/SUPPLIER_COMMUNICATION_CONFIG('" + oData.SAP_VENDOR_CODE + "')";

        //     oODataModel.update(sPath, oPayload, {
        //         success: function () {
        //             sap.m.MessageToast.show("Supplier updated successfully!");
        //         },
        //         error: function () {
        //             sap.m.MessageToast.show("Error updating supplier.");
        //         }
        //     });

        //     this._oEditDialog.close();
        // }

        onCancelDialog: function () {
            this._oEditDialog.close()
        },

        onSaveDialog: function () {
            debugger;
            let oSupplierModel = this.getView().getModel('selectedSupplier')
            var oData = oSupplierModel.getData()


            var SupplierInvoiceMailPayload = {
                SAP_VENDOR_CODE: oData.SAP_VENDOR_CODE,
                INVOICE_EMAIL: oData.INVOICE_EMAIL

            }

            var ODataModel = this.getView().getModel()

            var sPath = `/SUPPLIER_COMMUNICATION_CONFIG/${oData.SAP_VENDOR_CODE}`


            ODataModel.update(sPath, SupplierInvoiceMailPayload, {
                success: function () {
                    MessageBox.success("Supplier updated successfully!");
                    this.getView().byId('LineItemSmartTable').rebindTable()
                    
                }.bind(this),
                error: function () {
                    MessageBox.error("Error updating supplier.");
                }

            })

                   this._oEditDialog.close();

        } 

    });
});