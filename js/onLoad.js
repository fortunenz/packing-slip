// Hides the loading gif on load of the application
$(window).ready(function() {
  $("#loading").hide();
});

// Allows
Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});
