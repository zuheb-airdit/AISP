sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "sap/m/MessageToast",
  ],
  (
    Controller,
    JSONModel,
    Fragment,
    MessageBox,
    Filter,
    FilterOperator,
    Sorter,
    Spreadsheet,
    library,
    MessageToast
  ) => {
    "use strict";

    return Controller.extend(
      "com.sconfig.systemconfiguration2aisp.controller.SupplierComm",
      {
        onInit() {
          this.getView().setModel(
            this.getOwnerComponent().getModel("supplier-configuration")
          );
        },

        openFragment: function () {
          console.log("openFragment");

          if (!this._createSupplierDialog) {
            // If not, load the fragment
            Fragment.load({
              id: "createSuppConfigId",
              name: "com.sconfig.systemconfiguration2aisp.fragments.CreateSuppConfig", // Adjust the path to your fragment file
              controller: this, // Pass the current controller as the fragment's controller
            }).then(
              function (oDialog) {
                // Store the dialog instance
                this._createSupplierDialog = oDialog;
                // Add the dialog to the view's dependent aggregation
                this.getView().addDependent(oDialog);
                // Open the dialog
                oDialog.open();
              }.bind(this)
            );
          } else {
            // If the dialog already exists, just open it
            this._createSupplierDialog.open();
          }
          // this.createFragSid=this.byId(createSuppConfigId,"supplierIdInput")
          // console.log(this.createFragSid)
        },

        onCancelPress: function () {
          console.log("buttonpressed");
          this._createSupplierDialog.close();
        },
        formValueHelp: function () {
          if (!this._supplierValueHelpDialog) {
            // Load the fragment that contains the TableSelectDialog
            Fragment.load({
              name: "com.sconfig.systemconfiguration2aisp.fragments.ValueHelp", // Path to the new fragment
              controller: this, // Pass the current controller
            }).then(
              function (oDialog) {
                this._supplierValueHelpDialog = oDialog;
                this.getView().addDependent(oDialog);

                // Open the dialog
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._supplierValueHelpDialog.open();
          }
        },
        onValueHelpConfirm: function (oEvent) {
          const sId = oEvent
            .getParameters()
            .selectedItem.mAggregations.cells[0].getText();
          const sName = oEvent
            .getParameters()
            .selectedItem.mAggregations.cells[1].getText();

          // Auto-populate the input fields
          Fragment.byId("createSuppConfigId", "supplierIdInput").setValue(sId);
          Fragment.byId("createSuppConfigId", "supplierNameInput").setValue(
            sName
          );

          // this._supplierValueHelpDialog.close();
        },

        onSubmitPress: async function (oEvent) {
          const oModel = this.getView().getModel();
         
          const radioButton = Fragment.byId(
            "createSuppConfigId",
            "activeRadio"
          );
          const iSelectedIndex = radioButton.getSelectedIndex();
          const isActive = iSelectedIndex === 0; // More concise way to set boolean

          const configData = {
            SupplierId: Fragment.byId(
              "createSuppConfigId",
              "supplierIdInput"
            ).getValue(),
            SupplierName: Fragment.byId(
              "createSuppConfigId",
              "supplierNameInput"
            ).getValue(),
            SupplierEmail: Fragment.byId(
              "createSuppConfigId",
              "supplierEmailInput"
            ).getValue(),
            CommunicationMode: Fragment.byId(
              "createSuppConfigId",
              "configurationModeMultiComboBox"
            ).getSelectedKey(),
            Active: isActive,
            Notes: Fragment.byId(
              "createSuppConfigId",
              "notesTextArea"
            ).getValue(),
          };

          console.log("Config Data to Submit:", configData);

          const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

          // Validation Checks
          if (!configData.SupplierId) {
            sap.m.MessageToast.show("Supplier ID is required.");
            return;
          }
          if (!configData.SupplierName) {
            sap.m.MessageToast.show("Supplier Name is required.");
            return;
          }
          if (!configData.SupplierEmail) {
            sap.m.MessageToast.show("Supplier Email is required.");
            return;
          }
          if (!emailRegex.test(configData.SupplierEmail)) {
            sap.m.MessageToast.show("Please enter a valid email address.");
            return;
          }
          if (!configData.CommunicationMode) {
            sap.m.MessageToast.show("Configuration Mode is required.");
            return;
          }

          try {
            oModel.create("/supplierConfigPostReq", configData, {
              success: function (oData, oResponse) {
                sap.m.MessageToast.show("Supplier created successfully.");
                console.log("Success:", oData, oResponse);
                oModel.refresh();

                // Ensure the dialog instance exists before attempting to close it
                if (this._createSupplierDialog) {
                  this._createSupplierDialog.close();
                  // Optionally, destroy the dialog if it's only used once
                  // this._createSupplierDialog.destroy();
                  // this._createSupplierDialog = null; // Reset the reference
                } else {
                  console.warn(
                    "Dialog reference _createSupplierDialog not found when trying to close."
                  );
                }
              }.bind(this),
              error: function (oError) {
                console.log(oError.statusCode)
                console.error("Error creating entity:", oError);
                sap.m.MessageToast.show(
                  "Error creating supplier. Please try again."
                );
                // Even on error, you might want to close the dialog if it's not needed anymore,
                // or keep it open for user to correct data. Decide based on UX.
                // if (this._createSupplierDialog) {
                //     this._createSupplierDialog.close();
                // }
              }.bind(this),
            });
          } catch (oError) {
            // This catch block handles synchronous errors *before* the OData call.
            sap.m.MessageToast.show("An unexpected error occurred.");
            console.error("Unexpected error during submission:", oError);
          }
        },
        selectionChangeHandler: function (oEvent) {
          const oTable = oEvent.getSource();
          const oSelectedItem = oTable.getSelectedItem();

          if (oSelectedItem) {
            // Get the data object from the binding context
            this._oSelectedSupplier = oSelectedItem
              .getBindingContext()
              .getObject();
            console.log("Selected supplier data:", this._oSelectedSupplier);
          } else {
            // Clear the stored data if the user deselects the row
            this._oSelectedSupplier = null;
            console.log("No row is selected.");
          }
        },
        // In your controller (e.g., View1.controller.js)

        deleteRecord: function (oEvent) {
          // Check if a row is selected
          if (!this._oSelectedSupplier) {
            sap.m.MessageToast.show("Please select a row to delete.");
            return;
          }

          // Get the key field from the stored data
          const sSupplierId = this._oSelectedSupplier.SupplierId;

          // Get the OData model
          const oModel = this.getView().getModel();

          // Construct the path for the record using the key field
          // The path structure is '/<EntitySet>(<KeyField>)'
          const sPath = oModel.createKey("/supplierConfigSave", {
            SupplierId: sSupplierId,
          });
          console.log(sPath);
          // Confirm the deletion with the user
          sap.m.MessageBox.confirm(
            "Are you sure you want to delete the supplier with ID: " +
              sSupplierId +
              "?",
            {
              title: "Confirm Deletion",
              onClose: function (oAction) {
                if (oAction === sap.m.MessageBox.Action.OK) {
                  // Call the OData remove method
                  oModel.remove(sPath, {
                    success: function () {
                      sap.m.MessageToast.show(
                        "Supplier " + sSupplierId + " deleted successfully."
                      );
                      // Refresh the table to reflect the change
                      oModel.refresh();
                    },
                    error: function (oError) {
                      sap.m.MessageBox.error(
                        "Error deleting record: " + oError.responseText
                      );
                    },
                  });
                }
              },
            }
          );
        },
        // In your controller (e.g., View1.controller.js)

        // In your controller file (e.g., View1.controller.js)

        editRecord: function (oEvent) {
          // Check if a row is selected
          if (!this._oSelectedSupplier) {
            sap.m.MessageToast.show("Please select a row to edit.");
            return;
          }

          // Get the path of the selected item from the table
          const oTable = this.byId("idApprovedInvoiceTable");
          const oSelectedItem = oTable.getSelectedItem();
          const sPath = oSelectedItem.getBindingContext().getPath();

          // Load the fragment and set its binding context
          if (!this._oEditDialog) {
            this._oEditDialog = sap.ui.xmlfragment(
              this.getView().getId(),
              "com.sconfig.systemconfiguration2aisp.fragments.EditFragment",
              this
            );
            this.getView().addDependent(this._oEditDialog);
          }

          // Set the binding context of the dialog to the selected row's path
          this._oEditDialog.bindElement({
            path: sPath,
          });

          // Open the fragment
          this._oEditDialog.open();
        },

        onSaveChanges: function () {
         
          const oSaveButton = sap.ui.core.Fragment.byId(
            this.getView().getId(),
            "editSaveButton"
          );
          if (oSaveButton) {
            oSaveButton.setEnabled(false);
          }

          
          const sSupplierId = this._oSelectedSupplier.SupplierId;

         
          const oModel = this.getView().getModel();

         
          const sPath = oModel.createKey("/supplierConfigSave", {
            SupplierId: sSupplierId,
          });

          
          const sSupplierEmail = this.getView().byId("sEmailId").getValue();
          const sCommunicationMode = this.getView()
            .byId("sCommModeId")
            .getSelectedKey();
          const sSupplierName = this.getView().byId("sNameId").getValue();
          const bActive = this.getView().byId("bActiveId").getSelected();

          // Construct the payload with the updated data
          const oUpdatedData = {
            SupplierEmail: sSupplierEmail,
            CommunicationMode: sCommunicationMode,
            SupplierName: sSupplierName,
            Active: bActive,
          };

          console.log("Updated data payload:", oUpdatedData);

          // Send a PUT request to update the record
          oModel.update(sPath, oUpdatedData, {
            success: function () {
              sap.m.MessageToast.show("Record updated successfully.");
              oModel.refresh();
              this._oEditDialog.close();

              // Re-enable the Save button after success (optional)
              if (oSaveButton) {
                oSaveButton.setEnabled(true);
              }
            }.bind(this),
            error: function (oError) {
              sap.m.MessageBox.error(
                "Error updating record: " + oError.responseText
              );

              // Re-enable the Save button after error
              if (oSaveButton) {
                oSaveButton.setEnabled(true);
              }
            },
          });
        },

        onCancel: function () {
          this._oEditDialog.close();
        },

        onNavHome: function () {
          this.getOwnerComponent().getRouter().navTo("RouteSystemView");
        },
      }
    );
  }
);
