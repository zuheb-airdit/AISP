sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/formatter"
],
    function (Controller, JSONModel, formatter) {
        "use strict";

        return Controller.extend("com.demo.workflowmanagement.controller.workflowmanagement", {
            formatter: formatter,

            onInit: function () {
                
                // let oModel = this.getOwnerComponent().getModel("registration-manage");
                // this.getView().setModel(oModel);
                // this.getOwnerComponent().getRouter().getRoute("Routeworkflow").attachPatternMatched(this.onObjectMatchedS, this);

                const customizeConfig = {
                    autoColumnWidth: {
                        '*': { min: 2, max: 8, gap: 1, truncateLabel: false },
                        'REASSIGN_FLAG': { min: 2, max: 6, gap: 1, truncateLabel: false },
                        'DEPARTMENT': { min: 2, max: 7, gap: 1, truncateLabel: false },
                        "REGISTERED_ID": { min: 2, max: 12, gap: 1, truncateLabel: true },
                        'VENDOR_ACCOUNT_GROUP': { min: 2, max: 9, gap: 1, truncateLabel: false },
                        "CURRENT_ASSIGNEE": { min: 2, max: 12, gap: 1, truncateLabel: false },
                        "REASSIGN_FLAG": { min: 2, max: 4, gap: 1, truncateLabel: false },
                    }
                };
                this.oSmartTable = this.getView().byId('idSmartTableReqManagementWork');
                this.oSmartTable.setCustomizeConfig(customizeConfig);

            },
            
            // onObjectMatchedS: function () {
            //     this.byId("idSmartTableReqManagementInvitedd").rebindTable();
            // },

            // onBeforrebindWorkflpw: function(oEvent){
            //     
            //         let oBindingParams = oEvent.getParameter("bindingParams");
            //          var oFilter = new sap.ui.model.Filter("STATUS","EQ","4")
            //         oBindingParams.filters.push(oFilter);
            //         // oBindingParams.events = {
            //         //     dataReceived: function (oData) {
            //         //         let iCount = oData.getParameter("data").results.length;
            //         //         this.getView().getModel("countsModel").setProperty("/sendBackCount", iCount);
            //         //     }.bind(this)
            //         // };
            // },

            onReassignReq: function (oEvent) {
                var oTable = this.getView().byId('idInvitedTableds');
                
                var aSelectedItems = oTable.getSelectedItems();
                var sData = aSelectedItems[0].getBindingContext().getObject();
                let req = sData.REQUEST_NO;
                let sTitle = sData.APPROVER_ROLE;
                //let oFilter1 = new sap.ui.model.Filter("REQUEST_NO", sap.ui.model.FilterOperator.EQ, `${req}`);
                let model = this.getView().getModel();
    
                model.read(`/RequestInfo/${req}`, {
                    success: function (res) {
                        this.payLoad = this.convertModelToPayload(res)
                    }.bind(this),
                    error: function (err) {

                    }
                })
                
                let oModel = this.getView().getModel("user-master");
                debugger;
                oModel.read("/VMUsers", {
                    success: function (oData) {
                        debugger;
                        this.FilteredUserData = oData;
                        var filterUserModel = new sap.ui.model.json.JSONModel(oData);
                        this.getView().setModel(filterUserModel, "FilteredUserReassign");
                    }.bind(this),
                    error: function (oError) {
                        debugger;
                        console.log(oError);
                    }
                });
                
                if (!this.reassignFrag) {
                    this.reassignFrag = sap.ui.xmlfragment("com.demo.workflowmanagement.fragments.RequestFrom.Reassign" ,this);
                    this.getView().addDependent(this.reassignFrag);
                }
                this.reassignFrag.open();
            },
            onSearchReassignUsers: function (oEvent) {
                if (sQuery === "") {
                    return
                }
                var sQuery = oEvent.getSource().getValue().trim().toLowerCase();
                var aOriginalData = this.FilteredUserData.results;

                var searchFields = function (obj, input) {
                    for (var key in obj) {
                        var value = obj[key];

                        if (typeof value === "string" && value.toLowerCase().includes(input)) {
                            return true;
                        } else if (typeof value === "object" && value !== null) {
                            if (Array.isArray(value)) {
                                if (value.some(function (item) {
                                    return searchFields(item, input);
                                })) {
                                    return true;
                                }
                            } else if (searchFields(value, input)) {
                                return true;
                            }
                        }
                    }
                    return false;
                };

                var aFilteredData = aOriginalData.filter(function (item) {
                    return searchFields(item, sQuery);
                });

                this.getView().getModel("FilteredUserReassign").setData({ results: aFilteredData });

            },

            onLiveChangeEmailValidation: function (oEvent) {
                let oInput = oEvent.getSource();
                let sValue = oInput.getValue();
                sValue = sValue.toLowerCase();
                oInput.setValue(sValue);
                let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (emailRegex.test(sValue)) {
                    oInput.setValueState(sap.ui.core.ValueState.None);
                    oInput.setValueStateText("");
                } else {
                    oInput.setValueState(sap.ui.core.ValueState.Error);
                    oInput.setValueStateText("Please enter a valid Email Id.");
                }
            },

            selectionChangeHandlerWorkflow: function () {
                this.getView().byId(
                    "idReAssign"
                ).setEnabled(true);
            },
            onSearchRequestNoWorkflow: function (oEvent) {
                
                let req = oEvent.getParameter("query");
                var oSmartTable = this.byId("idSmartTableReqManagementWork");
                var oBinding = oSmartTable.getTable().getBinding("items");
                var aFilters = [];
                if (req) {
                    aFilters.push(new sap.ui.model.Filter("REQUEST_NO", sap.ui.model.FilterOperator.EQ, req));
                }
                oBinding.filter(aFilters);
            },
            onSelectionofReassignEmail: function (oEvent) {
                
                var oSelectedItem = oEvent.getParameter("listItem") || oEvent.getSource().getSelectedItem();
                if (oSelectedItem) {
                    var sEmail = oSelectedItem.getBindingContext("FilteredUserReassign").getProperty("EMAIL");
                    sap.ui.getCore().byId("idReassignInput").setValue(sEmail);
                    this.showUserFragment.close();
                }
            },

            onDialogCancel: function () {
                this.reassignFrag.close()
            },
            createdOnAndByFormatter: function(CREATED_ON) {
                debugger;
                if (!CREATED_ON) {
                    return "";
                }
            
                var oDateFormatInstance = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "dd-MM-yyyy"
                });
            
                var formattedDate = oDateFormatInstance.format(new Date(CREATED_ON));
                return formattedDate;
            },   

            statusFormatter: function (APPROVER_ROLE) {
                switch (APPROVER_ROLE) {
                    default:
                        return `In Progress - ${APPROVER_ROLE}`;
                }
            },

            statusColorFormatter: function (APPROVER_ROLE) {
                switch (APPROVER_ROLE) {
                    default:
                        return "Indication15";
                }
            },

            onValueHelpUserDetails: function () {
                if (!this.showUserFragment) {
                    this.showUserFragment = sap.ui.xmlfragment("com.demo.workflowmanagement.fragments.RequestFrom.valueHelpFilteredUsersReassign", this);
                    this.getView().addDependent(this.showUserFragment);
                }
                this.showUserFragment.open();
            },

            onCloseValueHelpDialog: function () {
                this.showUserFragment.close();
            },

            onSubmitConfirm: function (oEvent) {
                var reAssignEmail = sap.ui.getCore().byId("idReassignInput").getValue();
                this.getView().setBusy(true);

                var sFunctionImportPath = "/PostRegData";
                let oModel = this.getView().getModel();
                let pData = this.payLoad;
                
                pData.REASSIGNED_USER_ID = reAssignEmail;

                
                oModel.create(sFunctionImportPath, pData, {
                    success: function (oData, response) {
                        this.getView().setBusy(false);
                        sap.m.MessageBox.success(`Request re-assigned to ${reAssignEmail}`, {
                            emphasizedAction: sap.m.MessageBox.Action.CLOSE,
                            onClose: function (sAction) {
                                this.getOwnerComponent().getRouter().navTo("Routeworkflow");
                            }.bind(this)
                        });
                    }.bind(this),
                    error: function (oError) {
                        this.getView().setBusy(false);
                        sap.m.MessageBox.error("Something went wrong");
                        console.error("Error:", oError);
                    }.bind(this)
                });
                
                let worflowTble = this.byId("idSmartTableReqManagementWork");
                worflowTble.rebindTable();
                this.reassignFrag.close(); // Close the dialog
            },

            convertModelToPayload: function (modelData) {
                // Assuming that modelData has a `results` array containing the data
                let data = modelData;
                return {
                    // "action": "REASSIGN", // Static action for reassignment
                    // "stepNo": 1, // Static step number
                    // "REQUEST_NO": data.REQUEST_NO,
                    // "APPROVER_LEVEL": data.APPROVER_LEVEL,
                    // "reqHeader": [
                    //     {
                    //         // "REGISTERED_ID": data.REGISTERED_ID, // Vendor's registered email or ID
                    //         // "VENDOR_ORGANISATION_NAME": data.VENDOR_ORGANISATION_NAME, // Name of the vendor organization
                    //         // "CONTACT_PERSON": data.CONTACT_PERSON, // Contact person at the vendor organization
                    //         // "PRIORITY": data.PRIORITY, // Priority of the request
                    //         // "PAN_NO": data.PAN_NO, // PAN number of the vendor
                    //         // "GST_NO": data.GST_NO, // GST number of the vendor
                    //         // "DUE_DELI_NUM": data.DUE_DELI_NUM, // Due diligence number
                    //         // "LST_NO": data.LST_NO, // LST number
                    //         // "CST_NO": data.CST_NO, // CST number
                    //         // "MSME_CATEGORY": data.MSME_CATEGORY, // MSME category status (true/false)
                    //         // "VENDOR_ACCOUNT_GROUP": data.VENDOR_ACCOUNT_GROUP, // Vendor account group
                    //         // "DUE_DILIGANCE": data.DUE_DILIGANCE, // Due diligence flag (true/false)
                    //         // "DUE_DILIGANCE_REQ_NO": data.DUE_DILIGANCE_REQ_NO, // Due diligence request number
                    //         // "APPROVER": data.APPROVER, // Approver's name
                    //     REGISTERED_ID: data.REGISTERED_ID,
                    //     WEBSITE: data.WEBSITE,
                    //     VENDOR_NAME1: data.VENDOR_NAME1,
                    //     COMPLETED_BY: data.COMPLETED_BY,
                    //     DESIGNATION: data.DESIGNATION,
                    //     SUBMISSION_DATE: data.SUBMISSION_DATE,
                    //     COMPANY_CODE: data.COMPANY_CODE,
                    //     REQUEST_TYPE: data.REQUEST_TYPE
                    //     }
                    // ],

                    // // Address data section, mapped from the TO_ADDRESS association
                    // "addressData": data.TO_ADDRESS.results.map(addr => ({
                    //     // "STREET1": address.STREET1, // Address line 1
                    //     // "CITY": address.CITY, // City
                    //     // "COUNTRY": address.COUNTRY, // Country
                    //     // "DISTRICT": address.DISTRICT, // District
                    //     // "PINCODE": address.PINCODE, // Pincode
                    //     // "STATE": address.STATE, // State
                    //     // "POSTAL_CODE": address.POSTAL_CODE, // Postal code
                    //     // "EMAIL": address.EMAIL, // Primary email address
                    //     // "EMAIL_ADDRESS_FOR_PAYMENT": address.EMAIL_ADDRESS_FOR_PAYMENT, // Email for payment correspondence
                    //     // "CONTACT_NO": address.CONTACT_NO, // Contact number
                    //     // "CONTACT_TELECODE": address.CONTACT_TELECODE // Telecode or additional contact number
                    //     SR_NO: addr.SR_NO,
                    //     STREET: addr.STREET,
                    //     STREET1: addr.STREET1,
                    //     STREET2: addr.STREET2,
                    //     STREET3: addr.STREET3,
                    //     STREET4: addr.STREET4,
                    //     COUNTRY: addr.COUNTRY,
                    //     STATE: addr.STATE,
                    //     CITY: addr.CITY,
                    //     POSTAL_CODE: addr.POSTAL_CODE,
                    //     EMAIL: addr.EMAIL,
                    //     CONTACT_NO: addr.CONTACT_NO,
                    //     ADDRESS_TYPE: addr.ADDRESS_TYPE
                    // })),
                    // // contacts data

                    // // Bank data section, mapped from the TO_BANKS association
                    // "bankData": data.TO_BANKS.results.map(bank => ({
                    //     "BRANCH_NAME": bank.BRANCH_NAME, // Bank branch name
                    //     "IFSC": bank.IFSC, // IFSC code
                    //     "BANK_NAME": bank.BANK_NAME, // Bank name
                    //     "ACCOUNT_NO": bank.ACCOUNT_NO, // Bank account number
                    //     "ACCOUNT_TYPE": bank.ACCOUNT_TYPE // Account type (e.g., Current, Savings)
                    // })),

                    // // Attachment data section, mapped from the TO_ATTACHMENTS association
                    // "CompanyProfile": data.TO_ATTACHMENTS.results.map(attachment => ({
                    //     "REGESTERED_MAIL": attachment.REGESTERED_MAIL, // Registered email related to the attachment
                    //     "DESCRIPTION": attachment.DESCRIPTION, // Description of the attachment (e.g., MSME certificate)
                    //     "IMAGEURL": attachment.IMAGEURL, // URL to the image or document file
                    //     "IMAGE_FILE_NAME": attachment.IMAGE_FILE_NAME // File name of the attachment
                    // }))


                    /// new payload 
                        action: "REASSIGN",
                        stepNo: data.APPROVER_LEVEL,
                        REQUEST_NO: data.REQUEST_NO,
                    
                        reqHeader: [{
                            REGISTERED_ID: data.REGISTERED_ID,
                            WEBSITE: data.WEBSITE,
                            VENDOR_NAME1: data.VENDOR_NAME1,
                            COMPLETED_BY: data.COMPLETED_BY,
                            DESIGNATION: data.DESIGNATION,
                            SUBMISSION_DATE: data.SUBMISSION_DATE,
                            COMPANY_CODE: data.COMPANY_CODE,
                            REQUEST_TYPE: data.REQUEST_TYPE
                        }],
                    
                        addressData: (data.TO_ADDRESS?.results || []).map(addr => ({
                            SR_NO: addr.SR_NO,
                            STREET: addr.STREET,
                            STREET1: addr.STREET1,
                            STREET2: addr.STREET2,
                            STREET3: addr.STREET3,
                            STREET4: addr.STREET4,
                            COUNTRY: addr.COUNTRY,
                            STATE: addr.STATE,
                            CITY: addr.CITY,
                            POSTAL_CODE: addr.POSTAL_CODE,
                            EMAIL: addr.EMAIL,
                            CONTACT_NO: addr.CONTACT_NO,
                            ADDRESS_TYPE: addr.ADDRESS_TYPE
                        })),
                    
                        contactsData: (data.TO_CONTACTS?.results || []).map(c => ({
                            SR_NO: c.SR_NO,
                            FIRST_NAME: c.FIRST_NAME,
                            LAST_NAME: c.LAST_NAME,
                            CITY: c.CITY,
                            STATE: c.STATE,
                            COUNTRY: c.COUNTRY,
                            POSTAL_CODE: c.POSTAL_CODE,
                            DESIGNATION: c.DESIGNATION,
                            EMAIL: c.EMAIL,
                            CONTACT_NO: c.CONTACT_NO,
                            MOBILE_NO: c.MOBILE_NO
                        })),
                    
                        DyanamicFormFields: [],
                    
                        bankData: (data.TO_BANKS?.results || []).map(bank => ({
                            SR_NO: bank.SR_NO,
                            BANK_SECTION: bank.BANK_SECTION,
                            SWIFT_CODE: bank.SWIFT_CODE,
                            BRANCH_NAME: bank.BRANCH_NAME,
                            IFSC: bank.IFSC || bank.ROUTING_CODE,
                            BANK_COUNTRY: bank.BANK_COUNTRY,
                            BANK_NAME: bank.BANK_NAME,
                            BENEFICIARY: bank.BENEFICIARY,
                            ACCOUNT_NO: bank.ACCOUNT_NO,
                            ACCOUNT_NAME: bank.ACCOUNT_NAME,
                            IBAN_NUMBER: bank.IBAN_NUMBER,
                            ROUTING_CODE: bank.ROUTING_CODE,
                            OTHER_CODE_NAME: "IFSC CODE",
                            OTHER_CODE_VAL: bank.IFSC || bank.ROUTING_CODE,
                            BANK_CURRENCY: bank.BANK_CURRENCY,
                            GST: bank.GST,
                            GSTYES_NO: bank.GSTYES_NO
                        })),
                    
                        Operational_Prod_Desc: (data.TO_REG_PRODUCT_SERVICE?.results || []).map(p => ({
                            SR_NO: p.SR_NO,
                            PROD_NAME: p.PROD_NAME,
                            PROD_DESCRIPTION: p.PROD_DESCRIPTION,
                            PROD_TYPE: p.PROD_TYPE,
                            PROD_CATEGORY: p.PROD_CATEGORY
                        })),
                    
                        Operational_Capacity: (data.TO_REG_CAPACITY?.results || []).map(cap => ({
                            SR_NO: cap.SR_NO,
                            TOTAL_PROD_CAPACITY: cap.TOTAL_PROD_CAPACITY,
                            MINIMUM_ORDER_SIZE: cap.MINIMUM_ORDER_SIZE,
                            MAXMIMUM_ORDER_SIZE: cap.MAXMIMUM_ORDER_SIZE,
                            CITY: cap.CITY
                        })),
                    
                        Disclosure_Fields: (data.TO_DISCLOSURE_FIELDS?.results || []).map(d => ({
                            SR_NO: d.SR_NO,
                            INTEREST_CONFLICT: d.INTEREST_CONFLICT,
                            ANY_LEGAL_CASES: d.ANY_LEGAL_CASES,
                            ABAC_REG: d.ABAC_REG,
                            CONTROL_REGULATION: d.CONTROL_REGULATION
                        })),
                    
                        Quality_Certificates: (data.TO_QA_CERTIFICATES?.results || []).map(q => ({
                            SR_NO: q.SR_NO,
                            CERTI_NAME: q.CERTI_NAME,
                            CERTI_TYPE: q.CERTI_TYPE,
                            AVAILABLE: q.AVAILABLE,
                            DONE_BY: q.DONE_BY
                        })),
                    
                        Attachments: (data.TO_ATTACHMENTS?.results || []).map(file => ({
                            REGESTERED_MAIL: file.REGESTERED_MAIL,
                            DESCRIPTION: file.DESCRIPTION,
                            ATTACH_SHORT_DEC: file.ATTACH_SHORT_DEC,
                            IMAGEURL: file.IMAGEURL,
                            IMAGE_FILE_NAME: file.IMAGE_FILE_NAME
                        }))
                };
            }

        });
    });