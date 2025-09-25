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
      "com.sconfig.systemconfiguration2aisp.controller.BuyerMail",
      {
        onInit() {
          let oODataModel = this.getOwnerComponent().getModel("global-mail");
          var oViewModel = new JSONModel({
            isEditing: false,
          });
          this.getView().setModel(oViewModel, "viewModel");
          var oBuyerModel = new JSONModel({
            EMAIL_EXCHANGE_SERVER: "N",
            MAIL_ID: "",
            POLL_INTERVAL: "",
            FILE_TYPES: "",
            FILE_SIZE_MB: "",
            MAIL_SUBJECT_PATTERN: "",
            CLIENT_ID: "",
            CLIENT_SECRET: "",
            TENANT_ID: "",
            HOST: "",
            APP_PASSWORD: "",
            DESCRIPTION: "",
          });
          this.getView().setModel(oBuyerModel, "BuyerModel");
          this._fetchGlobalMailConfig();
        },

        _fetchGlobalMailConfig: function () {
          var oODataModel = this.getOwnerComponent().getModel("global-mail");
          var that = this;
          oODataModel.read("/GlobalMailConfig", {
            success: function (oData) {
              var oConfig =
                oData.results && oData.results.length > 0
                  ? oData.results[0]
                  : {};
              // Map server name to key for ComboBox
              var sServerKey =
                oConfig.EMAIL_EXCHANGE_SERVER === "Microsoft Exchange Server"
                  ? "M"
                  : oConfig.EMAIL_EXCHANGE_SERVER === "Google Workspace"
                  ? "G"
                  : "N";
              that
                .getView()
                .getModel("BuyerModel")
                .setData({
                  EMAIL_EXCHANGE_SERVER: sServerKey,
                  MAIL_ID: oConfig.MAIL_ID || "",
                  POLL_INTERVAL: oConfig.POLL_INTERVAL
                    ? oConfig.POLL_INTERVAL.toString()
                    : "",
                  FILE_TYPES: oConfig.FILE_TYPES || "",
                  FILE_SIZE_MB: oConfig.FILE_SIZE_MB
                    ? oConfig.FILE_SIZE_MB.toString()
                    : "",
                  MAIL_SUBJECT_PATTERN: oConfig.MAIL_SUBJECT_PATTERN || "",
                  CLIENT_ID: oConfig.CLIENT_ID || "",
                  CLIENT_SECRET: oConfig.CLIENT_SECRET || "",
                  TENANT_ID: oConfig.TENANT_ID || "",
                  HOST: oConfig.HOST || "",
                  APP_PASSWORD: oConfig.APP_PASSWORD || "",
                  DESCRIPTION: oConfig.DESCRIPTION || "",
                });
              if (oData.results && oData.results.length > 0) {
                MessageToast.show("Email configuration loaded successfully");
              } else {
                MessageToast.show("No email configuration found");
              }
            },
            error: function (oError) {
              MessageToast.show(
                "Failed to load email configuration: " + oError.message
              );
            },
          });
        },

        onExchangeServerChange: function (oEvent) {
          var sSelectedKey = oEvent.getSource().getSelectedKey();
          var oBuyerModel = this.getView().getModel("BuyerModel");
          oBuyerModel.setProperty("/EMAIL_EXCHANGE_SERVER", sSelectedKey);
        },

        onFileTypesChange: function (oEvent) {
          var sSelectedKey = oEvent.getSource().getSelectedKey();
          var oBuyerModel = this.getView().getModel("BuyerModel");
          oBuyerModel.setProperty("/FILE_TYPES", sSelectedKey);
        },

        onEditPress: function () {
          var oViewModel = this.getView().getModel("viewModel");
          var bIsEditing = oViewModel.getProperty("/isEditing");
          oViewModel.setProperty("/isEditing", !bIsEditing);
          if (bIsEditing) {
            // If canceling edit, refresh data from backend
            this._fetchGlobalMailConfig();
          }
        },

        onCreatePress: function () {
          var oViewModel = this.getView().getModel("viewModel");
          var oBuyerModel = this.getView().getModel("BuyerModel");
          // Clear BuyerModel for new entry
          oBuyerModel.setData({
            EMAIL_EXCHANGE_SERVER: "N",
            MAIL_ID: "",
            POLL_INTERVAL: "",
            FILE_TYPES: "",
            FILE_SIZE_MB: "",
            MAIL_SUBJECT_PATTERN: "",
            CLIENT_ID: "",
            CLIENT_SECRET: "",
            TENANT_ID: "",
            HOST: "",
            APP_PASSWORD: "",
            DESCRIPTION: "",
          });
          // Enable editing mode
          oViewModel.setProperty("/isEditing", true);
        },

        onDeletePress: function () {
          var oODataModel = this.getOwnerComponent().getModel("global-mail");
          var oBuyerModel = this.getView().getModel("BuyerModel");
          var sMailId = oBuyerModel.getProperty("/MAIL_ID");

          if (!sMailId) {
            MessageBox.error("No configuration to delete.");
            return;
          }

          var that = this;
          MessageBox.confirm("Are you sure you want to delete the configuration?", {
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                oODataModel.remove("/GlobalMailConfig('" + sMailId + "')", {
                  success: function () {
                    MessageBox.success("Configuration deleted successfully.");
                    // Clear BuyerModel to show "No Data"
                    oBuyerModel.setData({
                      EMAIL_EXCHANGE_SERVER: "N",
                      MAIL_ID: "",
                      POLL_INTERVAL: "",
                      FILE_TYPES: "",
                      FILE_SIZE_MB: "",
                      MAIL_SUBJECT_PATTERN: "",
                      CLIENT_ID: "",
                      CLIENT_SECRET: "",
                      TENANT_ID: "",
                      HOST: "",
                      APP_PASSWORD: "",
                      DESCRIPTION: "",
                    });
                    that.getView().getModel("viewModel").setProperty("/isEditing", false);
                  },
                  error: function (oError) {
                    MessageBox.error("Error deleting configuration: " + oError.message);
                  },
                });
              }
            },
          });
        },

        onUpdateBuyerMConf: function () {
          var oODataModel = this.getOwnerComponent().getModel("global-mail");
          var oBuyerModel = this.getView().getModel("BuyerModel");

          // Get values from the form fields
          var oPayload = {
            MAIL_ID: this.byId("mailIdInput").getValue(),
            EMAIL_EXCHANGE_SERVER: this.byId("emailExchangeServerComboBox").getSelectedKey(),
            POLL_INTERVAL: this.byId("pollIntervalInput").getValue(),
            FILE_TYPES: this.byId("fileTypesComboBox").getSelectedKey(),
            FILE_SIZE_MB: this.byId("fileSizeInput").getValue(),
            MAIL_SUBJECT_PATTERN: this.byId("mailSubjectPatternInput").getValue(),
            DESCRIPTION: this.byId("descriptionInput").getValue(),
            CLIENT_ID: this.byId("clientIdInput").getValue(),
            CLIENT_SECRET: this.byId("clientSecretInput").getValue(),
            TENANT_ID: this.byId("tenantIdInput").getValue(),
            HOST: this.byId("hostInput").getValue(),
            APP_PASSWORD: this.byId("appPasswordInput").getValue(),
          };

          // Validate data before create/update
          if (
            !oPayload.MAIL_ID ||
            !oPayload.EMAIL_EXCHANGE_SERVER ||
            oPayload.EMAIL_EXCHANGE_SERVER === "N" ||
            !oPayload.POLL_INTERVAL ||
            !oPayload.FILE_TYPES ||
            !oPayload.FILE_SIZE_MB ||
            !oPayload.MAIL_SUBJECT_PATTERN ||
            !oPayload.DESCRIPTION
          ) {
            MessageBox.error("Please fill in all required fields.");
            return;
          }
          if (
            oPayload.EMAIL_EXCHANGE_SERVER === "M" &&
            (!oPayload.CLIENT_ID || !oPayload.CLIENT_SECRET || !oPayload.TENANT_ID)
          ) {
            MessageBox.error("Please fill all Microsoft Exchange fields.");
            return;
          }
          if (
            oPayload.EMAIL_EXCHANGE_SERVER === "G" &&
            (!oPayload.HOST || !oPayload.APP_PASSWORD)
          ) {
            MessageBox.error("Please fill all Google Workspace fields.");
            return;
          }

          // Set the full name for EMAIL_EXCHANGE_SERVER based on the selected key
          if (oPayload.EMAIL_EXCHANGE_SERVER === "M") {
            oPayload.EMAIL_EXCHANGE_SERVER = "Microsoft Exchange Server";
          } else if (oPayload.EMAIL_EXCHANGE_SERVER === "G") {
            oPayload.EMAIL_EXCHANGE_SERVER = "Google Workspace";
          }

          // Convert numeric fields
          oPayload.POLL_INTERVAL = parseInt(oPayload.POLL_INTERVAL, 10);
          oPayload.FILE_SIZE_MB = parseInt(oPayload.FILE_SIZE_MB, 10);

          // Check if creating new or updating existing
          var bIsNew = !oBuyerModel.getProperty("/MAIL_ID");
          var sPath = bIsNew
            ? "/GlobalMailConfig"
            : "/GlobalMailConfig('" + oPayload.MAIL_ID + "')";
          var sMethod = bIsNew ? "create" : "update";

          // Send create/update request to backend
          oODataModel[sMethod](sPath, oPayload, {
            success: function () {
              MessageBox.success(
                "Mailbox configuration " + (bIsNew ? "created" : "updated") + " successfully."
              );
              this.getView().getModel("viewModel").setProperty("/isEditing", false);
              // Update BuyerModel with the new data
              oBuyerModel.setData(oPayload);
              oODataModel.refresh();
            }.bind(this),
            error: function (oError) {
              MessageBox.error(
                "Error " + (bIsNew ? "creating" : "updating") + " configuration: " + oError.message
              );
            },
          });
        },

        onNavHome: function () {
          this.getOwnerComponent().getRouter().navTo("RouteSystemView");
        },

        openFragment: function () {
          console.log("openFragment");
          if (!this._createSupplierDialog) {
            Fragment.load({
              id: "createSuppConfigId",
              name: "com.sconfig.systemconfiguration2aisp.fragments.CreateSuppConfig",
              controller: this,
            }).then(
              function (oDialog) {
                this._createSupplierDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._createSupplierDialog.open();
          }
        },

        onCancelPress: function () {
          console.log("buttonpressed");
          this._createSupplierDialog.close();
        }
      }
    );
  }
);