sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/HTML" // Add this dependency
],
    function (Controller, UIComponent, JSONModel, MessageBox, Fragment, Filter, FilterOperator, MessageToast, HTML) {
        "use strict";

        return Controller.extend("com.registration.registrationapprovalaisp.controller.RegistrationApprovalObj", {
            onInit: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                let oModel = this.getOwnerComponent().getModel();
                const graphModel = new JSONModel({
                    logs: []
                });
                this.getView().setModel(graphModel, "graphModel");

                this.getView().setModel(oModel);
                oRouter.getRoute("RegisterObjPage").attachPatternMatched(this.onObjectMatched, this);
            },

            loadApprovalLogs: function (requestNo) {
                const oModel = this.getView().getModel();
                const oGraphModel = this.getView().getModel("graphModel");
            
                const parseTimestamp = (raw) => {
                    if (typeof raw === "string") {
                        if (raw.includes("/Date(")) {
                            return new Date(parseInt(raw.replace("/Date(", "").replace(")/", "")));
                        }
                        return new Date(raw);
                    }
                    if (typeof raw === "number") return new Date(raw);
                    if (raw instanceof Date) return raw;
                    return new Date();
                };
            
                const formatTimestamp = (date) => {
                    // Format as "DD/MM/YYYY, HH:MM AM/PM"
                    const options = {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    };
                    return date.toLocaleString("en-GB", options).replace(",", "");
                };
            
                const getStatus = (action) => {
                    switch (action) {
                        case "CREATE": return "Information";
                        case "APPROVE": return "Success";
                        case "SEND_BACK": return "Warning";
                        case "REJECT": return "Error";
                        case "EDIT_RESUBMIT": return "Information";
                        default: return "None";
                    }
                };
            
                const getIcon = (action) => {
                    switch (action) {
                        case "CREATE": return "sap-icon://create";
                        case "APPROVE": return "sap-icon://accept";
                        case "SEND_BACK": return "sap-icon://undo";
                        case "REJECT": return "sap-icon://decline";
                        case "EDIT_RESUBMIT": return "sap-icon://edit";
                        default: return "sap-icon://activity-items";
                    }
                };
            
                oModel.read("/APPROVAL_LOGS_AISP", {
                    filters: [new sap.ui.model.Filter("REQUEST_NO", "EQ", requestNo)],
                    success: function (oData) {
                        const aLogs = oData.results || [];
                        if (!aLogs.length) {
                            sap.m.MessageToast.show("No approval logs found.");
                            oGraphModel.setProperty("/logs", []);
                            return;
                        }
            
                        // Sort logs by timestamp
                        aLogs.sort((a, b) => parseTimestamp(a.TIMESTAMP) - parseTimestamp(b.TIMESTAMP));
            
                        const logs = aLogs.map(log => {
                            const timestamp = parseTimestamp(log.TIMESTAMP);
                            return {
                                timestamp: formatTimestamp(timestamp), // For display
                                rawTimestamp: timestamp.toISOString(), // For binding
                                action: log.ACTION,
                                approver: log.APPROVER_ID,
                                role: log.APPROVER_ROLE || "N/A",
                                comment: log.COMMENT || "No comment provided",
                                level: log.APPROVAL_LEVEL,
                                status: getStatus(log.ACTION),
                                icon: getIcon(log.ACTION)
                            };
                        });
            
                        oGraphModel.setProperty("/logs", logs);
                        console.log("Timeline logs:", JSON.stringify(logs, null, 2));
                    }.bind(this),
                    error: function (err) {
                        sap.m.MessageToast.show("Error fetching logs.");
                        oGraphModel.setProperty("/logs", []);
                    }.bind(this)
                });
            },


            _renderGraph: function () {
                var oGraphModel = this.getView().getModel("graphModel").getProperty("/dData");
                var container = document.getElementById("approvalGraph");

                if (typeof vis === "undefined" || typeof vis.Network === "undefined") {
                    MessageToast.show("vis-network library is not loaded.");
                    return;
                }

                var nodes = new vis.DataSet(oGraphModel.nodes);
                var edges = new vis.DataSet(oGraphModel.lines.map(line => ({
                    from: line.from,
                    to: line.to,
                    label: line.label,
                    color: line.color || "#000000",
                    arrows: "to"
                })));

                var data = { nodes: nodes, edges: edges };
                var options = {
                    layout: {
                        hierarchical: {
                            direction: "UD",
                            sortMethod: "directed"
                        }
                    },
                    nodes: {
                        shape: "box",
                        font: { size: 12 }
                    },
                    edges: {
                        font: { size: 10 },
                        smooth: { type: "cubicBezier" }
                    }
                };

                new vis.Network(container, data, options);
            },

            // transformApprovalLogs: function (data) {
            //     try {
            //         const nodes = [];
            //         const lines = [];
            //         const groups = [];
            //         const groupMap = new Map();

            //         // Log input data
            //         console.log("OData Response:", data.results);

            //         // Sort logs by TIMESTAMP
            //         const logs = (data.results || []).sort((a, b) => {
            //             let timeA, timeB;
            //             try {
            //                 if (typeof a.TIMESTAMP === "string" && a.TIMESTAMP.includes("Date")) {
            //                     timeA = new Date(parseInt(a.TIMESTAMP.match(/\d+/)[0]));
            //                 } else if (typeof a.TIMESTAMP === "string") {
            //                     timeA = new Date(a.TIMESTAMP);
            //                 } else {
            //                     timeA = new Date(0);
            //                     console.warn("Invalid TIMESTAMP for a:", a.TIMESTAMP);
            //                 }
            //                 if (typeof b.TIMESTAMP === "string" && b.TIMESTAMP.includes("Date")) {
            //                     timeB = new Date(parseInt(b.TIMESTAMP.match(/\d+/)[0]));
            //                 } else if (typeof b.TIMESTAMP === "string") {
            //                     timeB = new Date(b.TIMESTAMP);
            //                 } else {
            //                     timeB = new Date(0);
            //                     console.warn("Invalid TIMESTAMP for b:", b.TIMESTAMP);
            //                 }
            //                 return timeA - timeB;
            //             } catch (e) {
            //                 console.error("Error sorting logs:", e);
            //                 return 0;
            //             }
            //         });

            //         // Log sorted logs
            //         console.log("Sorted Logs:", logs);

            //         // Transform logs into nodes, lines, and groups
            //         logs.forEach((log, index) => {
            //             const nodeKey = `${log.REQUEST_NO}_${log.APPROVALLEVEL}_${log.APPROVER_ID}`;
            //             let status;
            //             switch (log.ACTION) {
            //                 case "APPROVE":
            //                     status = "Approved";
            //                     break;
            //                 case "SEND_BACK":
            //                 case "REJECT":
            //                     status = "Rejected";
            //                     break;
            //                 case "CREATE":
            //                 case "EDIT_RESUBMIT":
            //                     status = "Pending";
            //                     break;
            //                 default:
            //                     status = "Pending";
            //                     console.warn("Unknown ACTION:", log.ACTION);
            //             }

            //             // Override status with WORKFLOW_STATE
            //             if (log.WORKFLOW_STATE === "Completed") {
            //                 status = "Completed";
            //             } else if (log.WORKFLOW_STATE === "Rejected") {
            //                 status = "Rejected";
            //             }

            //             // Format TIMESTAMP for display
            //             const timestampDisplay = typeof log.TIMESTAMP === "string" && log.TIMESTAMP.includes("Date")
            //                 ? new Date(parseInt(log.TIMESTAMP.match(/\d+/)[0])).toLocaleString()
            //                 : typeof log.TIMESTAMP === "string"
            //                     ? new Date(log.TIMESTAMP).toLocaleString()
            //                     : "N/A";

            //             nodes.push({
            //                 key: nodeKey,
            //                 title: `${log.APPROVER_ID} (${log.APPROVER_ROLE})`,
            //                 group: String(log.APPROVAL_LEVEL),
            //                 icon: log.REQUEST_TYPE === "CreateUser" ? "sap-icon://employee" : log.REQUEST_TYPE === "CreateSupplier" ? "sap-icon://supplier" : "sap-icon://employee",
            //                 status: status,
            //                 shape: "Box",
            //                 attributes: [
            //                     { label: "Comment", value: log.COMMENT || "N/A" },
            //                     { label: "Description", value: log.DESCRIPTION },
            //                     { label: "Timestamp", value: timestampDisplay },
            //                     { label: "Request Type", value: log.REQUEST_TYPE || "Unknown" },
            //                     { label: "Workflow State", value: log.WORKFLOW_STATE || "N/A" }
            //                 ]
            //             });

            //             // Create group
            //             const groupKey = String(log.APPROVAL_LEVEL);
            //             if (!groupMap.has(groupKey)) {
            //                 groupMap.set(groupKey, true);
            //                 groups.push({
            //                     key: groupKey,
            //                     title: `Level ${log.APPROVAL_LEVEL}${log.REQUEST_TYPE ? " (" + log.REQUEST_TYPE + ")" : ""}`,
            //                     collapsed: false,
            //                     icon: "sap-icon://workflow-tasks"
            //                 });
            //             }

            //             // Create lines
            //             if (index < logs.length - 1) {
            //                 const nextLog = logs[index + 1];
            //                 const nextNodeKey = `${nextLog.REQUEST_NO}_${nextLog.APPROVAL_LEVEL}_${nextLog.APPROVER_ID}`;
            //                 lines.push({
            //                     from: nodeKey,
            //                     to: nextNodeKey,
            //                     status: status,
            //                     attributes: [
            //                         { label: "Action", value: log.ACTION }
            //                     ]
            //                 });
            //             }
            //         });

            //         // Log transformation output
            //         console.log("Transformed Data:", { nodes, lines, groups });

            //         return {
            //             nodes: nodes,
            //             lines: lines,
            //             groups: groups
            //         };
            //     } catch (e) {
            //         console.error("Error transforming approval logs:", e);
            //         MessageToast.show("Failed to process approval logs");
            //         return { nodes: [], lines: [], groups: [] };
            //     }
            // },


            onObjectMatched: function (oEvent) {
                const oView = this.getView();
                // const oModel = oView.getModel("requestInfo");
                // oModel.setProperty("/editable", false);

                oView.byId("idSendBackBtn").setEnabled(true);
                oView.byId("idRejectBtn").setEnabled(true);
                oView.byId("idAcceptBtn").setEnabled(true);
                oView.byId("idSubmitBtn").setVisible(false);
                this.getView().setBusy(true)
                var sObjectId = oEvent.getParameter("arguments").id;
                this.loadApprovalLogs(sObjectId);
                // let oModel = this.getOwnerComponent().getModel("registration-manage");
                // this.getView().setModel(oModel)
                let model = this.getView().getModel();
                let sPath = `/RequestInfo/${sObjectId}`
                debugger;
                model.read(sPath, {
                    success: function (res) {
                        debugger;
                        var oJsonModel = new JSONModel(res);
                        this.getView().setModel(oJsonModel, "requestInfo");
                        oJsonModel.setProperty("/editable", false);
                        this.getView().setBusy(false);
                        let arrAttachemnts = res.TO_ATTACHMENTS.results.map((item) => {
                            return {
                                "REGESTERED_MAIL": item.REGISTERED_MAIL,
                                "DESCRIPTION": item.DESCRIPTION,
                                "IMAGEURL": item.IMAGEURL,
                                "IMAGE_FILE_NAME": item.IMAGE_FILE_NAME
                            }
                        })
                    }.bind(this),
                    error: function (err) {
                        debugger;
                    }
                })
            },

            onNavBack: function () {
                history.go(-1)
            },

            onPreviewAttachment: function (oEvent) {
                debugger;
                let base64URL = oEvent.getSource().data("customData"); // Your base64 URL

                // Decode base64 string, convert to binary data
                // var byteCharacters = atob(base64URL);
                // var byteNumbers = new Array(byteCharacters.length);
                // for (var i = 0; i < byteCharacters.length; i++) {
                //     byteNumbers[i] = byteCharacters.charCodeAt(i);
                // }
                // var byteArray = new Uint8Array(byteNumbers);

                // // Create a blob from the byte array
                // var blob = new Blob([byteArray], { type: 'application/pdf' });

                // // Create an object URL from the blob
                // var objectURL = URL.createObjectURL(blob);

                // Open the object URL in a new tab
                window.open(base64URL);
            },

            onDialogCancel: function () {
                this.sendBackFragment.close();
            },


            onEditPress: function () {
                const oView = this.getView();
                const oModel = oView.getModel("requestInfo");
                const bEditable = oModel.getProperty("/editable");

                // Flip edit mode
                oModel.setProperty("/editable", !bEditable);

                // Enable/Disable buttons
                oView.byId("idSendBackBtn").setEnabled(bEditable); // disable when entering edit mode
                oView.byId("idRejectBtn").setEnabled(bEditable);
                oView.byId("idAcceptBtn").setEnabled(bEditable);

                // Show Submit button only in edit mode
                oView.byId("idSubmitBtn").setVisible(!bEditable);
            },

            formatDate: function (sDate) {
                if (!sDate) {
                    return "";
                }
                // Assuming sDate is in a format like "2025-04-30T00:00:00Z"
                var oDate = new Date(sDate);
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "dd MMMM yyyy"
                });
                return oDateFormat.format(oDate); // Returns date like "30 April 2025"
            },

            onActionConfirm: async function (sAction) {
                const that = this;
                const oBundle = this.getView().getModel("i18n").getResourceBundle();
                const sText = `Are you sure you want to ${sAction.toLowerCase().replace("_", " ")} this request?`;

                MessageBox.confirm(sText, {
                    title: "Confirmation",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: async function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            await that._submitPostRegAction(sAction);
                        }
                    }
                });
            },

            _submitPostRegAction: function (actionType, sComment) {
                const oModel = this.getView().getModel(); // OData V2 model
                const oRouter = this.getOwnerComponent().getRouter();
                const oData = this.getView().getModel("requestInfo").getData();
                const oView = this.getView();

                const payload = {
                    action: actionType,
                    stepNo: oData.APPROVER_LEVEL,
                    REQUEST_NO: oData.REQUEST_NO,

                    reqHeader: [{
                        REGISTERED_ID: oData.REGISTERED_ID,
                        WEBSITE: oData.WEBSITE,
                        VENDOR_NAME1: oData.VENDOR_NAME1,
                        COMPLETED_BY: oData.COMPLETED_BY,
                        DESIGNATION: oData.DESIGNATION,
                        SUBMISSION_DATE: oData.SUBMISSION_DATE,
                        COMPANY_CODE: oData.COMPANY_CODE,
                        REQUEST_TYPE: oData.REQUEST_TYPE
                    }],

                    addressData: (oData.TO_ADDRESS?.results || []).map(addr => ({
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

                    contactsData: (oData.TO_CONTACTS?.results || []).map(c => ({
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

                    DyanamicFormFields: [
                    ],

                    bankData: (oData.TO_BANKS?.results || []).map(bank => ({
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

                    Operational_Prod_Desc: (oData.TO_REG_PRODUCT_SERVICE?.results || []).map(p => ({
                        SR_NO: p.SR_NO,
                        PROD_NAME: p.PROD_NAME,
                        PROD_DESCRIPTION: p.PROD_DESCRIPTION,
                        PROD_TYPE: p.PROD_TYPE,
                        PROD_CATEGORY: p.PROD_CATEGORY
                    })),

                    Operational_Capacity: (oData.TO_REG_CAPACITY?.results || []).map(cap => ({
                        SR_NO: cap.SR_NO,
                        TOTAL_PROD_CAPACITY: cap.TOTAL_PROD_CAPACITY,
                        MINIMUM_ORDER_SIZE: cap.MINIMUM_ORDER_SIZE,
                        MAXMIMUM_ORDER_SIZE: cap.MAXMIMUM_ORDER_SIZE,
                        CITY: cap.CITY
                    })),

                    Disclosure_Fields: (oData.TO_DISCLOSURE_FIELDS?.results || []).map(d => ({
                        SR_NO: d.SR_NO,
                        INTEREST_CONFLICT: d.INTEREST_CONFLICT,
                        ANY_LEGAL_CASES: d.ANY_LEGAL_CASES,
                        ABAC_REG: d.ABAC_REG,
                        CONTROL_REGULATION: d.CONTROL_REGULATION
                    })),

                    Quality_Certificates: (oData.TO_QA_CERTIFICATES?.results || []).map(q => ({
                        SR_NO: q.SR_NO,
                        CERTI_NAME: q.CERTI_NAME,
                        CERTI_TYPE: q.CERTI_TYPE,
                        AVAILABLE: q.AVAILABLE,
                        DONE_BY: q.DONE_BY
                    })),

                    Attachments: (oData.TO_ATTACHMENTS?.results || []).map(file => ({
                        REGESTERED_MAIL: file.REGESTERED_MAIL,
                        DESCRIPTION: file.DESCRIPTION,
                        ATTACH_SHORT_DEC: file.ATTACH_SHORT_DEC,
                        IMAGEURL: file.IMAGEURL,
                        IMAGE_FILE_NAME: file.IMAGE_FILE_NAME
                    }))
                };
                if (actionType == 'SEND_BACK') {
                    payload.reqHeader[0].INSTRUCTIONS = sComment;
                }
                if (actionType == 'REJECT') {
                    payload.REJECTION_COMMENT = sComment;
                }
                if (actionType == 'APPROVE') {
                    payload.reqHeader[0].APPROVED_COMMENT = sComment;
                }
                // Show busy
                sap.ui.core.BusyIndicator.show(0);

                oModel.create("/PostRegData", payload, {
                    success: function (oResponseData) {
                        sap.ui.core.BusyIndicator.hide();

                        MessageBox.success(
                            oResponseData?.PostRegData || `${actionType} successful`,
                            {
                                title: "Success",
                                onClose: function () {
                                    oRouter.navTo("RouteRegistrationApproval");
                                }
                            }
                        );
                    },
                    error: function (oError) {
                        sap.ui.core.BusyIndicator.hide();

                        const errorMsg = oError?.responseText || "Unexpected error occurred";
                        MessageBox.error(`Failed to ${actionType.toLowerCase()}: ${errorMsg}`);
                    }
                });
            },

            onSubmitRequestForm: function () {
                // this.onActionConfirm("APPROVE");
                if (!this._pApproveCommentDialog) {
                    this._pApproveCommentDialog = Fragment.load({
                        id: this.getView().getId(), // ensure uniqueness
                        name: "com.registration.registrationapprovalaisp.fragments.ApproveComment",
                        controller: this
                    }).then(function (oDialog) {
                        this.getView().addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }
                    this._pApproveCommentDialog.then(function (oDialog) {
                        this.byId("approveCommentTextArea")?.setValue(""); // clear old comment
                        oDialog.open();
                    }.bind(this));
                
            },

            onRejectRegistration: function () {
                if (!this._pRejectCommentDialog) {
                    this._pRejectCommentDialog = Fragment.load({
                        id: this.getView().getId(), // ensure uniqueness
                        name: "com.registration.registrationapprovalaisp.fragments.RejectionComment",
                        controller: this
                    }).then(function (oDialog) {
                        this.getView().addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }

                this._pRejectCommentDialog.then(function (oDialog) {
                    this.byId("rejectCommentTextArea")?.setValue(""); // clear old comment
                    oDialog.open();
                }.bind(this));
            },

            onRejectCommentLiveChange: function (oEvent) {
                const sValue = oEvent.getParameter("value") || "";
                this.byId("rejectCharCounter").setText(`${sValue.length} / 500`);
            },

            onSendBackCommentLiveChange: function (oEvent) {
                const sValue = oEvent.getParameter("value") || "";
                this.byId("sendBackCharCounter").setText(`${sValue.length} / 500`);
            },

            onRejectCommentConfirm: function () {
                const sComment = this.byId("rejectCommentTextArea").getValue();

                if (!sComment?.trim()) {
                    MessageBox.warning("Please enter a rejection comment.");
                    return;
                }

                this.byId("rejectCommentDialog").close();
                this._submitPostRegAction("REJECT", sComment);
            },

            onApproveCommentConfirm: function () {
                const sComment = this.byId("approveCommentTextArea").getValue();
                if (!sComment?.trim()) {
                    MessageBox.warning("Please enter a Approve comment.");
                    return;
                }

                this.byId("approveCommentDialog").close();
                this._submitPostRegAction("APPROVE", sComment);
            },

            onRejectCommentCancel: function () {
                this.byId("rejectCommentDialog").close();
            },

            onApproveCommentCancel: function () {
                this.byId("approveCommentDialog").close();
            },

            onSubmitEditRegistration: function () {
                this._submitPostRegAction("EDIT");
            },


            onSendBackRegistration: function () {
                if (!this._pSendBackDialog) {
                    this._pSendBackDialog = Fragment.load({
                        id: this.getView().getId(),
                        name: "com.registration.registrationapprovalaisp.fragments.SendBackComment",
                        controller: this
                    }).then(function (oDialog) {
                        this.getView().addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }

                this._pSendBackDialog.then(function (oDialog) {
                    oDialog.open();
                });
            },

            onSendBackConfirm: function () {
                const oDialog = this.byId("sendBackDialog");
                const sComment = this.byId("sendBackCommentTextArea").getValue();

                if (!sComment?.trim()) {
                    MessageBox.warning("Please enter a comment before proceeding.");
                    return;
                }

                oDialog.close();
                this._submitPostRegAction("SEND_BACK", sComment); // pass comment
            },

            onSendBackCancel: function () {
                this.byId("sendBackDialog").close();
            },

            onPressLog: function () {
                const oLayoutData = this.byId("previewSplitterLayout");
                if (oLayoutData) {
                    oLayoutData.setSize("70%");
                }
            },

            onDeclinePress: function () {
                const oLayoutData = this.byId("previewSplitterLayout");
                if (oLayoutData) {
                    oLayoutData.setSize("100%");
                }
            }







        });
    });









