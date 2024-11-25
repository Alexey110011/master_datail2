/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"zjblessons/MasterTemplate2/test/integration/NavigationJourneyPhone",
		"zjblessons/MasterTemplate2/test/integration/NotFoundJourneyPhone",
		"zjblessons/MasterTemplate2/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});