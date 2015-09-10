// Hides the loading gif on load of the application
$(window).ready(function() {
  $("#loading").hide();
  adjustCheckoutSize();
});

$(window).resize(function() {
  adjustCheckoutSize();
});

var adjustCheckoutSize = function() {
  $("#checkoutItems").css("height", $("#checkout").height() - $("#checkoutHeader").height());
};
