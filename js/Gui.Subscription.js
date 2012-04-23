Gui.Subscription = (function(){

  var
    $area,
    $subscriber,
    $cancel,
    $approve,
    $deny,

    subscriberJid;

  function init() {
    $area = $('#subscription-area');
    $subscriber = $('#subscriber');
    $cancel = $('#subscription-cancel');
    $approve = $('#subscription-approve');
    $deny = $('#subscription-deny');

    $cancel.bind('click', onCancelClick);
    $approve.bind('click', onApproveClick);
    $deny.bind('click', onDenyClick);
  }

  function show(jid) {
    var name;
    subscriberJid = jid;
    if (Com.inRoster(jid)) {
      name = Com.getContact(jid).name || jid;
    } else {
      name = jid;
    }
    $subscriber.text(name);
    $area.show();
  }

  function hide() {
    $area.hide();
  }

  function onCancelClick() {
    hide();
    Gui.Home.show();
  }

  function onApproveClick() {
    Com.approveSubscription(subscriberJid);
    Gui.Home.notifySubscriptionHandled(subscriberJid);
    hide();
    Gui.Home.show();
  }

  function onDenyClick() {
    Com.denySubscription(subscriberJid);
    Gui.Home.notifySubscriptionHandled(subscriberJid);
    hide();
    Gui.Home.show();
  }



  return {
    init : init,
    show : show,
    hide : hide
  };

})();