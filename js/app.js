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
      city: ""
    };
    self.searchBox = "";
    self.displayedItems = model.items;
    self.customers = model.customers;
    self.items = model.items;

    // Loops through items in list and if it matches what's in the search bar
    // it will display the item
    self.search = function() {
      console.log(self.searchBox);
      if (self.searchBox == " ") {
        self.displayedItems = model.items;
      } else {
        self.displayedItems = [];
        for (i = 0, len = self.items.length; i < len; i++) {
          if (self.items[i].description.toLowerCase().includes(self.searchBox.toLowerCase())) {
            self.displayedItems.push(self.items[i]);
          }
        }
      }
    };

    // Displays the list of shops that can be accessed
    self.showList = function(customer) {
      if (customer.show === false) {
        customer.show = true;
      } else {
        customer.show = false;
      }
    };

    // Loads all the saved data from previous orders
    // of a branch
    self.listClick = function(data) {
      for (i = 0, len = self.customers.length; i < len; i++) {
        self.customers[i].show = false;
      }
      self.selectedBranch.name = data.name;
      self.selectedBranch.short = data.short;
      self.selectedBranch.acc = data.acc;
      self.selectedBranch.address = data.address;
      self.selectedBranch.city = data.city;
      $('html, body').animate({ scrollTop: 0 }, 'fast');
    };

    // Grabs all data required and proceeds with a print preview
    self.printPreview = function(app) {
      // Prevents the user from creating packing slips if there are no
      // customer or items selected
      var total = 0;
      for (i = 0, len = self.items.length; i < len; i++) {
        total += self.items[i].ordered;
      }
      if (self.selectedBranch.name === "") {
        alert("Please select a customer before you print");
      } else if (total === 0) {
        alert("Your customers order cannot have no items");
      } else {
        buildPackingSlips(app);
      }
    };
  });
})();
