sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "./fragment/DialogStoreSelect"
    
],

    function (BaseController, JSONModel, History, MessageBox, Filter, FilterOperator, DialogStoreSelect) {
        "use strict";

        return BaseController.extend("zmanagehamper.controller.HamperList", {
            onInit: function () {
                this._oViewModel = new JSONModel({
                    busy: true,
                    delay: 0,
                    tableBusyDelay: 0,
                    tableBusy: false,
                    tableTitle: this.getI18nText("TIT_HAMPER_LIST"),
                });

                this.setModel(this._oViewModel, "HamperListView");

                this.getRouter().getRoute("RouteHamperList").attachPatternMatched(this._refreshHamperList, this);

                /** @typeOf sap.m.Table */
                this._oTable = this.byId("tableHampers");
                /** @typeOf sap.m.DateRangeSelection */
                this._oSearchDateRange = this.byId("dateRangeSearch");
                /** @typeOf sap.m.Input */
                this._oSearchDescription = this.byId("inpDescriptionSearch");
                /** @typeOf sap.m.Input */
                this._oSearchHamper = this.byId("inpHamperIdSearch");
                /** @typeOf sap.m.Input */
                this._oSearchCreatedBy = this.byId("inpCreatedBySearch");
                /** @typeOf sap.m.Link */
                this._oLinkStoreSelect = this.byId("linkStoreSelect");
                /** @typeOf sap.m.SegmentedButton */
                this._oSearchValidity = this.byId("sbValiditySearch");

                // Call the customizing servcie
                this._callServiceGetStoreHamperCustomizing();
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
                    sTitle = this.getI18nText("TIT_HAMPER_LIST_COUNT", [
                        iTotalItems,
                    ]);
                } else {
                    sTitle = this.getI18nText("TIT_HAMPER_LIST");
                }
                this._oViewModel.setProperty(
                    "/tableTitle",
                    sTitle
                );
            },

            /**
             * 
             * @param {*} oEvent 
             */
            handleSelectStore: function (oEvent) {
                let oSource = oEvent.getSource();
                let oModel = oSource.getModel();

                let sDialogName = "DialogStoreSelect";
                this.mDialogs = this.mDialogs || {};
                let oDialog = this.mDialogs[sDialogName];
                if (!oDialog) {
                    oDialog = new DialogStoreSelect(this.getView(), oModel);
                    this.mDialogs[sDialogName] = oDialog;
                }
                oDialog.initializeView();
                var context = oEvent.getSource().getBindingContext();
                oDialog._oControl.setBindingContext(context);
                oDialog.open();
            },

            setStore: function (sSiteId) {

                var that = this
                let sObjectPath = "/StoreSet(SiteId='" + sSiteId + "')";
                let oStoreItem = {
                    SiteId: sSiteId
                };

                this.getModel().sDefaultUpdateMethod = 'PUT';

                this.getModel().update(sObjectPath, oStoreItem, {
                    success: function (oData, oResponse) {
                        that._setBusy(false);                        
                        // Call the customizing servcie again
                        that._callServiceGetStoreHamperCustomizing(true);
                    },
                    error: function (oError) {
                        that._setBusy(false);
                        MessageBox.error(that.getI18nText("MSG_ERR_HAMPER_CREATE"));
                    }
                });

            },

            /**
             * Handler for button Reset of the FilterBar
             * @param {sap.ui.base.Event} oEvent the reset event
             */
            onReset: function (oEvent) {
                this._setDateRangeValues();
                this._oSearchDescription.setValue("");
                this._oSearchHamper.setValue("");
                this._oSearchCreatedBy.setValue("");
                this._oSearchValidity.setSelectedKey("X");
            },

            /**
             * Handler for button Go of the FilterBar
             * @param {sap.ui.base.Event} oEvent the search event
             */
            onSearch: function (oEvent) {

                let aFilters = [];
                let oDateFrom = this._oSearchDateRange.getDateValue();
                let oDateTo = this._oSearchDateRange.getSecondDateValue();
                let sDescription = this._oSearchDescription.getValue();
                let sHamper = this._oSearchHamper.getValue();
                let sCreatedBy = this._oSearchCreatedBy.getValue();
                let sValidity = this._oSearchValidity.getSelectedKey();

                if (oDateFrom) {
                    aFilters.push(new Filter(
                        "CreatedAt",
                        FilterOperator.BT,
                        oDateFrom,
                        oDateTo
                    ));
                }
                if (sDescription) {
                    aFilters.push(new Filter(
                        "Description1",
                        FilterOperator.Contains,
                        sDescription
                    ));
                }
                if (sHamper) {
                    aFilters.push(new Filter(
                        "HamperNo",
                        FilterOperator.Contains,
                        sHamper
                    ));
                }
                if (sCreatedBy) {
                    aFilters.push(new Filter(
                        "CreatedBy",
                        FilterOperator.Contains,
                        sCreatedBy
                    ));
                }
                if (sValidity && sValidity !== "X") {
                    aFilters.push(new Filter(
                        "DiscontinuedInd",
                        FilterOperator.EQ,
                        sValidity
                    ));
                }
                this._oTable.getBinding("items").filter(aFilters);
            },

            /**
             * Event handler when the button CreateHamper were pressed
             * @param {sap.ui.base.Event} oEvent the table selectionChange event
             * @public
             */
            handleCreateHamperPress: function (oEvent) {
                this.getRouter().navTo("HamperEdit");
            },

            /**
             * Event handler when a table item gets pressed
             * @param {sap.ui.base.Event} oEvent the table selectionChange event
             * @public
             */
            onPressHamper: function (oEvent) {
                // The source is the list item that got pressed
                this._showObject(oEvent.getSource());
            },

            /* =========================================================== */
            /* internal methods                                            */
            /* =========================================================== */

            _callServiceGetStoreHamperCustomizing: function (bStoreSelection) {
                this._setBusy(true);
                this._bStoreSelection = bStoreSelection;
                this.getService().callGetStoreHamperCustomizing(
                    this,
                    this.getServiceModel()
                );
            },

            /**
             * Sets the reulst of the service call GetStoreHamperCustomizing
             * @param {*} oData 
             */
            setGetStoreHamperCustomizing: function (oData) {
                this.setHamperCustomizing(oData);
               this ._oLinkStoreSelect.setText(oData.Store + " - " + oData.Storename);
                this._setDateRangeValues();
                this._setDeviceSpecificSettings();
                this._setBusy(false);
                if(this._bStoreSelection){
                    this.onSearch();
                    this._bStoreSelection = false;
                }
            },

            showGetStoreHamperCustError: function (oData) {
                
                var that = this;
                let sActionStr = this.getI18nText("BTN_SELECT_STORE");

                MessageBox.error(this.getI18nText("MSG_ERR_STORE_CUSTOMIZING"), {
                    actions: [sActionStr, MessageBox.Action.CLOSE],
                    emphasizedAction: sActionStr,
                    onClose: function (sAction) {
                        if(sAction === sActionStr){
                            that._oLinkStoreSelect.firePress();
                        }
                    }
                });
                this._oLinkStoreSelect.setText(this.getI18nText("BTN_SELECT_STORE"));
                this._setBusy(true);
                this._bStoreSelection = false;
                this.onSearch();
            },

            _setDeviceSpecificSettings: function () {

                if (this.getModel("device").getData().isPhone) {
                    this._oTable.setGrowingThreshold(5);
                } else {
                    this._oTable.setGrowingThreshold(20);
                }
            },

            _setDateRangeValues: function () {
                if (this.getHamperCustomizing().ReduceMonth && this.getHamperCustomizing().ReduceMonth !== "000") {
                    let oDate = new Date();
                    oDate.setMonth(oDate.getMonth() - Number(this.getHamperCustomizing().ReduceMonth));
                    this._oSearchDateRange.setDateValue(oDate);
                    this._oSearchDateRange.setSecondDateValue(new Date());
                } else {
                    this._oSearchDateRange.setValue();
                }
            },

            /**
             * Refreshs the hamper List
             */
            _refreshHamperList: function () {
                //this._setBusy(true);
                var sDirection = History.getInstance().getDirection();
                if (sDirection === sap.ui.core.routing.HistoryDirection.Backwards) {
                    this.onSearch();
                }
            },

            /**
                 * Shows the selected item on the object page
                 * On phones a additional history entry is created
                 * @param {sap.m.ObjectListItem} oItem selected Item
                 * @private
                 */
            _showObject: function (oItem) {
                var oContext = oItem.getBindingContext();
                this._navToHamperDetails(oContext);
            },

            /**
                 * Navigates to the wizard view
                 * @param {sap.ui.model.odata.v2.ODataContextBinding} oContext context
                 * @private
                 */
            _navToHamperDetails: function (oContext) {
                this.getRouter().navTo("HamperDetails", {
                    HamperNo: oContext.getProperty("HamperNo"),
                    BomId: oContext.getProperty("BomId")
                });
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
