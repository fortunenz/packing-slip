(function() {
  var app = angular.module("app", []);
  Parse.initialize("p45yej86tibQrsfKYCcj6UmNw4o7b6kxtsobZnmA", "fXSkEhDGakCYnVv5OOdAfWDmjAuQvlnFI5KOwIUO");
  // Allows users to access the Orders class
  var Orders = Parse.Object.extend("Orders");

  app.controller("appCtrl", function($scope, $compile, $filter) {
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
      },
      {
        "name": "Invoice",
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
              "shippingComment": results[i].attributes.shippingComment,
              "full": results[i].attributes
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
      $scope.displayedItems = [];
      var Items = Parse.Object.extend("Items");
      query = new Parse.Query(Items);
      query.limit(1000);
      query.find({
        success: function(results) {
          for (i = 0, len = results.length; i < len; i++) {
            results[i].attributes.ordered = 0;
            self.items.push(results[i].attributes);
          }
          sortByKey(self.items, "code");
          $scope.displayedItems = self.items;
          $scope.$apply();
          stopScroll();
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
      shippingComment: "",
      full: ""
    };
    self.notes = "";
    $scope.searchBox = "";
    self.backOrder = false;
    self.orderNo = "";
    self.date = new Date();
    self.checkoutItems = [];

    // Invoice view variables
    self.invoice = false;
    self.invoiceNewCustomer = false;
    self.subTotal = 0;
    self.gst = 0;
    self.grandTotal = 0;

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

    // Loads the selected customer as the selected customer
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
      self.selectedBranch.full = data.full;
      $('html, body').animate({ scrollTop: 0 }, 'fast');
      if (self.invoice === true) {
        for (i = 0, len = self.checkoutItems.length; i < len; i++) {
          self.definePrices(self.checkoutItems[i]);
          self.priceChange(self.checkoutItems[i]);
        }
        self.defineTotalPrice();
      }
    };

    // Appends data to the checkout list
    self.checkoutList = function() {
      var temp;
      for (i = 0, len = self.items.length; i < len; i++) {
        temp = $.inArray(self.items[i], self.checkoutItems);
        if (self.items[i].ordered > 0) {
          if (temp === -1) {
            self.checkoutItems.push(self.items[i]);
            // Recalculate the prices and totals if in invoice view
            if (self.invoice === true) {
              self.definePrices(self.items[i]);
            }
          }
        } else {
          if (temp > -1) {
            self.checkoutItems.splice(temp, 1);
          }
        }
      }
      if (self.invoice === true) {
        self.defineTotalPrice();
        stopScrollInvoice();
      }
    };

    // Grabs all data required and proceeds with a print preview
    self.printPreview = function() {
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
        buildPackingSlips(self, $scope, $filter);
      }
    };

    // Loads last saved order for current customer
    self.loadData = function() {
      var orderQuery = new Parse.Query(Orders);
      orderQuery.equalTo("short", self.selectedBranch.short);
      orderQuery.descending("updatedAt");
      orderQuery.first({
        success: function(results) {
          self.notes = results.attributes.notes;
          self.backOrder = results.attributes.backOrder;
          self.orderNo = results.attributes.orderNo;
          for (i = 0, len = self.items.length; i < len; i++) {
            if (results.attributes.hasOwnProperty(self.items[i].code)) {
              self.items[i].ordered = results.attributes[self.items[i].code];
            }
          }
          self.checkoutList();
          $('html, body').animate({ scrollTop: 0 }, 'fast');

          // Applies the change to the view
          $scope.$apply();
        },
        error: function(object, error) {
          // The object was not retrieved successfully.
          // error is a Parse.Error with an error code and message.
          console.log("Unable to load last saved order");
        }
      });
    };

    // Resets the customer variables
    self.resetCustomer = function () {
      self.selectedBranch.name = "";
      self.selectedBranch.short = "";
      self.selectedBranch.acc = "";
      self.selectedBranch.address = "";
      self.selectedBranch.city = "";
      self.selectedBranch.shippingComment = "";
      self.selectedBranch.full = "";
    };

    // Reset the app
    self.resetApp = function() {
      self.resetCustomer();
      self.backOrder = false;
      self.orderNo = "";
      $scope.searchBox = "";
      self.notes = "";
      self.invoiceNewCustomer = false;
      self.date = new Date();
      for (i = 0, len = self.items.length; i < len; i++) {
        self.items[i].ordered = 0;
        self.items[i].tempPrice = 0;
        self.items[i].wrongPrice = false;
      }
      self.checkoutList();
      $scope.displayedItems = self.items;
      $('html, body').animate({ scrollTop: 0 }, 'fast');

      // Applies the change to the view
      $scope.$apply();
    };

    // Watches if the displayedItems variable changes based on searches and Resets
    // and will respond accordingly to the view
    $scope.$watch("displayedItems", function() {
      if (self.invoice === true) {
        $scope.$evalAsync(function() {
          $(".item").css("width", "150%");
        });
      }
    });

    // Watches if the search box and changes the displayed items accordingly
    // if the user searches for items
    $scope.$watch("searchBox", function() {
      if ($scope.searchBox.trim().length === 0) {
        $scope.displayedItems = self.items;
      } else {
        $scope.displayedItems = [];
        for (i = 0, len = self.items.length; i < len; i++) {
          if (self.items[i].description.toLowerCase().includes($scope.searchBox.toLowerCase()) || self.items[i].code.toLowerCase().includes($scope.searchBox.toLowerCase())) {
            $scope.displayedItems.push(self.items[i]);
          }
        }
      }
    });

    // Functions specific to invoice view
    // ------------------------------------------------------------------------

    // User changes the view to invoice or packing slip and aspects of the view
    // gets arranged
    self.changeView = function() {
      self.invoice = !self.invoice;

      self.resetCustomer();
      self.backOrder = false;
      // Close all customer tabs
      for (i = 0, len = self.customers.length; i < len; i++) {
        self.customers[i].show = false;
      }

      // If the view has been changed to invoice view do the following
      if (self.invoice === true && window.innerWidth >= 1000) {
        $("#notes").css("left", "80%");
        $("#notes").css("top", "30px");
        $("#notes").css("max-height", "100px");

        $("#mainBody").css("width", "50%");
        $(".itemList").css("position", "relative");
        $(".itemList").css("left", "-15%");
        $("nav").css("width", "100%");
        $(".item").css("width", "150%");
        // Else if view has been changed back to packing slip view do the following
      } else if (self.invoice === false && window.innerWidth >= 1000) {
        $("#notes").css("left", 0);
        $("#notes").css("top", "80px");
        $("#notes").css("max-height", "100%");

        $("#mainBody").css("left", "0");
        $("#mainBody").css("width", "100%");
        $(".itemList").css("left", "0");
        $("nav").css("width", "60%");
        $(".item").css("width", "80%");
        $("#checkoutItems").css("height", window.innerHeight - $("#checkoutHeader").height());
      }

      stopScrollInvoice();
    };

    // Modifies the prices of items in the checkout list
    self.definePrices = function(item) {
      // Checks if customer has been selected
      // if so then change the prices based on customer
      // otherwise use default prices
      if (self.selectedBranch.name !== "") {
        if (self.selectedBranch.full[item.code] !== undefined) {
          item.tempPrice = self.selectedBranch.full[item.code];
        } else {
          if (item.tempPrice === undefined) {
            if (item.price === undefined) {
              item.tempPrice = 0;
            } else {
              item.tempPrice = item.price;
            }
          }
        }
      } else {
        if (item.price === undefined) {
          item.tempPrice = 0;
        } else {
          item.tempPrice = item.price;
        }
      }

      // If the customer has not previously purchased an item using the system
      // the price will not yet be set, and therefore the user needs to be
      // alerted that they need to check the price
      if (self.selectedBranch.short !== "" && item.tempPrice !== self.selectedBranch.full[item.code]) {
        item.wrongPrice = true;
      }
    };

    // Adjusts the total price charged to customers responsively
    self.defineTotalPrice = function() {
      self.subTotal = 0;
      for (i = 0, len = self.items.length; i < len; i++) {
        if (self.items[i].ordered > 0) {
          self.subTotal += self.items[i].ordered * self.items[i].tempPrice;
        }
      }
      self.gst = self.subTotal * 0.15;
      self.grandTotal = self.subTotal * 1.15;
    };

    self.priceChange = function(tempItem) {
      if (self.selectedBranch.short !== "") {
        if (self.selectedBranch.full[tempItem.code] !== tempItem.tempPrice) {
          tempItem.wrongPrice = true;
        } else {
          tempItem.wrongPrice = false;
        }
      }
    };
  });
})();
