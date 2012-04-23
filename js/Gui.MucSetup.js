Gui.MucSetup = (function(){

  var
    $area,
    $cancel,
    $ok,
    $name,
    $service,
    $poker,
    $nick,
    $roster;


  function init() {
    $area = $('#muc-setup-area');
    $cancel = $('#muc-setup-cancel');
    $ok = $('#muc-setup-ok');
    $name = $('#muc-setup-name');
    $service = $('#muc-setup-service');
    $poker = $('#muc-setup-poker');
    $nick = $('#muc-setup-nick');
    $roster = $('.list', $area);

    $cancel.bind('click', onCancelClick);
    $ok.bind('click', onOkClick);
    $poker.bind('click', onPokerClick);
    $roster.find('li').live('click', onContactClick);

    $(document)
      .bind('contactAdded', onContactAdded)
      .bind('contactChanged', onContactChanged)
      .bind('contactRemoved', onContactRemoved);
  }

  function reset() {
    $roster.find('li').remove();
  }

  function show() {
    $nick.val(Com.getUsername());
    $name.val('group_chat');
    $roster.find('li').add($poker).removeClass('checked');
    $area.show();
  }

  function hide() {
    $area.hide();
  }

  function addContact(jid) {
    var contacts = $roster.find('li'),
        statusOrder = {'chat' : 0, 'away' : 1, 'xa' : 2, 'dnd' : 3,
          'unavailable' : 4},
        inserted = false,
        newContact = Com.getContact(jid),
        newContactHtml = '<li id="contact-' + Util.slugify(jid)
          + '" data-jid="'+ jid +'" class="'+ newContact.status +'">'
          + '<span></span>'+ (newContact.name || jid),
        newStatusNum = statusOrder[newContact.status];

    if (contacts.length > 0) {
      contacts.each(function() {
        var $this = $(this),
            insertBeforeThis = false,
            curJid = $this.data('jid'),
            curContact = Com.getContact(curJid),
            curStatusNum = statusOrder[curContact.status];

        if (curStatusNum === newStatusNum) {
          if (newContact.name < curContact.name) {
            insertBeforeThis = true;
          }
        } else if (curStatusNum > newStatusNum) {
          insertBeforeThis = true;
        }
        if (insertBeforeThis) {
          $this.before(newContactHtml);
          inserted = true;
          return false;
        }
      });
    }
    if (!inserted) $roster.append(newContactHtml);
  }

  function removeContact(jid) {
    $roster.find('#contact-' + Util.slugify(jid)).remove();
  }

  function onPokerClick() {
    $(this).toggleClass('checked');
  }

  function onContactClick() {
    $(this).toggleClass('checked');
  }

  function onCancelClick() {
    Gui.Home.show();
    hide();
  }

  function onOkClick() {
    var roomJid = $name.val().toLowerCase() + '@' + $service.val(),
        poker = $poker.hasClass('checked'),
        nick = $nick.val(),
        participants = [];
    $roster.find('li.checked').each(function() {
      participants.push($(this).data('jid'));
    });
    var room = Com.createRoom(roomJid, nick, poker, participants);
    Gui.Chat.show(room);
    hide();
  }


  function onContactAdded(e, jid) {
    addContact(jid);
  }

  function onContactChanged(e, jid) {
    removeContact(jid);
    addContact(jid);
  }

  function onContactRemoved(e, jid) {
    removeContact(jid);
  }



  return {
    init : init,
    reset : reset,
    show : show,
    hide : hide
  };

})();