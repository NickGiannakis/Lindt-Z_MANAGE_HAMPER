sap.ui.define(
    [
        "sap/ui/base/Object",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
    ],
    function (Object, Filter, FilterOperator) {
        "use strict";

        return Object.extend(
            "zmanagehamper.service.Service",
            {
                /**
                 * Costructor of the Service.js class
                 * @constructor
                 * @public
                 */
                constructor: function () {
                    Object.call(this);
                },

                /**
                 * Calls the function import /getHamperCustomizing
                 * @function
                 * @public
                 * @param {sap.ui.core.mvc.Controller} oViewController - Der aktuelle ViewController
                 * @param {sap.ui.model.odata.v2.ODataModel} oModel - Das aktuelle Model
                 */
                callGetStoreHamperCustomizing: function (oViewController, oModel) {
                    var successFunc = function (oData) {
                        if (oData !== undefined) {
                            oViewController.setGetStoreHamperCustomizing(oData);
                        }
                    };

                    var errorFunc = function (oData) {
                       oViewController.showGetStoreHamperCustError(oData);
                    };

                    oModel.callFunction("/getHamperCustomizing", {
                        method: "GET",
                        success: successFunc,
                        error: errorFunc,
                    });
                },

                /**
                 * Calls the function import /getProduct
                 * @function
                 * @public
                 * @param {sap.ui.core.mvc.Controller} oViewController - Der aktuelle ViewController
                 * @param {sap.ui.model.odata.v2.ODataModel} oModel - Das aktuelle Model
                 * @param {string} sProductNumber - the product
                 * @param {string} sBaseEan - the product standard id
                 */
                callGetProduct: function (oViewController, oModel, sProductNumber, sBaseEan) {
                    
                    var oUrlparams = {
                        ProductNumber: sProductNumber,
                        BaseEan: sBaseEan                        
                    };
                    
                    var successFunc = function (oData) {
                        if (oData !== undefined) {
                            oViewController.setProductResult(oData);
                        }
                    };

                    var errorFunc = function () {
                        oViewController.setProductResultError();
                    };

                    oModel.callFunction("/getProduct", {
                        method: "GET",
                        urlParameters: oUrlparams,
                        success: successFunc,
                        error: errorFunc,
                    });
                },

                /**
                 * Calls the function import /getUmbrellaArticle
                 * @function
                 * @public
                 * @param {sap.ui.core.mvc.Controller} oViewController - Der aktuelle ViewController
                 * @param {sap.ui.model.odata.v2.ODataModel} oModel - Das aktuelle Model
                 * @param {string} sSalesPrice - the sales price
                 */
                getUmbrellaArticle: function (oViewController, oModel, sSalesPrice) {
                
                    var oUrlparams = {
                        SalesPrice: sSalesPrice                 
                    };
                    
                    var successFunc = function (oData) {
                        if (oData.getUmbrellaArticle !== undefined) {
                            oViewController.setUmbrellaArticleResult(oData.getUmbrellaArticle);
                        }
                    };

                    var errorFunc = function () {
                        oViewController.setUmbrellaArticleError();
                    };

                    oModel.callFunction("/getUmbrellaArticle", {
                        method: "GET",
                        urlParameters: oUrlparams,
                        success: successFunc,
                        error: errorFunc,
                    });
                }


            }
        );
    }
);
