(function() {
  var app = angular.module("app", []);
  Parse.initialize("p45yej86tibQrsfKYCcj6UmNw4o7b6kxtsobZnmA", "fXSkEhDGakCYnVv5OOdAfWDmjAuQvlnFI5KOwIUO");

  app.controller("appCtrl", function($scope, $compile) {
    var self = this;

    // Predefine the customer directories for later server loads
    self.customers = [
      {
        "name": "Fruit World",
        "show": false,
        "array": []
      },
      {
        "name": "Supa Fruit Mart",
        "show": false,
        "array": []
      },
      {
        "name": "Taiping Trading",
        "show": false,
        "array": []
      },
      {
        "name": "Delivery",
        "show": false,
        "array": []
      },
      {
        "name": "Out of Auckland",
        "show": false,
        "array": []
      }
    ];

    // Pulls data from server for all customers
    self.loadCustomers = function() {
      var Customers = Parse.Object.extend("Customers");
      var query = new Parse.Query(Customers);
      query.limit(1000);
      query.find({
        success: function(results) {
          var customerJson;
          for (i = 0, len = results.length; i < len; i++) {
            customerJson = {
              "type": results[i].attributes.type,
              "name": results[i].attributes.name,
              "short": results[i].attributes.short,
              "acc": results[i].attributes.acc,
              "address": results[i].attributes.address,
              "city": results[i].attributes.city,
              "clicked": results[i].attributes.clicked,
              "shippingComment": results[i].attributes.shippingComment
            };
            for (j = 0; j < self.customers.length; j++) {
              if (customerJson.type == self.customers[j].name) {
                self.customers[j].array.push(customerJson);
              }
            }
          }
          for (i = 0; i < self.customers.length; i++) {
            sortByKey(self.customers[i].array, "name");
          }
          $scope.$apply();
        },
        error: function(error) {
          alert("Error: " + error.code + " " + error.message);
        }
      });
    };

    // Pulls data from server for all items
    self.loadItems = function() {
      self.items = [];
      self.displayedItems = [];
      var Items = Parse.Object.extend("Items");
      query = new Parse.Query(Items);
      query.limit(1000);
      query.find({
        success: function(results) {
          for (i = 0, len = results.length; i < len; i++) {
            self.items.push({
              "code": results[i].attributes.code,
              "description": results[i].attributes.description,
              "unit": results[i].attributes.unit,
              "quantity": results[i].attributes.quantity,
              "packaging": results[i].attributes.packaging,
              "orderAs": results[i].attributes.orderAs,
              "ordered": results[i].attributes.ordered
            });
          }
          sortByKey(self.items, "code");
          self.displayedItems = self.items;
          $scope.$apply();
        },
        error: function(error) {
          alert("Error: " + error.code + " " + error.message);
        }
      });
    };

    // Login variables
    self.userName = "";
    self.password = "";
    var currentUser = Parse.User.current();
    if (currentUser) {
      self.access = true;
      self.name = currentUser.attributes.firstName;
      self.loadCustomers();
      self.loadItems();
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

    // Function to log the user in so they can use the program
    self.login = function() {
      $("#loading").show();
      Parse.User.logIn(self.userName, self.password, {
        success: function(user) {
          $("#loading").hide();
          self.name = user.attributes.firstName;
          self.access = true;
          self.loadCustomers();
          self.loadItems();
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
      if (data.shippingComment !== undefined) {
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
