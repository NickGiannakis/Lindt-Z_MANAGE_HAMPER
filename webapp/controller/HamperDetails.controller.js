sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/PDFViewer"
],

    function (BaseController, JSONModel, formatter, PDFViewer) {
        "use strict";

        return BaseController.extend("zmanagehamper.controller.HamperDetails", {


            formatter: formatter,

            onInit: function () {

                this._oViewModel = new JSONModel({
                    busy: true,
                    delay: 0,
                    taxVisible: false,
                    matSalesRepVisible: false,
                    tableTitle: this.getI18nText("TIT_PRODUCT_LIST")
                });

                this.setModel(this._oViewModel, "HamperDetailsView");

                this.getRouter().getRoute("HamperDetails").attachPatternMatched(this._onObjectMatched, this);

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
                this._getViewElements();        
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

            },

            /**
             * Handler for press event of button Print
             * @param {sap.ui.base.Event} oEvent the update finished event
             * @public
            */
            onBtnPrintPress: function (oEvent) {
                var oPdfViewer = new PDFViewer();
                this.getView().addDependent(oPdfViewer);
                var sServiceURL = this.getServiceModel().sServiceUrl;
                var sSource = sServiceURL + "/PDFPrintSet(HamperNo='" + this._oCurrentHamper.HamperNo + "')/$value";
                oPdfViewer.setSource(sSource);
                oPdfViewer.setTitle("PDF");
                oPdfViewer.open();
            },

            /**
             * Handler for press event of button Edit
             * @param {sap.ui.base.Event} oEvent the update finished event
             * @public
            */
            onBtnEditHamperPress: function (oEvent) {
                sap.m.MessageToast.show("Function will be implemented soon!");
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

            setCurrentHamper: function (oHamperItem) {
                this._oCurrentHamper = oHamperItem;
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

                var sHamperNo = oEvent.getParameter("arguments").HamperNo;
                var sBomId = oEvent.getParameter("arguments").BomId;

                this.getModel()
                    .metadataLoaded()
                    .then(
                        function () {
                            var sObjectPath = this.getModel().createKey(
                                "StoreHamperSet",
                                {
                                    HamperNo: sHamperNo,
                                    BomId: sBomId
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

            _onBindingChange: function () {
                var oView = this.getView(),
                    oElementBinding = oView.getElementBinding();

                // No data for the binding
                if (!oElementBinding.getBoundContext()) {
                    this.getRouter().getTargets().display("objectNotFound");
                    return;
                }
                this.setCurrentHamper(
                    oView.getBindingContext().getObject()
                );
                this._readCustomizing();
                this._setBusy(false);
            },

            /**
             * 
             */
            _readCustomizing: function () {
                
                this._oViewModel.setProperty("/taxVisible", this.getHamperCustomizing().TaxClassAvailable);
                this._oViewModel.setProperty("/matSalesRepVisible", this.getHamperCustomizing().MatSalesRepVisible);
                
                if(this.getHamperCustomizing().MatSalesRepVisible){
                    this._oTitGeneralData.setText(this.getI18nText("TIT_GENERAL_DATA"));
                }else{
                    this._oTitGeneralData.setText(null);
                }
            },

            /**
            * 
            */
            _getViewElements: function () {
                
                /** @type ssap.ui.core.Title */
                this._oTitGeneralData = this.getView().byId("titGeneralDataDetails");
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

        });
    });