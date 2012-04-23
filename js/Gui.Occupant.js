Gui.Occupant = (function(){

  var
    $area,
    $nick,
    $cancel,
    $apply,
    $voter,
    $scribe,

    targetRoomJid,
    targetNick;

  function init() {
    $area = $('#occupant-area');
    $nick = $('#occupant-nick');
    $cancel = $('#occupant-cancel');
    $apply = $('#occupant-apply');
    $voter = $('#occupant-voter');
    $scribe = $('#occupant-scribe');

    $cancel.bind('click', onCancelClick);
    $apply.bind('click', onApplyClick);
    $voter.add($scribe).bind('click', onCheckboxClick);
  }

  function show(roomJid, nick) {
    $nick.text(nick);
    targetRoomJid = roomJid;
    targetNick = nick;
    var room = Com.getRoom(targetRoomJid),
        occupant = room.roster[targetNick];
    if (occupant.voter) {
      $voter.addClass('checked');
    } else {
      $voter.removeClass('checked');
    }
    if (occupant.scribe) {
      $scribe.addClass('checked');
    } else {
      $scribe.removeClass('checked');
    }
    $area.show();
    Gui.Chat.hide();
  }

  function hide() {
    if (targetRoomJid)
      Gui.Chat.show(targetRoomJid);
    $area.hide();
    targetRoomJid = null;
    targetNick = null;
  }

  function onApplyClick() {
    var voter = $voter.hasClass('checked'),
        scribe = $scribe.hasClass('checked'),
        room = Com.getRoom(targetRoomJid),
        occupant = room.roster[targetNick],
        action, privilege;
    if (voter !== occupant.voter) {
      action = (voter ? Com.PrivilegeAction.grant : Com.PrivilegeAction.revoke);
      privilege = Com.Privilege.voter;
      Com.sendPrivilege(targetRoomJid, targetNick, action, privilege);
    }
    if (scribe !== occupant.scribe) {
      action = (scribe ? Com.PrivilegeAction.grant : Com.PrivilegeAction.revoke);
      privilege = Com.Privilege.scribe;
      Com.sendPrivilege(targetRoomJid, targetNick, action, privilege);
    }
    hide();
  }

  function onCancelClick() {
    hide();
  }

  function onCheckboxClick() {
    $(this).toggleClass('checked');
  }

  return {
    init : init,
    show : show,
    hide : hide
  };

})();