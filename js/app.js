(function() {
  var app = angular.module("app", ["firebase"]);

  app.controller("appCtrl", function($scope, $compile, $filter, $firebaseArray) {
    // Connects to the firebase server
    var ref = new Firebase('https://popping-torch-7294.firebaseio.com/');

    // Firebase queries ----------------------------------------------------------
    ref.onAuth(function(authData) {
      $scope.access = false;
      if (authData) {
        $scope.access = true;
        $scope.name = getName(authData);
        $scope.customers = [
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
        // Loads customers from server and appends them into the correct array
        ref.child("customers").on("value", function(snapshot) {
          var results = snapshot.val();
          // Predefine the customer directories for later server loads
          for (i = 0, len = results.length; i < len; i++) {
            for (j = 0; j < $scope.customers.length; j++) {
              if (results[i].type == $scope.customers[j].name) {
                $scope.customers[j].array.push(results[i]);
              }
            }
          }
          for (i = 0; i < $scope.customers.length; i++) {
            sortByKey($scope.customers[i].array, "name");
          }
          $scope.$apply();
        });

        ref.child("items").on("value", function(snapshot) {
          $scope.items = snapshot.val();
          for (var i = 0, len = $scope.items.length; i < len; i++) {
            $scope.items[i].ordered = 0;
          }
          sortByKey($scope.items, "code");
          $scope.displayedItems = $scope.items;
          $scope.$apply();
          stopScroll();
        });

        ref.child("slipNumber").on("value", function(snapshot) {
          $scope.slipNumber = snapshot.val();
        });
      } else {
        console.log("Client unauthenticated.")
      }
    });

    // find a suitable name based on the meta info given by each provider
    function getName(authData) {
      switch(authData.provider) {
         case 'password':
           return authData.password.email.replace(/@.*/, '');
         case 'twitter':
           return authData.twitter.displayName;
         case 'facebook':
           return authData.facebook.displayName;
      }
    }

    var self = this;

    // Login variables
    $scope.userName = "";
    $scope.password = "";

    // Application variables
    $scope.selectedCustomer = {};
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
      ref.authWithPassword({
        email    : $scope.userName,
        password : self.password
      }, function(error, authData) {
        if (error) {
          console.log("Login Failed!", error);
          $("#loading").hide();
          alert("Sorry the username or password may be wrong, please try again");
        } else {
          console.log("Authenticated successfully with payload:", authData);
          $scope.access = true;
          $("#loading").hide();
          $scope.$apply();
        }
      }, {
        remember: "default"
      });
    };

    // Function to log the user out of applciation for security
    self.logout = function() {
      ref.unauth();
      $scope.userName = "";
      $scope.access = false;
    };

    // Displays the list of shops that can be accessed
    self.showList = function(customer) {
      if (customer.show === false) {
        customer.show = true;
        for (i = 0, len = $scope.customers.length; i < len; i++) {
          if (customer !== $scope.customers[i]) {
            $scope.customers[i].show = false;
          }
        }
      } else {
        customer.show = false;
      }
    };

    // Loads the selected customer as the selected customer
    self.listClick = function(data) {
      for (i = 0, len = $scope.customers.length; i < len; i++) {
        $scope.customers[i].show = false;
      }
      $scope.selectedCustomer = data;
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
      for (i = 0, len = $scope.items.length; i < len; i++) {
        temp = $.inArray($scope.items[i], self.checkoutItems);
        if ($scope.items[i].ordered > 0) {
          if (temp === -1) {
            self.checkoutItems.push($scope.items[i]);
            // Recalculate the prices and totals if in invoice view
            if (self.invoice === true) {
              self.definePrices($scope.items[i]);
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
      for (i = 0, len = $scope.items.length; i < len; i++) {
        total += $scope.items[i].ordered;
      }
      if ($scope.selectedCustomer.name === "") {
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
      orderQuery.equalTo("short", $scope.selectedCustomer.short);
      orderQuery.descending("updatedAt");
      orderQuery.first({
        success: function(results) {
          self.notes = results.attributes.notes;
          self.backOrder = results.attributes.backOrder;
          self.orderNo = results.attributes.orderNo;
          for (i = 0, len = $scope.items.length; i < len; i++) {
            if (results.attributes.hasOwnProperty($scope.items[i].code)) {
              $scope.items[i].ordered = results.attributes[$scope.items[i].code];
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
      $scope.selectedCustomer = {};
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
      for (i = 0, len = $scope.items.length; i < len; i++) {
        $scope.items[i].ordered = 0;
        $scope.items[i].tempPrice = 0;
        $scope.items[i].wrongPrice = false;
      }
      self.checkoutList();
      $scope.displayedItems = $scope.items;
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
        $scope.displayedItems = $scope.items;
      } else {
        $scope.displayedItems = [];
        for (i = 0, len = $scope.items.length; i < len; i++) {
          if ($scope.items[i].description.toLowerCase().includes($scope.searchBox.toLowerCase()) || $scope.items[i].code.toLowerCase().includes($scope.searchBox.toLowerCase())) {
            $scope.displayedItems.push($scope.items[i]);
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
      for (i = 0, len = $scope.customers.length; i < len; i++) {
        $scope.customers[i].show = false;
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
      if ($scope.selectedCustomer.name !== undefined) {
        if ($scope.selectedCustomer[item.code] !== undefined) {
          item.tempPrice = $scope.selectedCustomer[item.code];
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
      if ($scope.selectedCustomer.short !== undefined && item.tempPrice !== $scope.selectedCustomer[item.code]) {
        item.wrongPrice = true;
      }
    };

    // Adjusts the total price charged to customers responsively
    self.defineTotalPrice = function() {
      self.subTotal = 0;
      for (i = 0, len = $scope.items.length; i < len; i++) {
        if ($scope.items[i].ordered > 0) {
          self.subTotal += $scope.items[i].ordered * $scope.items[i].tempPrice;
        }
      }
      self.gst = self.subTotal * 0.15;
      self.grandTotal = self.subTotal * 1.15;
    };

    self.priceChange = function(tempItem) {
      if ($scope.selectedCustomer !== undefined) {
        if ($scope.selectedCustomer[tempItem.code] !== tempItem.tempPrice) {
          tempItem.wrongPrice = true;
        } else {
          tempItem.wrongPrice = false;
        }
      }
    };
  });
})();
