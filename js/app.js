(function() {
  Parse.initialize("p45yej86tibQrsfKYCcj6UmNw4o7b6kxtsobZnmA", "fXSkEhDGakCYnVv5OOdAfWDmjAuQvlnFI5KOwIUO");

  var app = angular.module("app", []);

  app.controller("appCtrl", function($scope, $compile) {
    var self = this;
    self.selectedBranch = {
      name: "",
      short: "",
      acc: "",
      address: "",
      city: "",
      selected: false
    };
    self.customers = model.customers;
    self.items = model.items;

    // Displays the list of shops that can be accessed
    self.showList = function(customer) {
      console.log(customer);
      
    };

    // Loads all the saved data from previous orders
    // of a branch
    self.listClick = function(data) {
      self.showList();
      self.selectedBranch.name = data.name;
      self.selectedBranch.short = data.short;
      self.selectedBranch.acc = data.acc;
      self.selectedBranch.address = data.address;
      self.selectedBranch.city = data.city;
      self.selectedBranch.selected = true;
    };

    // Grabs all data required and proceeds with a print preview
    self.printPreview = function(app) {
      console.log(app);

      buildPackingSlips(app);
    };
  });
})();
