(function() {
  var app = angular.module("app", []);
  Parse.initialize("p45yej86tibQrsfKYCcj6UmNw4o7b6kxtsobZnmA", "fXSkEhDGakCYnVv5OOdAfWDmjAuQvlnFI5KOwIUO");

  app.controller("appCtrl", function($scope, $compile) {
    var self = this;

    // Login variables
    self.userName = "";
    self.password = "";
    var currentUser = Parse.User.current();
    if (currentUser) {
      self.access = true;
      self.name = currentUser.attributes.firstName;
    } else {
      self.access = false;
      self.name = "";
    }

    // Application variables
    self.selectedBranch = {
      name: "",
      short: "",
      acc: "",
      address: "",
      city: "",
      shippingComment: ""
    };
    self.notes = "";
    self.searchBox = "";
    self.backOrder = false;
    self.orderNo = "";
    self.date = new Date();
    self.checkoutItems = [];
    self.customers = model.customers;
    self.items = model.items;
    self.displayedItems = self.items;

    // Function to log the user in so they can use the program
    self.login = function() {
      $("#loading").show();
      Parse.User.logIn(self.userName, self.password, {
        success: function(user) {
          $("#loading").hide();
          self.name = user.attributes.firstName;
          self.access = true;
          $scope.$apply();
        },
        error: function(user, error) {
          $("#loading").hide();
          // The login failed. Check error to see why.
          alert("Sorry the username or password may be wrong, please try again");
        }
      });
    };

    // Function to log the user out of applciation for security
    self.logout = function() {
      Parse.User.logOut();
      self.access = false;
    };

    // Loops through items in list and if it matches what's in the search bar
    // it will display the item
    self.search = function() {
      if (self.searchBox == " ") {
        self.displayedItems = self.items;
      } else {
        self.displayedItems = [];
        for (i = 0, len = self.items.length; i < len; i++) {
          if (self.items[i].description.toLowerCase().includes(self.searchBox.toLowerCase()) || self.items[i].code.toLowerCase().includes(self.searchBox.toLowerCase())) {
            self.displayedItems.push(self.items[i]);
          }
        }
      }
    };

    // Displays the list of shops that can be accessed
    self.showList = function(customer) {
      if (customer.show === false) {
        customer.show = true;
        for (i = 0, len = self.customers.length; i < len; i++) {
          if (customer !== self.customers[i]) {
            self.customers[i].show = false;
          }
        }
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
      if (data.hasOwnProperty("shippingComment")) {
        self.selectedBranch.shippingComment = data.shippingComment;
      }
      $('html, body').animate({ scrollTop: 0 }, 'fast');
    };

    // Appends data to the checkout list
    self.checkoutList = function() {
      var temp;
      for (i = 0, len = self.items.length; i < len; i++) {
        temp = $.inArray(self.items[i], self.checkoutItems);
        if (self.items[i].ordered > 0) {
          if (temp === -1) {
            self.checkoutItems.push(self.items[i]);
          }
        } else {
          if (temp > -1) {
            self.checkoutItems.splice(temp, 1);
          }
        }
      }
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
        buildPackingSlips(app, $scope);
      }
    };
  });
})();
