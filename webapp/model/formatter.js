sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
    "use strict";

    var oFloatNumberFormat2 = NumberFormat.getFloatInstance(
        {
            groupingEnabled: true,
            maxFractionDigits: 2,
            minFractionDigits: 2,
        },
        sap.ui.getCore().getConfiguration().getLocale()
    );

    var oFloatNumberFormat3 = NumberFormat.getFloatInstance(
        {
            groupingSeparator: ".",
            decimalSeparator: ",",
            groupingEnabled: true,
            maxFractionDigits: 3,
            minFractionDigits: 3,
        },
        sap.ui.getCore().getConfiguration().getLocale()
    );

    var oUnitFormat = NumberFormat.getUnitInstance({decimals:0, style:"short"});

    return {

        /**
         * Rounds the number unit value to 3 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @param {string} sUnit - The value determines whether the decimal places have 3 places or no places
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit3: function (sValue, sUnit) {
            var sReturn = "";
            var nRetrun = 0;
            if (sValue) {
                // delete thousand separator 1.000 -> 1000
                var sValueClean = sValue.replaceAll(".", "");
                //replace decimal comma by decimal point
                sValueClean = sValueClean.replaceAll(",", ".");

                if (sUnit === "KG" || sUnit === "G" || sUnit === "GRM"
                || sUnit === "LB" || sUnit === "OZ" || sUnit === "ONZ" ) {
                    nRetrun = Number(sValueClean);
                    sReturn = oFloatNumberFormat3.format(nRetrun);
                } else {
                    sReturn = oFloatNumberFormat2.format(sValueClean);
                }
            }
            return sReturn;
        },

        /**
         * Rounds the number unit value to 3 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @param {string} sUnit - The value determines whether the decimal places have 3 places or no places
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit4: function (sValue, sUnit) {
            var sReturn = "";
            var nRetrun = 0;
            if (sValue) {
                // delete thousand separator 1.000 -> 1000
                var sValueClean = sValue.replaceAll(".", "");
                //replace decimal comma by decimal point
                sValueClean = sValueClean.replaceAll(",", ".");

                if (sUnit === "KG" || sUnit === "G" || sUnit === "GRM"
                || sUnit === "LB" || sUnit === "OZ" || sUnit === "ONZ" ) {
                    nRetrun = Number(sValueClean);
                    sReturn = oFloatNumberFormat3.format(nRetrun);
                } else {
                    sReturn = oFloatNumberFormat2.format(sValueClean);
                    //replace decimal comma by decimal point
                    sReturn = sReturn.replaceAll(",", ".");
                }
            }
            return sReturn;
        },

        /**
         * Rounds the number unit value to 2 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit: function (sValue) {
            if (!sValue) {
                return "";
            }
            return parseFloat(sValue).toFixed(2);
        },

        checkDescriptionIsAvailable: function (sDescription) {
            let bVisible = false;
            if (sDescription !== "") {
                bVisible = true;
            }
            return bVisible;
        },

        formatBooleanText: function (bBoolean) {
            var sText = this.getI18nText("TXT_NO");
            if (bBoolean) {
                sText = this.getI18nText("TXT_YES");
            }
            return sText;
        },

        formatStepsUnit: function (sUnit) {
            let nSteps = 1;
            if (sUnit === "KG" || sUnit === "G" || sUnit === "GRM"
                || sUnit === "LB" || sUnit === "OZ" || sUnit === "ONZ" ) {
                nSteps = 0.05;
            }
            return nSteps;
        },

        formatStepsMinimum: function (sUnit) {
            let nMin = 1;
            if (sUnit === "KG" || sUnit === "G" || sUnit === "GRM"
                || sUnit === "LB" || sUnit === "OZ" || sUnit === "ONZ" ) {
                nMin = 0.050;
            }
            return nMin;
        },

        formatStepsValuePrecision: function (sUnit) {
            let nValuePrecision = 0;
            if (sUnit === "KG" || sUnit === "G" || sUnit === "GRM"
                || sUnit === "LB" || sUnit === "OZ" || sUnit === "ONZ" ) {
                nValuePrecision = 3;
            }
            return nValuePrecision;
        },

        formatUnit_SIC: function (sUnit) {
            return oUnitFormat.format(sUnit);
        },

        formatUnit: function (sQuantity ,sUnit) {
            
            let sValue;

            if (sUnit === "KG" || sUnit === "G" || sUnit === "GRM"
                || sUnit === "LB" || sUnit === "OZ" || sUnit === "ONZ" ) {
                sValue = sQuantity;
            }else{
                sValue = oUnitFormat.format(sQuantity);
            }            
            return sValue;
        }

    };
});
