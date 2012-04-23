Gui.Login = (function(){

  var
    $area,
    $jid,
    $password,
    $connect;

  function init() {
    // Cerco una sola volta nel DOM gli oggetti che mi servono, e ne memorizzo
    // i riferimenti
    $area = $('#login-area');
    $jid = $('input[type=email]', $area);
    $password = $('input[type=password]', $area);
    $connect = $('button', $area);

    $connect.bind('click', onConnectClick);

    $(document)
      .bind('connected', onConnected)
      .bind('disconnected', onDisconnected)
      .bind('error', onError)
      .bind('connectionFail', onConnectionFail)
      .bind('authFail', onAuthFail);
  }

  function show() {
    $area.show();
  }

  function hide() {
    $area.hide();
  }

  function onConnectClick() {
    Gui.Dialog.show('connecting');
    var jid = $jid.val(),
        password = $password.val();
    Com.connect(jid, password);
  }

  function onConnected(e) {
    Gui.Home.show();
    hide();
    Gui.Dialog.hide('connecting');
    /*
    console.log('##############################')
    //Com.connection.muc.createInstantRoom('6667@chat.core.im');
    Com.connection.muc.join('667@chat.core.im', 'Tester');
    Com.connection.muc.groupchat('667@chat.core.im', 'hello world!');
    */
  }

  function onDisconnected(e) {
    show();
    for (var module in Gui) {
      if (module !== 'Login' && Gui[module]['hide']) Gui[module].hide();
      if (Gui[module]['reset']) Gui[module].reset();
    }
  }

  function onError(e) {
    alert('An error occurred.');
    Gui.Dialog.hide('connecting');
    show();
    for (var module in Gui) {
      if (module !== 'Login' && Gui[module]['hide']) Gui[module].hide();
      if (Gui[module]['reset']) Gui[module].reset();
    }
  }

  function onConnectionFail(e) {
    alert('Connection failed.\nMaybe it\'s a temporary thing, try again later.');
    Gui.Dialog.hide('connecting');
  }

  function onAuthFail(e) {
    alert('Authentication failed.\nCheck your username and password.');
    Gui.Dialog.hide('connecting');
  }



  return {
    init : init,
    show : show,
    hide : hide
  };

})();