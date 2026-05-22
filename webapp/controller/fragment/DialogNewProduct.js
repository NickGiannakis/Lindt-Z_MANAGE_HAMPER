sap.ui.define(
    [
        "./BaseManagedObject",
        "zmanagehamper/service/Service",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
    ],
    function (BaseManagedObject, Service, Filter, FilterOperator) {

        return BaseManagedObject.extend(
            "zmanagehamper.controller.fragment.DialogNewProduct",
            {
                /**
                 * @constructor
                 * @public
                 * @param {object} oView - the current view
                 * @param {object} oModel - the OData model
                 */
                constructor: function (oView, oModel) {
                    this._oView = oView;
                    this._oODataModel = oModel;
                    this._oService = new Service();
                    this._oControl = sap.ui.xmlfragment(
                        oView.getId(),
                        "zmanagehamper.view.fragment.DialogNewProduct",
                        this
                    );
                    /** @type sap.m.List */
                    this._oProductList = this._oView.byId("listProducts");

                    /** @type sap.m.SearchField */
                    this._oSearchField = this._oView.byId("searchField");
                },
                /**
                 * Initializes the fragment
                 * @function
                 * @public
                 */
                initializeView: function () {
                    this._oSearchField.setValue("");
                    if (this._oProductList.getBinding("items")) {
                        this._oProductList.removeSelections(true);
                        this._oProductList.getBinding("items").filter([]);

                    }
                },

                onSearch: function (oEvent) {

                    let sSearchValue = oEvent.getParameter("newValue");

                    if (sSearchValue.length > 3) {
                        let aFilters = [];
                        let oFilter = new Filter([
                            new Filter(
                                "Description",
                                FilterOperator.Contains,
                                sSearchValue
                            )
                        ]);
                        aFilters.push(oFilter);
                        this._oProductList.getBinding("items").filter(aFilters);
                    }

                },

                onSelectProduct: function (oEvent) {
                    var oSelectedItem = oEvent.getSource().getSelectedItem();
                    let sSPathSelectedRow = oSelectedItem.getBindingContext().getPath();
                    var sProductId = this.getParentControl().getModel().getProperty(sSPathSelectedRow + "/ProductNumber");
                    this.getParentControl().getProductDetails(sProductId);
                    this.close();
                },

                onPressCancel: function (oEvent) {
                    this.close();
                }
            }
        );

    },
/* bExport= */ true
);

