Gui.MucInvitation = (function(){

  var
    $area,
    $cancel,
    $room,
    $from,
    $accept,
    $ignore,
    $nick,

    invitationRoom;


  function init() {
    $area = $('#muc-invitation-area');
    $cancel = $('#muc-invitation-cancel');
    $from = $('#muc-invitation-from');
    $room = $('#muc-invitation-room');
    $accept = $('#muc-invitation-accept');
    $ignore = $('#muc-invitation-ignore');
    $nick = $('#muc-invitation-nick');

    $cancel.bind('click', onCancelClick);
    $accept.bind('click', onAcceptClick);
    $ignore.bind('click', onIgnoreClick);
  }

  function show(room, fromJid) {
    var from = fromJid;
    if (Com.inRoster(from)) from = Com.getContact(from).name || from;
    invitationRoom = room;
    $from.text(from);
    $room.text(room);
    $nick.val(Com.getUsername());
    $area.show();
  }

  function hide() {
    $area.hide();
  }

  function onCancelClick() {
    Gui.Home.show();
    hide();
  }

  function onAcceptClick() {
    var nick = $nick.val();
    Gui.Home.notifyInvitationHandled(invitationRoom);
    Com.joinRoom(invitationRoom, nick);
    Gui.Chat.show(invitationRoom);
    hide();
  }

  function onIgnoreClick() {
    Gui.Home.notifyInvitationHandled(invitationRoom);
    Gui.Home.show();
    hide();
  }



  return {
    init : init,
    show : show,
    hide : hide
  };

})();