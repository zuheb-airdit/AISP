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
      "com.sconfig.systemconfiguration2aisp.controller.RFQConfiguration",
      {
        onInit() {
          this.getVendorAccountGroupData();
        },

        onCreatePress: function () {
          // Switch to splitter view with 30% table width and 70% content width
          this.byId("idSplitteraa").setSize("70%");
          var oModel = this.getView().getModel("rfqModel");
          oModel.setProperty("/isEditMode", false);
          oModel.setProperty("/isInputVisible", false);
          oModel.setProperty("/isSecondPaneVisible", true);
          oModel.setProperty("/isQuestionnaireFormVisible", false);
          oModel.setProperty("/isAttachmentFormVisible", false);
          oModel.setProperty("/newVendorGroup", {
            CODE: "",
            DESCRIPTION: "",
            questionnaires: [],
            attachments: [],
          });
          oModel.setProperty("/contentWidth", "100%");
        },

        onVendorAccountClick: function (oEvent) {
          // Fetch data for selected Vendor Account Group
          var oJsonModel = this.getView().getModel("rfqModel");
          var oODataModel = this.getView().getModel();
          var sCode = oEvent
            .getSource()
            .getBindingContext("rfqModel")
            .getProperty("CODE");
          var sPath = "/VENDOR_ACCOUNT_GROUP";
          var aFilters = [new Filter("CODE", FilterOperator.EQ, sCode)];

          oODataModel.read(sPath, {
            filters: aFilters,
            success: function (oData) {
              var oVendorData = oData.results[0];
              // Map data to form structure
              var aQuestionnaires = (
                oVendorData.questionnaires?.results || []
              ).map((q, index) => ({
                slNo: index + 1,
                question: q.QUESTION_TEXT,
                QUESTION_ID: q.QUESTION_ID,
                QUESTION_TYPE: q.QUESTION_TYPE,
                ALLOTTED_POINTS: q.ALLOTTED_POINTS,
                IS_MANDATORY: q.IS_MANDATORY,
                DROPDOWN_OPTIONS: q.DROPDOWN_OPTIONS.results,
                SECTION: q.SECTION,
                ORDER: q.ORDER,
                IS_ACTIVE: q.IS_ACTIVE,
                isExisting: true,
              }));
              var aAttachments = (oVendorData.attachments?.results || []).map(
                (a, index) => ({
                  slNo: index + 1,
                  docName: a.FILE_NAME,
                  docDescription: a.DESCRIPTION,
                  DOCUMENT_ID: a.DOCUMENT_ID,
                  isExisting: true,
                })
              );
              oJsonModel.setProperty("/newVendorGroup", {
                CODE: oVendorData.CODE,
                DESCRIPTION: oVendorData.DESCRIPTION,
                questionnaires: aQuestionnaires,
                attachments: aAttachments,
              });
              oJsonModel.setProperty("/isEditMode", true);
              // oJsonModel.setProperty("/isInputVisible", false);
              oJsonModel.setProperty("/isSecondPaneVisible", true);
              oJsonModel.setProperty("/isQuestionnaireFormVisible", false);
              oJsonModel.setProperty("/isAttachmentFormVisible", false);
              // this.byId("idSplitteraa").setSize("70%");
            }.bind(this),
            error: function (oError) {
              MessageToast.show(
                "Error loading data: " + (oError.message || "Unknown error")
              );
            },
          });
        },

        formatFormTitle: function (bIsEditMode) {
          return bIsEditMode
            ? "Edit Vendor Account Group"
            : "Create New Vendor Account Group";
        },

        disableCodeInEditMode: function (bIsEditMode) {
          return !bIsEditMode;
        },

        onEditPressrfq: function () {
          var oModel = this.getView().getModel("rfqModel");
          let eBtn = this.byId("idEditBtnrfq");
          let presnt = oModel.getProperty("/isInputVisible");
          if (presnt) {
            oModel.setProperty("/isInputVisible", false);
            eBtn.setText("Cancel");
          } else {
            oModel.setProperty("/isInputVisible", true);
            eBtn.setText("Edit");
          }
        },

        _resetSplitter: function () {
          var oModel = this.getView().getModel("rfqModel");
          let eBtn = this.byId("idEditBtnrfq");
          // this.byId("idSplitteraa").setSize("0%");
          oModel.setProperty("/isEditMode", false);
          oModel.setProperty("/isInputVisible", true);
          oModel.setProperty("/isSecondPaneVisible", false);
          oModel.setProperty("/isQuestionnaireFormVisible", false);
          oModel.setProperty("/isAttachmentFormVisible", false);
          eBtn.setText("Edit");
          oModel.setProperty("/newVendorGroup", {
            CODE: "",
            DESCRIPTION: "",
            questionnaires: [],
            attachments: [],
          });
        },

        getVendorAccountGroupData: function () {
          this.getView().setBusy(true)
          let oModel = this.getOwnerComponent().getModel();
          oModel.read("/VENDOR_ACCOUNT_GROUP", {
            success: function (res) {
              debugger;
              let data = {
                results: res.results,
                isEditMode: false,
                isInputVisible: true,
                isSecondPaneVisible: false,
                isQuestionnaireFormVisible: false,
                isAttachmentFormVisible: false,
                contentWidth: "0%",
                newAttachment: {
                  docName: "",
                  docDescription: "",
                },
                newVendorGroup: {
                  CODE: "",
                  DESCRIPTION: "",
                  questionnaires: [],
                  attachments: [],
                },
              };
              let jModel = new JSONModel(data);
              this.getView().setModel(jModel, "rfqModel");
                        this.getView().setBusy(false)
            }.bind(this),
            error: function (err) {
              debugger;
                        this.getView().setBusy(false)
              MessageBox.error("Something went wrong");
            },
          });
        },

        onColumnListItemAttachmentPress: function (oEvent) {
          var oModel = this.getView().getModel("rfqModel");
          let uBtn = this.byId("idUpdateAttachmentButton");
          let sBtn = this.byId("idAddattachmentButton");
          uBtn.setVisible(true);
          sBtn.setVisible(false);
          var sPath = oEvent
            .getSource()
            .getBindingContext("rfqModel")
            .getPath();
          var iIndex = parseInt(sPath.split("/").pop());
          var oSelected = oModel.getProperty(sPath);
          oModel.setProperty(
            "/newAttachment",
            JSON.parse(JSON.stringify(oSelected))
          ); // Deep copy
          oModel.setProperty("/isQuestionnaireFormVisible", false);
          oModel.setProperty("/isAttachmentFormVisible", true);
          oModel.setProperty("/isAddAttachment", false);
          oModel.setProperty("/isEditAttachment", false);
          oModel.setProperty("/selectedAttachmentIndex", iIndex);
          oModel.setProperty("/contentWidth", "100%");
        },

        onAddQuestionnairePress: function () {
          debugger;
          var oModel = this.getView().getModel("rfqModel");
          let uBtn = this.byId("idUpdateButton");
          let sBtn = this.byId("idSaveButton");
          uBtn.setVisible(false);
          sBtn.setVisible(true);
          oModel.setProperty("/isQuestionnaireFormVisible", true);
          oModel.setProperty("/isAttachmentFormVisible", false);
          oModel.setProperty("/newQuestionnaire", {
            question: "",
            QUESTION_TYPE: "",
            ALLOTTED_POINTS: 0,
            IS_MANDATORY: true,
            SECTION: "General Info",
            DROPDOWN_OPTIONS: [],
            IS_ACTIVE: true,
            isExisting: false,
          });
          oModel.setProperty("/contentWidth", "100%"); // Adjust middle pane size
        },

        onCancelQuestionnairePress: function () {
          var oModel = this.getView().getModel("rfqModel");
          oModel.setProperty("/isQuestionnaireFormVisible", false);
          // oModel.setProperty("/newQuestionnaire", {
          //     question: "",
          //     QUESTION_TYPE: "Radio",
          //     ALLOTTED_POINTS: 0,
          //     IS_MANDATORY: true,
          //     SECTION: "General Info",
          //     DROPDOWN_OPTIONS: [],
          //     IS_ACTIVE: true
          // });
          oModel.setProperty("/contentWidth", "100%");
        },

        onAddNewDropdownOption: function (oEvent) {
          var oModel = this.getView().getModel("rfqModel");
          var aOptions =
            oModel.getProperty("/newQuestionnaire/DROPDOWN_OPTIONS") || [];
          aOptions.push({
            VALUE: "",
            POINTS: 0,
          });
          oModel.setProperty("/newQuestionnaire/DROPDOWN_OPTIONS", aOptions);
        },

        onSaveAttachmentPress: function () {
          var oModel = this.getView().getModel("rfqModel");
          var oNewAttachment = oModel.getProperty("/newAttachment");
          var aAttachments = oModel.getProperty("/newVendorGroup/attachments");
          aAttachments.push({
            slNo: aAttachments.length + 1,
            docName: oNewAttachment.docName,
            docDescription: oNewAttachment.docDescription,
            isExisting: false,
          });
          oModel.setProperty("/newVendorGroup/attachments", aAttachments);
          oModel.setProperty("/isAttachmentFormVisible", false);
          oModel.setProperty("/newAttachment", {
            docName: "",
            docDescription: "",
          });
          oModel.setProperty("/contentWidth", "70%");
          MessageToast.show("Attachment added");
        },

        onSaveQuestionnairePress: function () {
          debugger;
          var oModel = this.getView().getModel("rfqModel");
          var oNewQuestionnaire = oModel.getProperty("/newQuestionnaire");
          var aQuestionnaires = oModel.getProperty(
            "/newVendorGroup/questionnaires"
          );
          aQuestionnaires.push({
            slNo: aQuestionnaires.length + 1,
            question: oNewQuestionnaire.question,
            QUESTION_ID: "Q" + (aQuestionnaires.length + 1),
            QUESTION_TYPE: oNewQuestionnaire.QUESTION_TYPE,
            ALLOTTED_POINTS: oNewQuestionnaire.ALLOTTED_POINTS,
            IS_MANDATORY: oNewQuestionnaire.IS_MANDATORY,
            SECTION: oNewQuestionnaire.SECTION,
            DROPDOWN_OPTIONS: oNewQuestionnaire.DROPDOWN_OPTIONS,
            ORDER: aQuestionnaires.length + 1,
            IS_ACTIVE: oNewQuestionnaire.IS_ACTIVE,
            isExisting: oNewQuestionnaire.isExisting,
          });
          oModel.setProperty("/newVendorGroup/questionnaires", aQuestionnaires);
          oModel.setProperty("/isQuestionnaireFormVisible", false);
          oModel.setProperty("/newQuestionnaire", {
            question: "",
            QUESTION_TYPE: "Radio",
            ALLOTTED_POINTS: 0,
            IS_MANDATORY: true,
            SECTION: "General Info",
            DROPDOWN_OPTIONS: [],
            IS_ACTIVE: true,
          });
          oModel.setProperty("/contentWidth", "70%");
          MessageToast.show("Questionnaire added");
        },

        onAddAttachmentPress: function () {
          var oModel = this.getView().getModel("rfqModel");
          let uBtn = this.byId("idUpdateAttachmentButton");
          let sBtn = this.byId("idAddattachmentButton");
          uBtn.setVisible(false);
          sBtn.setVisible(true);
          oModel.setProperty("/isQuestionnaireFormVisible", false);
          oModel.setProperty("/isAttachmentFormVisible", true);
          oModel.setProperty("/newAttachment", {
            docName: "",
            docDescription: "",
          });
          oModel.setProperty("/contentWidth", "100%");
        },

        onCancelAttachmentPress: function () {
          var oModel = this.getView().getModel("rfqModel");
          oModel.setProperty("/isAttachmentFormVisible", false);
          oModel.setProperty("/newAttachment", {
            docName: "",
            docDescription: "",
          });
          // oModel.setProperty("/contentWidth", "70%");
        },

        onColumnListItemQuestionnairePress: function (oEvent) {
          var oModel = this.getView().getModel("rfqModel");
          let uBtn = this.byId("idUpdateButton");
          let sBtn = this.byId("idSaveButton");
          uBtn.setVisible(true);
          sBtn.setVisible(false);
          var sPath = oEvent
            .getSource()
            .getBindingContext("rfqModel")
            .getPath();
          var iIndex = parseInt(sPath.split("/").pop());
          var oSelected = oModel.getProperty(sPath);
          oModel.setProperty(
            "/newQuestionnaire",
            JSON.parse(JSON.stringify(oSelected))
          ); // Deep copy
          oModel.setProperty("/isQuestionnaireFormVisible", true);
          oModel.setProperty("/isAttachmentFormVisible", false);
          oModel.setProperty("/isAddQuestionnaire", false);
          oModel.setProperty("/isEditQuestionnaire", false);
          oModel.setProperty("/selectedQuestionnaireIndex", iIndex);
          oModel.setProperty("/contentWidth", "100%");
        },

        onUpdateQuestionnairePress: function () {
          var oModel = this.getView().getModel("rfqModel");

          var iIndex = oModel.getProperty("/selectedQuestionnaireIndex");
          var oUpdatedQuestionnaire = oModel.getProperty("/newQuestionnaire");
          var aQuestionnaires = oModel.getProperty(
            "/newVendorGroup/questionnaires"
          );

          // Update the questionnaire at the selected index
          aQuestionnaires[iIndex] = JSON.parse(
            JSON.stringify(oUpdatedQuestionnaire)
          );
          oModel.setProperty("/newVendorGroup/questionnaires", aQuestionnaires);

          // Reset form visibility
          oModel.setProperty("/isQuestionnaireFormVisible", false);
          oModel.setProperty("/isEditQuestionnaire", false);
          oModel.setProperty("/newQuestionnaire", {});
          sap.m.MessageToast.show("Questionnaire updated successfully.");
        },

        onSaveOrUpdateQuestionnairePress: function () {
          var oModel = this.getView().getModel("rfqModel");
          var bIsEdit = oModel.getProperty("/isEditMode");
          var oQuestionnaire = oModel.getProperty("/newQuestionnaire");
          var aQuestionnaires = oModel.getProperty(
            "/newVendorGroup/questionnaires"
          );

          if (bIsEdit) {
            // Update existing questionnaire
            var iIndex = oModel.getProperty("/selectedQuestionnaireIndex");
            aQuestionnaires[iIndex] = JSON.parse(
              JSON.stringify(oQuestionnaire)
            );
            oModel.setProperty(
              "/newVendorGroup/questionnaires",
              aQuestionnaires
            );
            sap.m.MessageToast.show("Questionnaire updated successfully.");
          } else {
            // Add new questionnaire
            oQuestionnaire.slNo = aQuestionnaires.length + 1;
            aQuestionnaires.push(JSON.parse(JSON.stringify(oQuestionnaire)));
            oModel.setProperty(
              "/newVendorGroup/questionnaires",
              aQuestionnaires
            );
            sap.m.MessageToast.show("Questionnaire added successfully.");
          }

          // Reset form
          oModel.setProperty("/isQuestionnaireFormVisible", false);
          oModel.setProperty("/isEditQuestionnaire", false);
          oModel.setProperty("/newQuestionnaire", {});
        },

        // onAddQuestionnaire: function () {
        //     // Add a new questionnaire row with serial number
        //     var oModel = this.getView().getModel("rfqModel");
        //     var aQuestionnaires = oModel.getProperty("/newVendorGroup/questionnaires");
        //     aQuestionnaires.push({
        //         slNo: aQuestionnaires.length + 1,
        //         question: "",
        //         QUESTION_ID: "Q" + (aQuestionnaires.length + 1),
        //         QUESTION_TYPE: "",
        //         ALLOTTED_POINTS:"",
        //         IS_MANDATORY: true,
        //         DROPDOWN_OPTIONS: "",
        //         SECTION: "General Info",
        //         ORDER: aQuestionnaires.length + 1,
        //         IS_ACTIVE: true
        //     });
        //     oModel.setProperty("/newVendorGroup/questionnaires", aQuestionnaires);
        // },

        onRemoveQuestionnaire: function (oEvent) {
          // Remove the selected questionnaire and update serial numbers
          var oModel = this.getView().getModel("rfqModel");
          var sPath = oEvent
            .getSource()
            .getBindingContext("rfqModel")
            .getPath();
          var aQuestionnaires = oModel.getProperty(
            "/newVendorGroup/questionnaires"
          );
          var iIndex = parseInt(sPath.split("/").pop());
          aQuestionnaires.splice(iIndex, 1);
          // Update serial numbers and order
          aQuestionnaires.forEach((item, index) => {
            item.slNo = index + 1;
            item.ORDER = index + 1;
            item.QUESTION_ID = "Q" + (index + 1);
          });
          oModel.setProperty("/newVendorGroup/questionnaires", aQuestionnaires);
          MessageToast.show("Questionnaire removed");
        },

        onQuestionTypeChange: function (oEvent) {
          var oComboBox = oEvent.getSource();
          var sPath = oComboBox.getBindingContext("rfqModel").getPath();
          var oModel = this.getView().getModel("rfqModel");
          var sSelectedType = oComboBox.getSelectedKey();
          oModel.setProperty(sPath + "/QUESTION_TYPE", sSelectedType);
          if (sSelectedType === "Radio") {
            oModel.setProperty(sPath + "/DROPDOWN_OPTIONS", []);
            oModel.setProperty(sPath + "/ALLOTTED_POINTS", 0);
          } else if (sSelectedType === "Dropdown") {
            oModel.setProperty(sPath + "/ALLOTTED_POINTS", 0);
            oModel.setProperty(sPath + "/DROPDOWN_OPTIONS", []);
          }
        },

        onAddDropdownOption: function (oEvent) {
          var oButton = oEvent.getSource();
          var sPath = oButton.getBindingContext("rfqModel").getPath();
          var oModel = this.getView().getModel("rfqModel");
          var aOptions = oModel.getProperty(sPath + "/DROPDOWN_OPTIONS") || [];
          aOptions.push({
            value: "",
            points: 0,
          });
          oModel.setProperty(sPath + "/DROPDOWN_OPTIONS", aOptions);
        },

        onRemoveDropdownOption: function (oEvent) {
          var oButton = oEvent.getSource();
          var sPath = oButton.getBindingContext("rfqModel").getPath();
          var oModel = this.getView().getModel("rfqModel");
          var aOptions = oModel.getProperty(
            sPath.split("/DROPDOWN_OPTIONS")[0] + "/DROPDOWN_OPTIONS"
          );
          var iIndex = parseInt(sPath.split("/").pop());
          aOptions.splice(iIndex, 1);
          oModel.setProperty(
            sPath.split("/DROPDOWN_OPTIONS")[0] + "/DROPDOWN_OPTIONS",
            aOptions
          );
        },

        onAddAttachment: function () {
          // Add a new attachment row with serial number
          var oModel = this.getView().getModel("rfqModel");
          var aAttachments = oModel.getProperty("/newVendorGroup/attachments");
          aAttachments.push({
            slNo: aAttachments.length + 1,
            docName: "",
            docDescription: "",
            DOCUMENT_ID: "D" + (aAttachments.length + 1),
            isExisting: false,
          });
          oModel.setProperty("/newVendorGroup/attachments", aAttachments);
        },

        onUpdateAttachmentPress: function () {
          var oModel = this.getView().getModel("rfqModel");
          var iIndex = oModel.getProperty("/selectedAttachmentIndex");
          var oUpdatedAttachment = oModel.getProperty("/newAttachment");
          var aAttachments = oModel.getProperty("/newVendorGroup/attachments");

          // Update the attachment at the selected index
          aAttachments[iIndex] = JSON.parse(JSON.stringify(oUpdatedAttachment));
          // Update serial numbers and document IDs
          aAttachments.forEach((item, index) => {
            item.slNo = index + 1;
            item.DOCUMENT_ID = "D" + (index + 1);
          });
          oModel.setProperty("/newVendorGroup/attachments", aAttachments);

          // Reset form visibility
          oModel.setProperty("/isAttachmentFormVisible", false);
          oModel.setProperty("/isEditAttachment", false);
          oModel.setProperty("/newAttachment", {});
          sap.m.MessageToast.show("Attachment updated successfully.");
        },

        onRemoveAttachment: function (oEvent) {
          // Remove the selected attachment and update serial numbers
          var oModel = this.getView().getModel("rfqModel");
          var sPath = oEvent
            .getSource()
            .getBindingContext("rfqModel")
            .getPath();
          var aAttachments = oModel.getProperty("/newVendorGroup/attachments");
          var iIndex = parseInt(sPath.split("/").pop());
          aAttachments.splice(iIndex, 1);
          // Update serial numbers and document IDs
          aAttachments.forEach((item, index) => {
            item.slNo = index + 1;
            item.DOCUMENT_ID = "D" + (index + 1);
          });
          oModel.setProperty("/newVendorGroup/attachments", aAttachments);
          MessageToast.show("Attachment removed");
        },
        onSubmitPressRFQ: function () {
          var that = this;
          var oJsonModel = this.getView().getModel("rfqModel");
          var oODataModel = this.getView().getModel();
          var oNewVendorGroup = oJsonModel.getProperty("/newVendorGroup");
          var bIsEditMode = oJsonModel.getProperty("/isEditMode");

          // Validate required fields
          if (!oNewVendorGroup.CODE) {
            MessageToast.show("Vendor Account Group Code is mandatory");
            return;
          }
          if (!oNewVendorGroup.DESCRIPTION) {
            MessageToast.show("Description is mandatory");
            return;
          }
          if (!oNewVendorGroup.attachments.length && !oNewVendorGroup.questionnaires.length) {
            MessageToast.show("No attachments or questionnaires are added");
            return;
          }


          // Prepare payload
          var oPayload = {
            CODE: oNewVendorGroup.CODE,
            questions: oNewVendorGroup.questionnaires.map((q) => ({
              QUESTION_ID: q.QUESTION_ID,
              ACCOUNT_GROUP: oNewVendorGroup.CODE,
              QUESTION_TEXT: q.question,
              QUESTION_TYPE: q.QUESTION_TYPE.toLowerCase(),
              ALLOTTED_POINTS: parseInt(q.ALLOTTED_POINTS),
              IS_MANDATORY: q.IS_MANDATORY,
              DROPDOWN_OPTIONS: q.DROPDOWN_OPTIONS.map((opt) => ({
                VALUE: opt.VALUE,
                POINTS: parseInt(opt.POINTS, 10),
              })),
              SECTION: q.SECTION,
              ORDER: q.ORDER,
              IS_ACTIVE: q.IS_ACTIVE,
            })),
            attachments: oNewVendorGroup.attachments.map((a, index) => ({
              DOCUMENT_ID: "D" + (index + 1),
              ACCOUNT_GROUP: oNewVendorGroup.CODE,
              FILE_NAME: a.docName,
              DESCRIPTION: a.docDescription,
            })),
          };

          // Include DESCRIPTION only in create mode
          if (!bIsEditMode) {
            oPayload.DESCRIPTION = oNewVendorGroup.DESCRIPTION;
          }

          // Confirmation dialog
          sap.m.MessageBox.confirm("Are you sure you want to proceed?", {
            title: "Confirm",
            onClose: function (sAction) {
              if (sAction === sap.m.MessageBox.Action.OK) {
                // Submit to backend
                that.getView().setBusy(true);
                var sEndpoint = bIsEditMode
                  ? "/editVendorAccountGroupWithQuestionsAndAttachments"
                  : "/createVendorAccountGroupWithQuestionsAndAttachments";
                oODataModel.create(sEndpoint, oPayload, {
                  success: function () {
                    that.getView().setBusy(false);
                    MessageBox.success(
                      bIsEditMode
                        ? "Vendor Account Group Questions Configured"
                        : "Vendor Account Group Questions Configured"
                    );
                    that._resetSplitter();
                    that.getVendorAccountGroupData();
                  },
                  error: function (oError) {
                    that.getView().setBusy(false);
                    MessageBox.error(
                      "Error: " + (oError.message || "Unknown error")
                    );
                  },
                });
              }
            },
          });
        },

        // onSubmitPressRFQ: function () {
        //     var that = this;
        //     var oJsonModel = this.getView().getModel("rfqModel");
        //     var oODataModel = this.getView().getModel();
        //     var oNewVendorGroup = oJsonModel.getProperty("/newVendorGroup");
        //     var bIsEditMode = oJsonModel.getProperty("/isEditMode");

        //     // Validate required fields
        //     if (!oNewVendorGroup.CODE) {
        //         MessageToast.show("Vendor Account Group Code is mandatory");
        //         return;
        //     }
        //     if (!oNewVendorGroup.DESCRIPTION) {
        //         MessageToast.show("Description is mandatory");
        //         return;
        //     }
        //     if (!oNewVendorGroup.attachments.length) {
        //         MessageToast.show("At least one attachment is mandatory");
        //         return;
        //     }

        //     // Prepare payload
        //     var oPayload = {
        //         CODE: oNewVendorGroup.CODE,
        //         questions: oNewVendorGroup.questionnaires.map(q => ({
        //             QUESTION_ID: q.QUESTION_ID,
        //             ACCOUNT_GROUP: oNewVendorGroup.CODE,
        //             QUESTION_TEXT: q.question,
        //             QUESTION_TYPE: q.QUESTION_TYPE,
        //             ALLOTTED_POINTS:q.ALLOTTED_POINTS,
        //             IS_MANDATORY: q.IS_MANDATORY,
        //             DROPDOWN_OPTIONS: q.DROPDOWN_OPTIONS,
        //             SECTION: q.SECTION,
        //             ORDER: q.ORDER,
        //             IS_ACTIVE: q.IS_ACTIVE
        //         })),
        //         attachments: oNewVendorGroup.attachments.map((a, index) => ({
        //             DOCUMENT_ID: "D" + (index + 1),
        //             ACCOUNT_GROUP: oNewVendorGroup.CODE,
        //             FILE_NAME: a.docName,
        //             DESCRIPTION: a.docDescription
        //         }))
        //     };

        //     // Include DESCRIPTION only in create mode
        //     if (!bIsEditMode) {
        //         oPayload.DESCRIPTION = oNewVendorGroup.DESCRIPTION;
        //     }

        //     // Confirmation dialog
        //     sap.m.MessageBox.confirm("Are you sure you want to proceed?", {
        //         title: "Confirm",
        //         onClose: function (sAction) {
        //             if (sAction === sap.m.MessageBox.Action.OK) {
        //                 // Submit to backend
        //                 that.getView().setBusy(true);
        //                 var sEndpoint = bIsEditMode
        //                     ? "/editVendorAccountGroupWithQuestionsAndAttachments"
        //                     : "/createVendorAccountGroupWithQuestionsAndAttachments";
        //                 oODataModel.create(sEndpoint, oPayload, {
        //                     success: function () {
        //                         that.getView().setBusy(false);
        //                         MessageBox.success(bIsEditMode ? "Vendor Account Group updated" : "Vendor Account Group created");
        //                         that._resetSplitter();
        //                         that.getVendorAccountGroupData();
        //                     },
        //                     error: function (oError) {
        //                         that.getView().setBusy(false);
        //                         MessageBox.error("Error: " + (oError.message || "Unknown error"));
        //                     }
        //                 });
        //             }
        //         }
        //     });
        // },

        onCancelPress: function () {
          // Reset form and splitter
          this._resetSplitter();
        },

        onColumnListItemRemovePress: function (oEvent) {
          var oModel = this.getView().getModel("rfqModel");
          var oContext = oEvent.getSource().getBindingContext("rfqModel");
          var oODataModel = this.getView().getModel();
          var oQuestionnaire = oContext.getObject();
          var sQuestionId = oQuestionnaire.QUESTION_ID;
          var sAccountGroup = oModel.getProperty("/newVendorGroup/CODE");

          // Show confirmation dialog
          MessageBox.confirm("Are you sure you want to delete this Question?", {
            title: "Confirm Deletion",
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                // Call OData service to delete the question
                this.getView().setBusy(true);
                oODataModel.create(
                  "/deleteVendorAccountGroupQuestion",
                  {
                    QUESTION_ID: sQuestionId,
                    ACCOUNT_GROUP: sAccountGroup,
                  },
                  {
                    success: function () {
                      // Remove the question from the local model
                      this.getView().setBusy(false);
                      var aQuestionnaires = oModel.getProperty(
                        "/newVendorGroup/questionnaires"
                      );
                      var iIndex = aQuestionnaires.findIndex(function (oItem) {
                        return oItem.QUESTION_ID === sQuestionId;
                      });
                      if (iIndex !== -1) {
                        aQuestionnaires.splice(iIndex, 1);
                        // Update slNo and ORDER for remaining questions
                        aQuestionnaires.forEach(function (oItem, i) {
                          oItem.slNo = i + 1;
                          oItem.ORDER = i + 1;
                        });
                        oModel.setProperty(
                          "/newVendorGroup/questionnaires",
                          aQuestionnaires
                        );
                        MessageBox.success(
                          "Questionnaire deleted successfully"
                        );
                      }
                    }.bind(this),
                    error: function (oError) {
                      this.getView().setBusy(false);
                      MessageBox.error(
                        "Failed to delete questionnaire: " + oError.message
                      );
                    },
                  }
                );
              }
            }.bind(this),
          });
        },

        onColumnListItemLocalRemovePress: function (oEvent) {
          var oModel = this.getView().getModel("rfqModel");
          var oContext = oEvent.getSource().getBindingContext("rfqModel");
          var oQuestionnaire = oContext.getObject();
          var sQuestionId = oQuestionnaire.QUESTION_ID;

          // Remove the unsaved question from the local model
          var aQuestionnaires = oModel.getProperty(
            "/newVendorGroup/questionnaires"
          );
          var iIndex = aQuestionnaires.findIndex(function (oItem) {
            return oItem.QUESTION_ID === sQuestionId;
          });
          if (iIndex !== -1) {
            aQuestionnaires.splice(iIndex, 1);
            // Update slNo and ORDER for remaining questions
            aQuestionnaires.forEach(function (oItem, i) {
              oItem.slNo = i + 1;
              oItem.ORDER = i + 1;
            });
            oModel.setProperty(
              "/newVendorGroup/questionnaires",
              aQuestionnaires
            );
            MessageToast.show("Unsaved questionnaire removed successfully");
          }
        },

        onColumnListItemAttachmentRemovePress: function (oEvent) {
          var oModel = this.getView().getModel("rfqModel");
          var oContext = oEvent.getSource().getBindingContext("rfqModel");
          var oODataModel = this.getView().getModel();
          var oAttachment = oContext.getObject();
          var sDocumentId = oAttachment.DOCUMENT_ID;
          var sAccountGroup = oModel.getProperty("/newVendorGroup/CODE");

          // Show confirmation dialog
          MessageBox.confirm(
            "Are you sure you want to delete this Attachment?",
            {
              title: "Confirm Deletion",
              onClose: function (sAction) {
                if (sAction === MessageBox.Action.OK) {
                  // Call OData service to delete the attachment
                  oODataModel.create(
                    "/deleteVendorAccountGroupAttachment",
                    {
                      DOCUMENT_ID: sDocumentId,
                      ACCOUNT_GROUP: sAccountGroup,
                    },
                    {
                      success: function () {
                        // Remove the attachment from the local model
                        var aAttachments = oModel.getProperty(
                          "/newVendorGroup/attachments"
                        );
                        var iIndex = aAttachments.findIndex(function (oItem) {
                          return oItem.DOCUMENT_ID === sDocumentId;
                        });
                        if (iIndex !== -1) {
                          aAttachments.splice(iIndex, 1);
                          // Update slNo for remaining attachments
                          aAttachments.forEach(function (oItem, i) {
                            oItem.slNo = i + 1;
                          });
                          oModel.setProperty(
                            "/newVendorGroup/attachments",
                            aAttachments
                          );
                          MessageToast.show("Attachment deleted successfully");
                        }
                      }.bind(this),
                      error: function (oError) {
                        MessageToast.show(
                          "Failed to delete attachment: " + oError.message
                        );
                      },
                    }
                  );
                }
              }.bind(this),
            }
          );
        },

        onColumnListItemAttachmentLocalRemovePress: function (oEvent) {
          var oModel = this.getView().getModel("rfqModel");
          var oContext = oEvent.getSource().getBindingContext("rfqModel");
          var oAttachment = oContext.getObject();
          var sDocumentId = oAttachment.DOCUMENT_ID;

          // Remove the unsaved attachment from the local model
          var aAttachments = oModel.getProperty("/newVendorGroup/attachments");
          var iIndex = aAttachments.findIndex(function (oItem) {
            return oItem.DOCUMENT_ID === sDocumentId;
          });
          if (iIndex !== -1) {
            aAttachments.splice(iIndex, 1);
            // Update slNo for remaining attachments
            aAttachments.forEach(function (oItem, i) {
              oItem.slNo = i + 1;
            });
            oModel.setProperty("/newVendorGroup/attachments", aAttachments);
            MessageToast.show("Unsaved attachment removed successfully");
          }
        },

        onIconTabBarSelectEmail: function (oEvent) {
          let oIconTabBar = this.byId("idIcon");
          let key = oIconTabBar.getSelectedKey();
          if (key === "rfq") {
            this.getVendorAccountGroupData();
          }
        },

         onNavHome: function(){
          this.getOwnerComponent().getRouter().navTo("RouteSystemView")
        }
      }
    );
  }
);
