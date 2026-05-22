sap.ui.define([
    "./BaseController",
    "sap/ui/core/routing/History",
    "sap/ui/model/json/JSONModel",
    "./fragment/DialogNewProduct",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/message/Message",
    "sap/ui/core/MessageType",
    "../model/formatter",
    "sap/m/Dialog",
    "sap/m/DialogType",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/m/Text",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState"
],

    function (BaseController, History, JSONModel, DialogNewProduct, MessageToast, MessageBox, Message, MessageType, formatter, Dialog, DialogType, Button, ButtonType, Text, Fragment, ValueState) {
        "use strict";

        return BaseController.extend("zmanagehamper.controller.HamperEdit", {

            formatter: formatter,

            onInit: function () {

                this._oViewModel = new JSONModel({
                    busy: true,
                    tableBusy: false,
                    delay: 0,
                    finalPrice: 0.00,
                    salesPrice: 0.00,
                    descrLang2Enabled: false,
                    descrLang3Enabled: false,
                    descrLang4Enabled: false,
                    taxClassAvailable: false,
                    matSalesRepEnable: false,
                    markupEnable: true,
                    tableTitle: this.getI18nText("TIT_PRODUCT_LIST")
                });

                this._getViewElements();

                this._oMessageManager = sap.ui.getCore().getMessageManager();

                this.setModel(this._oViewModel, "HamperEditView");
                this.setModel(this._oMessageManager.getMessageModel(), "message");

                this._oMessageManager.registerObject(this.getView(), true);

                this.getRouter().getRoute("HamperEdit").attachPatternMatched(this._onObjectMatched, this);

                var iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

                this.getOwnerComponent()
                    .getModel()
                    .metadataLoaded()
                    .then(
                        function () {
                            // Restore original busy indicator delay for the object view
                            this._oViewModel.setProperty(
                                "/delay",
                                iOriginalBusyDelay
                            );
                        }.bind(this)
                    );

                this.getOwnerComponent().getService("ShellUIService").then(function (oShellService) {
                    oShellService.setBackNavigation(function () {
                        //either do nothing to disable it, or add your own nav back logic for having the navigation
                        switch (this.getCurrentRouteName()) {
                            case "HamperEdit":
                                this.onPressCancel();
                                break;
                            default:
                                this.onNavBack();
                                break;
                        }

                    }.bind(this));
                }.bind(this));

            },

            /**
             * 
             */
            onMessagePopoverPress: function (oEvent) {
                var oSourceControl = oEvent.getSource();
                this._getMessagePopover().then(function (oMessagePopover) {
                    oMessagePopover.openBy(oSourceControl);
                });
            },

            /**
             * Triggered by the table's 'updateFinished' event: after new table
             * data is available, this handler method updates the table counter.
             * This should only happen if the update was successful, which is
             * why this handler is attached to 'updateFinished' and not to the
             * table's list binding's 'dataReceived' method.
             * @param {sap.ui.base.Event} oEvent the update finished event
             * @public
            */
            onUpdateFinished: function (oEvent) {
                // update the worklist's object counter after the table update
                var sTitle,
                    oTable = oEvent.getSource(),
                    iTotalItems = oEvent.getParameter("total");
                // only update the counter if the length is final and
                // the table is not empty
                if (
                    iTotalItems &&
                    oTable.getBinding("items").isLengthFinal()
                ) {
                    sTitle = this.getI18nText("TIT_PRODUCT_LIST_COUNT", [
                        iTotalItems,
                    ]);
                } else {
                    sTitle = this.getI18nText("TIT_PRODUCT_LIST");
                }
                this._oViewModel.setProperty(
                    "/tableTitle",
                    sTitle
                );
                this._calcHamperPrice();
            },

            /**
             * 
             * @param {*} oEvent 
             */
            onLiveChangeDescription: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                this._oTxtDHeadDescrSn.setText(sValue);
                this._oTxtDHeadDescrEx.setText(sValue);
            },

            /**
             * 
             * @param {*} oEvent 
             */
            onLiveChangeFinalPrice: function (oEvent) {
                this._oViewModel.setProperty("/markupEnable", false);
                var nValue = oEvent.getParameter("value");
                //nValue = formatter.numberUnit4(nValue);
                this._oViewModel.setProperty("/finalPrice", nValue);
                if (nValue === "" || nValue === 0) {
                    this._oViewModel.setProperty("/markupEnable", true);
                    this._oViewModel.setProperty("/finalPrice", this._oViewModel.getProperty("/backUpFinalPrice"));
                }
                if (this.getHamperCustomizing().MatSalesRepVisible) {
                    this.callGetUmbrellaArticle();
                }

                // calculate markup based on manual price
                var fValue = parseFloat(nValue);
                var nSalesPriceComponents = parseFloat(this._oViewModel.getProperty("/salesPrice"));

                var nCurrentMarkup = parseFloat(fValue / nSalesPriceComponents - 1).toFixed(5);
                var pAllowedFrom = this._oViewModel.getProperty("/HamperMarkupPercentAllowedFrom") / 100;
                var pAllowedTo = this._oViewModel.getProperty("/HamperMarkupPercentAllowedTo") / 100;

                if (fValue < nSalesPriceComponents && pAllowedFrom > nCurrentMarkup && nCurrentMarkup != 0) {
                    this._oInpFinalPrice.setValueState(ValueState.Error);
                    this._oInpFinalPrice.setValueStateText(this.getI18nText("TXT_SALES_PRICE_TOO_LOW", [pAllowedFrom * 100]));

                } else if (fValue > nSalesPriceComponents && pAllowedTo < nCurrentMarkup && nCurrentMarkup != 0) {
                    this._oInpFinalPrice.setValueState(ValueState.Error);
                    this._oInpFinalPrice.setValueStateText(this.getI18nText("TXT_SALES_PRICE_TOO_HIGH", [pAllowedTo * 100]));

                } else {
                    this._oInpFinalPrice.setValueState(ValueState.None);
                    this._oInpFinalPrice.setValueStateText("");
                }

            },

            callGetUmbrellaArticle: function () {
                this.getService().getUmbrellaArticle(this, this.getServiceModel(), this._oViewModel.getProperty("/finalPrice"));
            },

            setUmbrellaArticleResult: function (oData) {
                this._oInpMatSalesRep.setValue(oData.UmbrellaArticleId);
                this._oTextMatSalesRep.setText(oData.Remarks);
            },

            /**
             * 
             */
            setUmbrellaArticleError: function (oData) {

            },

            /**
             * 
             * @param {*} oEvent 
             */
            onFixPriceChange: function (oEvent) {
                var bSelected = oEvent.getParameter("selected");
                var oInputFP = this.getView().byId("inpFinalPrice");
                oInputFP.setEnabled(bSelected);
            },

            /**
             * 
             * @param {*} oEvent 
             */
            handleAddProduct: function (oEvent) {
                let oSource = oEvent.getSource();
                let oModel = oSource.getModel();

                let sDialogName = "DialogNewProduct";
                this.mDialogs = this.mDialogs || {};
                let oDialog = this.mDialogs[sDialogName];
                if (!oDialog) {
                    oDialog = new DialogNewProduct(this.getView(), oModel);
                    this.mDialogs[sDialogName] = oDialog;
                }
                oDialog.initializeView();
                var context = oEvent.getSource().getBindingContext();
                oDialog._oControl.setBindingContext(context);
                oDialog.open();
            },

            /**
             * 
             * @param {*} oEvent 
             */
            handleDeleteProductItem: function (oEvent) {

                var that = this;
                let context = oEvent.getParameter('listItem').getBindingContext("NewProductModel");
                let sSPathSelectedRow = context.getPath();
                let aPathParts = sSPathSelectedRow.split("/");
                let iIndex = aPathParts[aPathParts.length - 1];
                let oData = this._oNewProductModel.getData();

                MessageBox.confirm(
                    this.getI18nText("TXT_DELETE_PRODUCT"),
                    {
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        emphasizedAction: MessageBox.Action.YES,
                        onClose: function (oAction) {
                            if (oAction === MessageBox.Action.YES) {
                                oData.ProductSet.splice(iIndex, 1);
                                that._oNewProductModel.setData(oData);
                                that._oNewProductModel.refresh();
                                that._calcHamperPrice();
                            }
                        }
                    }
                );
            },

            /**
             * 
             * @param {*} oEvent 
             */
            onQuantityChange: function (oEvent) {
                let nValue = oEvent.getParameter("value");
                let oSelectedProduct = oEvent.getSource();
                let sSPathSelectedRow = oSelectedProduct.getParent().getBindingContext("NewProductModel").getPath();
                this._oNewProductModel.setProperty(sSPathSelectedRow + "/BomQuantity", nValue);
                this._calcHamperPrice();
            },

            /**
             * 
             * @param {*} oEvent 
             */
            onMarkupChange: function (oEvent) {
                this._calcMarkupPrice();
            },

            /**
             * 
             * @param {*} sProductId 
             */
            getProductDetails: function (sProductId) {
                this._setTableBusy(true);
                this.getService().callGetProduct(this, this.getServiceModel(), sProductId, '*');
            },

            /* =========================================================== */
            /* Scanner methods                                            */
            /* =========================================================== */

            /**
             * 
             * @param {*} oEvent 
             */
            onScanSuccess: function (oEvent) {
                if (oEvent.getParameter("cancelled")) {
                    MessageToast.show("Scan cancelled", { duration: 1000 });
                } else {
                    if (oEvent.getParameter("text")) {
                        this._setTableBusy(true);
                        this.getService().callGetProduct(this, this.getServiceModel(), '*', oEvent.getParameter("text"));
                    }
                }
            },

            /**
             * 
             * @param {*} oEvent 
             */
            onScanFail: function (oEvent) {
                MessageToast.show("Scan failed: " + oEvent, { duration: 1000 });
            },

            /**
             * 
             * @param {*} oEvent 
             */
            onScanLiveUpdate: function (oEvent) {

            },

            /**
             * 
             * @param {*} oData 
             */
            setProductResult: function (oData) {
                this.addScannedProduct(oData);
                this._setTableBusy(false);
            },

            /**
             * 
             */
            setProductResultError: function () {
                this._setTableBusy(false);
            },

            /**
             * 
             * @param {*} oProduct 
             */
            addScannedProduct: function (oProduct) {
                var oTableData = this._oNewProductModel.getData();
                oTableData.ProductSet.push(this._createNewProduct(oProduct));
                this._oNewProductModel.setData(oTableData);
                this._calcHamperPrice();
            },

            /**
             * 
             */
            onPressSave: function () {
                if (!this._oSaveDialog) {
                    this._oSaveDialog = new Dialog({
                        type: DialogType.Message,
                        title: this.getI18nText("TIT_SAVE_HAMPER"),
                        content: new Text({ text: this.getI18nText("TXT_SAVE_PRODUCT") }),
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: this.getI18nText("BTN_YES"),
                            press: function () {
                                this.saveHamper();
                                this._oSaveDialog.close();
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: this.getI18nText("BTN_NO"),
                            press: function () {
                                this._oSaveDialog.close();
                            }.bind(this)
                        })
                    });
                }
                this._oSaveDialog.open();
            },


            /**
             * 
             */
            saveHamper: function () {
                var aItems = this._oTable.getItems();

                if (this.checkHamperBeforSave()) {

                    this._setBusy(true);

                    var oHamperItem = {
                        HamperNo: "",
                        CreatedAt: new Date(),
                        BomId: "",
                        Description1: this._oInpDescrLang1.getValue(),
                        DescrLang1: this.getHamperCustomizing().DescrLang1,
                        Description2: this._oInpDescrLang2.getValue(),
                        DescrLang2: this.getHamperCustomizing().DescrLang2,
                        Description3: this._oInpDescrLang3.getValue(),
                        DescrLang3: this.getHamperCustomizing().DescrLang3,
                        Description4: this._oInpDescrLang4.getValue(),
                        DescrLang4: this.getHamperCustomizing().DescrLang4,
                        SalesOrganization: this.getHamperCustomizing().SalesOrganization,
                        DistributionChannel: this.getHamperCustomizing().DistributionChannel,
                        Plant: this.getHamperCustomizing().Store,
                        Ean: "",
                        FinalPrice: this._oViewModel.getProperty("/finalPrice"),
                        SalesPrice: this._oViewModel.getProperty("/finalPrice"),
                        ProductOldId: this._oInpMatSalesRep.getValue(),
                        TaxClass: this._oCbTax.getSelectedKey()
                    };

                    var itemData = [];

                    for (let index = 0; index < aItems.length; index++) {
                        const oItem = aItems[index];
                        let sSPathSelectedRow = oItem.getBindingContext("NewProductModel").getPath();
                        this._oNewProductModel.getProperty(sSPathSelectedRow + "/BomComponent");

                        itemData.push({
                            HamperNo: "",
                            BomId: "",
                            BomComponent: this._oNewProductModel.getProperty(sSPathSelectedRow + "/BomComponent"),
                            Description: this._oNewProductModel.getProperty(sSPathSelectedRow + "/Description"),
                            BomItem: this._oNewProductModel.getProperty(sSPathSelectedRow + "/BomItem"),
                            BomPrice: this._oNewProductModel.getProperty(sSPathSelectedRow + "/BomPrice"),
                            BomCurrency: this._oNewProductModel.getProperty(sSPathSelectedRow + "/BomCurrency"),
                            BomQuantity: this._oNewProductModel.getProperty(sSPathSelectedRow + "/BomQuantity").toString(),
                            BomUnit: this._oNewProductModel.getProperty(sSPathSelectedRow + "/BomUnit"),
                        });

                    }

                    oHamperItem.StoreHamperItemSet = itemData;

                    var that = this;

                    this.getModel().create("/StoreHamperSet", oHamperItem, {
                        success: function (oData, oResponse) {
                            that._setBusy(false);
                            var successObj = oData.HamperNo;
                            MessageBox.success(that.getI18nText("MSG_SUC_HAMPER_CREATE", [successObj]), {
                                actions: [MessageBox.Action.CLOSE],
                                onClose: function (sAction) {
                                    that.onNavBack();
                                }
                            });
                        },
                        error: function (oError) {
                            that._setBusy(false);
                            MessageBox.error(that.getI18nText("MSG_ERR_HAMPER_CREATE"));
                        }
                    });
                }
            },

            /**
             * 
             * @returns 
             */
            checkHamperBeforSave: function () {
                let bCheck = true;
                sap.ui.getCore().getMessageManager().removeAllMessages();
                this._oInpDescrLang1.setValueState(sap.ui.core.ValueState.None);
                this._oInpDescrLang2.setValueState(sap.ui.core.ValueState.None);
                this._oInpDescrLang3.setValueState(sap.ui.core.ValueState.None);
                this._oInpDescrLang4.setValueState(sap.ui.core.ValueState.None);
                this._oCbTax.setValueState(sap.ui.core.ValueState.None);
                //this._oInpMatSalesRep.setValueState(sap.ui.core.ValueState.None);

                var aItems = this._oTable.getItems();
                if (aItems.length === 0) {
                    // MessageBox.error(this.getI18nText("MSG_ERR_ENTER_PRODUCT"));

                    var oMessage = new Message({
                        message: this.getI18nText("MSG_ERR_ENTER_PRODUCT"),
                        type: MessageType.Error,
                        target: "/Dummy",
                        processor: this.getView().getModel()
                    });
                    sap.ui.getCore().getMessageManager().addMessages(oMessage);

                    bCheck = false;
                }
                if (this._oViewModel.getProperty("/finalPrice") <= 0) {
                    // MessageBox.error(this.getI18nText("MSG_ERR_FINAL_PRICE_MISSING"));
                    var oMessage = new Message({
                        message: this.getI18nText("MSG_ERR_FINAL_PRICE_MISSING"),
                        type: MessageType.Error,
                        target: "/Dummy",
                        processor: this.getView().getModel()
                    });
                    sap.ui.getCore().getMessageManager().addMessages(oMessage);
                    bCheck = false;
                }
                if (this._oInpFinalPrice.getValueState() === ValueState.Error) {
                    var oMessage = new Message({
                        message: this.getI18nText("MSG_ERR_FINAL_PRICE_INCORRECT"),
                        type: MessageType.Error,
                        target: "/Dummy",
                        processor: this.getView().getModel()
                    });
                    sap.ui.getCore().getMessageManager().addMessages(oMessage);
                    bCheck = false;
                }
                if (this._oInpDescrLang1.getValue() === "") {
                    this._oInpDescrLang1.setValueState(sap.ui.core.ValueState.Error);
                    var oMessage = new Message({
                        message: this.getI18nText("MSG_ERR_DESCRIPTION_MISSING"),
                        type: MessageType.Error,
                        target: "/Dummy",
                        processor: this.getView().getModel()
                    });
                    sap.ui.getCore().getMessageManager().addMessages(oMessage);
                    bCheck = false;
                }
                if (this.getHamperCustomizing().DescrLang2 !== "") {
                    if (this._oInpDescrLang2.getValue() === "") {
                        this._oInpDescrLang2.setValueState(sap.ui.core.ValueState.Error);
                        var oMessage = new Message({
                            message: this.getI18nText("MSG_ERR_DESCRIPTION_MISSING"),
                            type: MessageType.Error,
                            target: "/Dummy",
                            processor: this.getView().getModel()
                        });
                        sap.ui.getCore().getMessageManager().addMessages(oMessage);
                        bCheck = false;
                    }
                }
                if (this.getHamperCustomizing().DescrLang3 !== "") {
                    if (this._oInpDescrLang3.getValue() === "") {
                        this._oInpDescrLang3.setValueState(sap.ui.core.ValueState.Error);
                        var oMessage = new Message({
                            message: this.getI18nText("MSG_ERR_DESCRIPTION_MISSING"),
                            type: MessageType.Error,
                            target: "/Dummy",
                            processor: this.getView().getModel()
                        });
                        sap.ui.getCore().getMessageManager().addMessages(oMessage);
                        bCheck = false;
                    }
                }
                if (this.getHamperCustomizing().DescrLang4 !== "") {
                    if (this._oInpDescrLang4.getValue() === "") {
                        this._oInpDescrLang4.setValueState(sap.ui.core.ValueState.Error);
                        var oMessage = new Message({
                            message: this.getI18nText("MSG_ERR_DESCRIPTION_MISSING"),
                            type: MessageType.Error,
                            target: "/Dummy",
                            processor: this.getView().getModel()
                        });
                        sap.ui.getCore().getMessageManager().addMessages(oMessage);
                        bCheck = false;
                    }
                }
                if (this.getHamperCustomizing().TaxClassAvailable) {
                    if (this._oCbTax.getSelectedKey() === 0) {
                        this._oCbTax.setValueState(sap.ui.core.ValueState.Error);
                        var oMessage = new Message({
                            message: this.getI18nText("MSG_ERR_TAX_MISSING"),
                            type: MessageType.Error,
                            target: "/Dummy",
                            processor: this.getView().getModel()
                        });
                        sap.ui.getCore().getMessageManager().addMessages(oMessage);
                        bCheck = false;
                    }
                }
                /**
                if (this.getHamperCustomizing().MatSalesRepEnable) {
                    if (this._oInpMatSalesRep.getValue() === "") {
                        this._oInpMatSalesRep.setValueState(sap.ui.core.ValueState.Error);
                        var oMessage = new Message({
                            message: this.getI18nText("MSG_ERR_TAX_MAT_SALES_REP"),
                            type: MessageType.Error,
                            target: "/Dummy",
                            processor: this.getView().getModel()
                        });
                        sap.ui.getCore().getMessageManager().addMessages(oMessage);
                        bCheck = false;
                    }
                }
                */
                return bCheck;
            },

            /**
             * 
             */
            onPressCancel: function () {
                if (!this._oCancelDialog) {
                    this._oCancelDialog = new Dialog({
                        type: DialogType.Message,
                        title: this.getI18nText("TIT_CANCEL_ADD_PRODUCT"),
                        content: new Text({ text: this.getI18nText("TXT_CANCEL_ADD_PRODUCT") }),
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: this.getI18nText("BTN_YES"),
                            press: function () {
                                this.onNavBack();
                                this._oCancelDialog.close();
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: this.getI18nText("BTN_NO"),
                            press: function () {
                                this._oCancelDialog.close();
                            }.bind(this)
                        })
                    });
                }
                this._oCancelDialog.open();
            },

            /**
             * Event handler  for navigating back.
             * It there is a history entry we go one step back in the browser history
             * If not, it will replace the current entry of the browser history with the worklist route.
             * @public
             * @function
            */
            onNavBack: function () {
                var sPreviousHash = History.getInstance().getPreviousHash();
                if (sPreviousHash !== undefined) {
                    history.go(-1);
                } else {
                    this.getRouter().navTo(
                        "RouteHamperList",
                        true
                    );
                }
            },

            /* =========================================================== */
            /* internal methods                                            */
            /* =========================================================== */

            /**
             * Binds the view to the object path.
             * @function
             * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
             * @private
             */
            _onObjectMatched: function (oEvent) {
                this._setBusy(true);
                this.getModel()
                    .metadataLoaded()
                    .then(
                        function () {
                            var sObjectPath = this.getModel().createKey(
                                "StoreHamperCustomizingSet",
                                {
                                    SalesOrganization: this.getHamperCustomizing().SalesOrganization
                                }
                            );
                            this._bindView("/" + sObjectPath);
                        }.bind(this)
                    );
            },

            /**
             * Binds the view to the object path.
             * @function
             * @param {string} sObjectPath path to the object to be bound
             * @private
            */
            _bindView: function (sObjectPath) {
                var that = this,
                    oDataModel = this.getModel();

                this.getView().bindElement({
                    path: sObjectPath,
                    events: {
                        change: this._onBindingChange.bind(this),
                        dataRequested: function () {
                            oDataModel.metadataLoaded().then(function () {
                                // Busy indicator on view should only be set if metadata is loaded,
                                // otherwise there may be two busy indications next to each other on the
                                // screen. This happens because route matched handler already calls '_bindView'
                                // while metadata is loaded.
                                that._setBusy(true);
                            });
                        },
                        dataReceived: function () {
                            that._setBusy(false);
                            // that.getView().byId("txtProduktText").setVisible(true);
                        },
                    },
                });

            },

            /**
             * 
             * @returns 
             */
            _onBindingChange: function () {
                var oView = this.getView(),
                    oElementBinding = oView.getElementBinding();

                // No data for the binding
                if (!oElementBinding.getBoundContext()) {
                    this.getRouter().getTargets().display("objectNotFound");
                    return;
                }
                this._resetView();
                this._readCustomizing();
                this._addProductModel();
                this._setBusy(false);
            },

            /**
             * 
             */
            _readCustomizing: function () {
                if (this.getHamperCustomizing().DescrLang2 !== "") {
                    this._oViewModel.setProperty("/descrLang2Enabled", true);
                    this._oInpDescrLang2.setValue(this.getHamperCustomizing().Description2);
                }
                if (this.getHamperCustomizing().DescrLang3 !== "") {
                    this._oViewModel.setProperty("/descrLang3Enabled", true);
                    this._oInpDescrLang3.setValue(this.getHamperCustomizing().Description3);
                }
                if (this.getHamperCustomizing().DescrLang4 !== "") {
                    this._oViewModel.setProperty("/descrLang4Enabled", true);
                    this._oInpDescrLang4.setValue(this.getHamperCustomizing().Description4);
                }
                this._oViewModel.setProperty("/taxClassAvailable", this.getHamperCustomizing().TaxClassAvailable);
                this._oViewModel.setProperty("/matSalesRepEnable", this.getHamperCustomizing().MatSalesRepEnable);
                if (this.getHamperCustomizing().MatSalesRepVisible) {
                    this._oTitGeneralData.setText(this.getI18nText("TIT_GENERAL_DATA"));
                } else {
                    this._oTitGeneralData.setText(null);
                }

                if (this.getHamperCustomizing().PercentAllowedFrom) {
                    this._oViewModel.setProperty("/HamperMarkupPercentAllowedFrom", parseInt(this.getHamperCustomizing().PercentAllowedFrom));
                } else {
                    this._oViewModel.setProperty("/HamperMarkupPercentAllowedFrom", -100);
                }
                if (this.getHamperCustomizing().PercentAllowedTo) {
                    this._oViewModel.setProperty("/HamperMarkupPercentAllowedTo", parseInt(this.getHamperCustomizing().PercentAllowedTo));
                } else {
                    this._oViewModel.setProperty("/HamperMarkupPercentAllowedTo", 100);
                }
            },

            /**
             * 
             */
            _resetView: function () {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                this._oViewModel.setProperty("/markupEnable", true);
                this._oViewModel.setProperty("/finalPrice", 0);
                this._oViewModel.setProperty("/backUpFinalPrice", 0);
                this._oViewModel.setProperty("/salesPrice", 0);
                this._oInpFinalPrice.setValue(null);
                this._oStepMarkup.setValue(null);

                this._oInpFinalPrice.setValueState(ValueState.None);
                this._oInpFinalPrice.setValueStateText("");
            },

            /**
             * 
             */
            _addProductModel: function () {
                // Model used to create a new return
                this._oNewProductModel = new JSONModel();
                let aNewProductModelData = [];
                //aNewProductModelData.push(this._createNewProduct());
                this._oNewProductModel.setData({
                    ProductSet: aNewProductModelData,
                });
                this._oTable.setModel(this._oNewProductModel, "NewProductModel");
            },

            /**
             * 
             */
            _calcHamperPrice: function () {
                let nTotal = 0;
                this._oNewProductModel.getData().ProductSet.forEach(function (oItem) {

                    let nItemTotalAmount = oItem.BomQuantity * oItem.BomPrice;
                    nTotal += nItemTotalAmount;

                });
                this._oViewModel.setProperty("/salesPrice", this.formatter.numberUnit(nTotal));
                this._calcMarkupPrice();
            },

            /**
            * 
            */
            _calcMarkupPrice: function () {
                let nValue = this._oStepMarkup.getValue();
                let nTotal = Number(this._oViewModel.getProperty("/salesPrice"));
                if (nValue !== 0) {

                    let newValue = nTotal * nValue / 100;
                    nTotal = nTotal + newValue;

                }
                let value = this.formatter.numberUnit(nTotal)
                this._oViewModel.setProperty("/finalPrice", value);
                this._oViewModel.setProperty("/backUpFinalPrice", value);
            },

            /**
             * 
             * @param {*} oProduct 
             * @returns 
             */
            _createNewProduct: function (oProduct) {

                if (!this.sBomItem) {
                    this.sBomItem = 1;
                } else {
                    this.sBomItem = this.sBomItem / 10;
                    this.sBomItem = this.sBomItem + 1;
                }

                this.sBomItem = this.sBomItem * 10;

                var oProduct = {
                    HamperNo: "*",
                    BomId: "*",
                    BomItem: this.sBomItem.toString(),
                    Description: oProduct.Description,
                    BomComponent: oProduct.ProductNumber,
                    BomPrice: oProduct.SalesPrice,
                    BomCurrency: oProduct.SalesPriceCur,
                    BomQuantity: 1,
                    BomUnit: oProduct.BaseUom,
                    BaseEan: oProduct.BaseEan
                };
                return oProduct;
            },

            /**
            * 
            */
            _getViewElements: function () {

                /** @type sap.m.Table */
                this._oTable = this.getView().byId("tableProductsAdd");
                /** @type sap.m.Text */
                this._oTxtDHeadDescrSn = this.getView().byId("txtHeadDescrSn");
                /** @type sap.m.Text */
                this._oTxtDHeadDescrEx = this.getView().byId("txtHeadDescrEx");
                /** @type sap.m.Input */
                this._oInpDescrLang1 = this.getView().byId("inpDescrLang1");
                /** @type sap.m.Input */
                this._oInpDescrLang2 = this.getView().byId("inpDescrLang2");
                /** @type sap.m.Input */
                this._oInpDescrLang3 = this.getView().byId("inpDescrLang3");
                /** @type sap.m.Input */
                this._oInpDescrLang4 = this.getView().byId("inpDescrLang4");
                /** @type sap.m.StepInput */
                this._oStepMarkup = this.getView().byId("stepMarkup");
                /** @type sap.m.ComboBox */
                this._oCbTax = this.getView().byId("cbTax");
                /** @type sap.m.Input */
                this._oInpMatSalesRep = this.getView().byId("inpMatSalesRep");
                /** @type sap.m.Input */
                this._oInpFinalPrice = this.getView().byId("inpFinalPrice");
                /** @type sap.m.Text */
                this._oTextMatSalesRep = this.getView().byId("txtMatSalesRep");
                /** @type ssap.ui.core.Title */
                this._oTitGeneralData = this.getView().byId("titGeneralData");
            },

            /**
            * 
            */
            _getMessagePopover: function () {
                var oView = this.getView();

                // create popover lazily (singleton)
                if (!this._pMessagePopover) {
                    this._pMessagePopover = Fragment.load({
                        id: oView.getId(),
                        name: "zmanagehamper.view.fragment.MessagePopover"
                    }).then(function (oMessagePopover) {
                        oView.addDependent(oMessagePopover);
                        return oMessagePopover;
                    });
                }
                return this._pMessagePopover;
            },

            /**
             * Sets the busy state
             * @function
             * @param {Boolean} bBusy the value of the busy state
             * @private
            */
            _setBusy: function (bBusy) {
                this._oViewModel.setProperty("/busy", bBusy);
            },

            /**
             * Sets the busy state
             * @function
             * @param {Boolean} bBusy the value of the busy state
             * @private
            */
            _setTableBusy: function (bBusy) {
                this._oViewModel.setProperty("/tableBusy", bBusy);
            },

        });
    });