Gui.Home = (function() {

  var
    $area,
    $disconnect,
    $subscribersArea,
    $subscribers,
    $rosterArea,
    $mucArea,
    $mucNew,
    $mucRooms,
    $mucEmpty,
    $new,
    $edit,
    $accept,
    $roster,

    editMode = false;


  function init() {
    $area = $('#roster-area');
    $disconnect = $('#disconnect');
    $subscribersArea = $('#subscribers');
    $subscribers = $('#subscribers ul');
    $rosterArea = $('#roster');
    $roster = $('#roster ul');
    $mucArea = $('#muc');
    $mucNew = $('#muc-new');
    $mucEmpty = $('.empty', $mucArea);
    $mucRooms = $('.list', $mucArea);
    $new = $('#roster-new');
    $edit = $('#roster-edit');
    $accept = $('#roster-accept');

    $disconnect.bind('click', onDisconnectClick);
    $subscribers.find('li').live('click', onSubscriberClick);
    $roster.find('li').live('click', onContactClick);
    $mucNew.bind('click', onNewMucClick);
    $mucRooms.find('li').live('click', onRoomClick);
    $new.bind('click', onNewClick);
    $edit.bind('click', onEditClick);
    $accept.bind('click', onAcceptClick);

    $(document)
      .bind('contactAdded', onContactAdded)
      .bind('contactChanged', onContactChanged)
      .bind('contactRemoved', onContactRemoved)
      .bind('subscriptionRequest', onSubscriptionRequest)
      .bind('roomInvite', onRoomInvite)
      .bind('roomJoined', onRoomJoined)
      .bind('roomLeft', onRoomLeft);

  }

  function reset() {
    $mucRooms.find('li').remove();
    $mucEmpty.show();
    $subscribers.find('li').remove();
    $subscribersArea.hide();
    $roster.find('li').remove();
    $roster.removeClass('edit-mode');
    editMode = false;
  }

  function show() {
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
          + (newContact.name || jid),
        newUnread = Gui.Chat.getUnreadCount(jid) || 0,
        newStatusNum = statusOrder[newContact.status];

    if (newUnread)
      newContactHtml += ' <span class="unread">'+ newUnread +'</span>';

    if (contacts.length > 0) {
      contacts.each(function() {
        var $this = $(this),
            insertBeforeThis = false,
            curJid = $this.data('jid'),
            curContact = Com.getContact(curJid),
            curUnread = Gui.Chat.getUnreadCount(curJid) || 0,
            curStatusNum = statusOrder[curContact.status];

        if (curUnread === newUnread) {
          if (curStatusNum === newStatusNum) {
            if (newContact.name < curContact.name) {
              insertBeforeThis = true;
            }
          } else if (curStatusNum > newStatusNum) {
            insertBeforeThis = true;
          }
        } else if (curUnread < newUnread) {
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

  function onContactClick() {
    var jid = $(this).data('jid');
    if (editMode) {
      Gui.Contact.show(jid);
      hide();
    } else {
      Gui.Chat.show(jid);
      hide();
    }
  }

  function onDisconnectClick() {
    Gui.Dialog.show('disconnecting');
    Com.disconnect();
  }

  function onNewClick() {
    Gui.Contact.show();
  }

  function onEditClick() {
    editMode = true;
    $rosterArea.addClass('edit-mode');
  }

  function onAcceptClick() {
    editMode = false;
    $rosterArea.removeClass('edit-mode');
  }

  function addSubscriber(jid) {
    var name;
    if (Com.inRoster(jid)) {
      name = Com.getContact(jid).name || jid;
    } else {
      name = jid;
    }
    $subscribers.append('<li id="subscription-'
      + Util.slugify(jid) + '" data-jid="'+ jid +'">'+ name);
    $subscribersArea.show();
  }

  function removeSubscriber(jid) {
    $subscribers.find('#subscription-' + Util.slugify(jid))
      .remove();
    if ($subscribers.find('li').length === 0)
      $subscribersArea.hide();
  }

  function onSubscriberClick() {
    Gui.Subscription.show($(this).data('jid'));
    hide();
  }

  function onNewMucClick() {
    Gui.MucSetup.show();
    hide();
  }

  function onRoomClick() {
    var $this = $(this);
    if ($this.hasClass('request')) {
      Gui.MucInvitation.show($this.data('room'), $this.data('from-jid'));
    } else {
      Gui.Chat.show($this.data('room'));
    }
    hide();
  }

  function addRoom(roomJid, name, fromJid, isPoker) {
    if (!name) {
      name = (Com.inRooms(roomJid)) ? Com.getRoom(roomJid).name : roomJid;
    }
    var rooms = $mucRooms.find('li'),
        inserted = false,
        newRoom = roomJid,
        newHtml = '<li id="room-' + Util.slugify(newRoom) +'" data-room="'
          + newRoom +'" ',
        newUnread = Gui.Chat.getUnreadCount(roomJid) || 0,
        newOrder = (fromJid ? 1 : 0);

    if (fromJid) {
      newHtml += 'class="request" data-from-jid="'+ fromJid +'"';
    } else {
      newHtml += 'class="chat"';
    }
    if (isPoker) {
      newHtml += ' data-poker="1"';
    }
    newHtml += '>'+ name;
    if (newUnread)
      newHtml += ' <span class="unread">'+ newUnread +'</span>';

    if (rooms.length > 0) {
      rooms.each(function() {
        var $this = $(this),
            insertBeforeThis = false,
            curRoom = $this.data('room'),
            curUnread = Gui.Chat.getUnreadCount(curRoom) || 0,
            curOrder = ($this.data('from-jid') ? 1 : 0);

        if (curOrder === newOrder) {
          if (curUnread === newUnread) {
            if (curRoom > newRoom) {
              insertBeforeThis = true;
            }
          } else if (curUnread < newUnread) {
            insertBeforeThis = true;
          }
        } else if (curOrder > newOrder) {
          insertBeforeThis = true;
        }
        if (insertBeforeThis) {
          $this.before(newHtml);
          inserted = true;
          return false;
        }
      });
    }
    if (!inserted) $mucRooms.append(newHtml);
    $mucEmpty.hide();
  }

  function removeRoom(roomJid) {
    $mucRooms.find('#room-'+ Util.slugify(roomJid)).remove();
    if ($mucRooms.find('li').length === 0)
      $mucEmpty.show();
  }

  function notifyUnreadMessage(jid) {
    if (Com.inRooms(jid)) {
      removeRoom(jid);
      addRoom(jid);
    } else {
      removeContact(jid);
      addContact(jid);
    }
  }

  function notifySubscriptionHandled(jid) {
    removeSubscriber(jid);
  }

  function notifyInvitationHandled(roomJid) {
    removeRoom(roomJid);
  }



  /*
   * Event handlers per eventi di Com
   */

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

  function onSubscriptionRequest(e, jid) {
    addSubscriber(jid);
  }

  function onRoomJoined(e, roomJid, nick) {
    if (nick === null) addRoom(roomJid);
  }

  function onRoomLeft(e, roomJid, nick) {
    if (nick === null) removeRoom(roomJid);
  }

  function onRoomInvite(e, roomJid, name, fromJid, isPoker) {
    addRoom(roomJid, name, fromJid, isPoker);
  }



  return {
    init : init,
    show : show,
    hide : hide,
    reset : reset,
    notifyUnreadMessage : notifyUnreadMessage,
    notifySubscriptionHandled : notifySubscriptionHandled,
    notifyInvitationHandled : notifyInvitationHandled
  };

})();