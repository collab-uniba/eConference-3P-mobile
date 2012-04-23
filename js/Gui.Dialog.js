Gui.Dialog = (function(){

  var $dialogs = {};

  function init() {
    $('.dialog')
      .css({
          'position': 'fixed',
          'top': 0,
          'left': 0,
          'width': '100%',
          //'width': $(window).width(),
          'height': $(window).height(),
          'z-index': '99999'
        })
      .find('div').each(function() {
          var $this = $(this);
          $this.css({
            'position': 'relative',
            'top': (($(window).height() - $this.outerHeight()) / 2) + 'px'
            //'left': (($(window).width() - $this.outerWidth()) / 2) + 'px'
          });
        })
        .end()
      .find('button').click(function() {
          $(this).closest('.dialog').hide();
        });

    $dialogs.loading = $('#loading-dialog');
    $dialogs.connecting = $('#connecting-dialog');
    $dialogs.disconnecting = $('#disconnecting-dialog');
  }

  function show(dialog) {
    if (dialog in $dialogs) {
      $dialogs[dialog].show();
    } else {
      throw 'Dialog not defined.';
    }
  }

  function hide(dialog) {
    if (dialog) {
      if (dialog in $dialogs) {
        $dialogs[dialog].hide();
      } else {
        throw 'Dialog not defined.';
      }
    } else {
      for (dialog in $dialogs) $dialogs[dialog].hide();
    }
  }



  return {
    init : init,
    show : show,
    hide : hide
  };

})();