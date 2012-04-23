if (window.Gui) throw new Error('window.Gui è già utilizzato');
if (window.Com) throw new Error('window.Com è già utilizzato');
if (window.Util) throw new Error('window.Util è già utilizzato');

window.Gui = {};

$(function() {
  window.onbeforeunload = function() {
    if (Com.isConnected()) Com.disconnect();
  };

  for (var module in Gui) {
    if (Gui[module]['init']) Gui[module].init();
  }

  Gui.Dialog.hide('loading');
  /* Per poter lavorare meglio sull'aspetto delle videate
  $('#story-area').show();
  return;
  //*/
  Gui.Login.show();
});
