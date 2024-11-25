/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 zjblessons_base_Items in the list

sap.ui.require([
	"sap/ui/test/Opa5",
	"zjblessons/MasterTemplate2/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"zjblessons/MasterTemplate2/test/integration/pages/App",
	"zjblessons/MasterTemplate2/test/integration/pages/Browser",
	"zjblessons/MasterTemplate2/test/integration/pages/Master",
	"zjblessons/MasterTemplate2/test/integration/pages/Detail",
	"zjblessons/MasterTemplate2/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "zjblessons.MasterTemplate2.view."
	});

	sap.ui.require([
		"zjblessons/MasterTemplate2/test/integration/MasterJourney",
		"zjblessons/MasterTemplate2/test/integration/NavigationJourney",
		"zjblessons/MasterTemplate2/test/integration/NotFoundJourney",
		"zjblessons/MasterTemplate2/test/integration/BusyJourney"
	], function () {
		QUnit.start();
	});
});