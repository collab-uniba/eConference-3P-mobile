Com = (function() {

  var
    jid,
    username,
    roster,
    rooms,

    MeetingStatus = {started : 0, stopped : 1},
    EstimationStatus = {opened : 0, repeated : 1, closed : 2},
    PrivilegeAction = {grant : 0, revoke : 1},
    Privilege = {voter : 0, scribe : 1},

    connection;



  function reset() {
    jid = null;
    roster = null;
    rooms = null;
    connection = null;
  }

  function connect(jid, password) {
    connection = new Strophe.Connection(Com.Config.boshUrl);

    /* Debug
    //Strophe.log = function (lvl, msg) { console.log(msg); };
    connection.rawInput = function (data) {console.log("IN: " + data);};
    connection.rawOutput = function (data) {console.log("OUT: " + data);};
    //*/

    connection.connect(jid, password, onConnectionStateChange);
  }

  function disconnect() {
    if (connection) connection.disconnect();
  }

  function isConnected() {
    return (connection !== null);
  }

  function sendMessage ( jid, body ) {
    var message = $msg({to: jid, type: 'chat'})
          .c('body').t(body).up()
          .c('active', {xmlns: 'http://jabber.org/protocol/chatstates'});
    connection.send(message);
  }

  function addContact(jid, name) {
    var iq = $iq({type: "set"}).c("query", {xmlns: "jabber:iq:roster"})
        .c("item", {jid: jid, name: name});
    connection.sendIQ(iq);

    var subscribe = $pres({to: jid, type: "subscribe"});
    connection.send(subscribe);
  }

  function updateContact(jid, name) {
    var iq = $iq({type: "set"}).c("query", {xmlns: "jabber:iq:roster"})
        .c("item", {jid: jid, name: name});
    connection.sendIQ(iq);
  }

  function deleteContact(jid) {
    var iq = $iq({type: "set"}).c("query", {xmlns: "jabber:iq:roster"})
        .c("item", {jid: jid, subscription: 'remove'});
    connection.sendIQ(iq);
  }

  function approveSubscription(jid) {
    connection.send($pres({to: jid, type: 'subscribed'}));
    connection.send($pres({to: jid, type: 'subscribe'}));
  }

  function denySubscription(jid) {
    connection.send($pres({to: jid, type: 'unsubscribed'}));
  }

  function createRoom(roomJid, nick, poker, invitations) {
    // Sembra che gli XMPP Server tramutino in lower-case tutti i nomi delle stanze
    roomJid = roomJid.toLowerCase();
    sendJoinPresence(roomJid, nick);
    if (invitations) {
      for(var i in invitations) {
        // Direct invitation:
        // var message = $msg({to: invitations[i], from: connection.jid})
        //       .c('x', {xmlns: 'jabber:x:conference', jid: roomJid});
        var message = $msg({to: roomJid, from: connection.jid})
          .c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
            .c('invite', {to: invitations[i]});
        if (poker) message = message.c('reason').t('planningpoker');
        connection.send(message);
      }
    }
    rooms[roomJid] = {
      room: roomJid,
      name: Strophe.getNodeFromJid(roomJid),
      nick: nick,
      roster: [],
      rosterStartup: true
    };
    if (poker) {
      sendBacklog(roomJid, -1, []);
    }
    return roomJid;
  }

  function joinRoom(roomJid, nick) {
    sendJoinPresence(roomJid, nick);
    if (!(roomJid in rooms)) {
      rooms[roomJid] = {
        room: roomJid,
        name: Strophe.getNodeFromJid(roomJid),
        nick: nick,
        roster: [],
        rosterStartup: true
      };
    }
  }

  function leaveRoom(roomJid) {
    var nick = rooms[roomJid].nick;
    var leavePresence = $pres({to: roomJid +'/'+ nick, from: connection.jid,
          type: 'unavailable'});
    connection.send(leavePresence);
  }

  function sendRoomMessage(roomJid, message) {
    var msg =
          $msg({from: connection.jid, to: roomJid, type: 'groupchat'})
            .c('body').t(message);
    connection.send(msg);
  }

  function sendEstimate(roomJid, estimate) {
    sendSmackProperties(roomJid, {
      ExtensionName: 'card-selection',
      storyId : rooms[roomJid].story,
      cardValue : estimate,
      who : jid
    });
  }

  function sendStoryNotes(roomJid, text) {
    sendSmackProperties(roomJid, {
      ExtensionName: 'WhiteBoardChanged',
      WhiteBoardText : text,
      From : jid
    });
  }

  function sendPrivilege(roomJid, nick, action, privilege) {
    sendSmackProperties(roomJid, {
      ExtensionName: 'ChangedSpecialPrivilege',
      SpecialRole: (privilege === Privilege.voter ? 'VOTER' : 'SCRIBE'),
      RoleAction: (action === PrivilegeAction.grant ? 'GRANT' : 'REVOKE'),
      UserId: rooms[roomJid].roster[nick].jid,
      // Questa proprietà è aggiunta da me, per supportare le stanze non-anonimous
      Nick: nick
    });
  }

  function sendStoryIndex(roomJid, index) {
    var room = rooms[roomJid];
    sendCurrentAgendaItem(roomJid, index);
    sendEstimationStatus(roomJid, 'CREATED');
    sendStoryNotes(roomJid, room.backlog[index].notes);
  }

  function sendBacklog(roomJid, storyIndex, backlog) {
    var  data = '{backlog}';
    if (!storyIndex >= 0) storyIndex = -1;
    data += '{current-story}'+ storyIndex +'{/current-story}';
    for (var i in backlog) {
      data += '{story}'
              +  '{id}'+ backlog[i].id +'{/id}'
              +  '{milestone-created-on}'+ backlog[i].milestoneCreatedOn +'{/milestone-created-on}'
              +  '{milestone-id}'+ backlog[i].milestoneId +'{/milestone-id}'
              +  '{milestone-description}'+ backlog[i].milestoneDescription +'{/milestone-description}'
              +  '{story-text}'+ backlog[i].storyText +'{/story-text}'
              +  '{notes}'+ backlog[i].notes +'{/notes}'
              +  '{estimate}'+ backlog[i].estimate +'{/estimate}'
              +  '{/story}';
    }
    data += '{/backlog}';
    sendSmackProperties(roomJid, {
      ExtensionName: 'backlog',
      backlog: data
    });
  }

  function sendNewStory(roomJid, story) {
    var room = rooms[roomJid],
        newBacklog = $.extend(true, [], room.backlog);
    newBacklog.push(story);
    sendBacklog(roomJid, room.story, newBacklog);
  }

  function sendStoryUpdate(roomJid, storyIndex, story) {
    var room = rooms[roomJid],
        newBacklog = $.extend(true, [], room.backlog);
    newBacklog[storyIndex] = story;
    sendBacklog(roomJid, room.story, newBacklog);
  }

  function sendStoryDeletion(roomJid, storyIndex) {
    var room = rooms[roomJid],
        newBacklog = $.extend(true, [], room.backlog);
    delete newBacklog[storyIndex];
    sendBacklog(roomJid, room.story, newBacklog);
  }

  function sendMeetingStart(roomJid) {
    sendMeetingStatus(roomJid, 'STARTED')
  }

  function sendMeetingStop(roomJid) {
    sendMeetingStatus(roomJid, 'STOPPED')
    // Questo messaggio mi sembra di troppo, ma purtroppo eConference 3P lo
    // invia, dunque devo uniformarmi
    sendCurrentAgendaItem(roomJid, '__FREE_TALK__');
    sendCurrentAgendaItem(roomJid, -1);
  }

  function sendMeetingStatus(roomJid, status) {
    sendSmackProperties(roomJid, {
      ExtensionName: 'StatusChange',
      Status: status
    });
  }

  function sendCurrentAgendaItem(roomJid, itemId) {
    sendSmackProperties(roomJid, {
      ExtensionName: 'CurrentAgendaItem',
      ItemId: itemId
    });
  }

  function sendEstimationAssign(roomJid, estimate) {
    var room = rooms[roomJid];
    sendSmackProperties(roomJid, {
      ExtensionName: 'estimate-assigned',
      storyId: room.story,
      estimate: estimate
    });
    sendEstimationStatus(roomJid, 'CLOSED');
  }

  function sendEstimationRepeat(roomJid) {
    sendEstimationStatus(roomJid, 'REPEATED');
    sendEstimationStatus(roomJid, 'CREATED');
  }

  function sendEstimationStart(roomJid) {
    sendEstimationStatus(roomJid, 'CREATED');
  }

  function sendEstimationStatus(roomJid, status) {
    var room = rooms[roomJid],
        now = new Date(),
        date = now.getDay() +'/'+ now.getMonth() +'/'+ now.getYear();
    sendSmackProperties(roomJid, {
      ExtensionName: 'estimate-session',
      // Strano ma vero, nei pacchetti sniffatti c'era questo strano parametro
      id: date,
      storyId: room.story,
      status: status
    });
  }

  function sendSmackProperties(roomJid, properties) {
    var encodedProperties = encodeSmackProperties(properties),
        message =
          $msg({from: connection.jid, to: roomJid, type: 'groupchat'})
            .cnode(encodedProperties);
    connection.send(message);
  }

  function sendJoinPresence(roomJid, nick) {
    var joinPresence =
      $pres({to: roomJid +'/'+ nick, from: connection.jid})
        .c('x', {xmlns: 'http://jabber.org/protocol/muc'})
          // Il child 'history' serve a prelevare tutti i messaggi nella storia
          // della stanza, importante nelle sessioni planning poker: servono
          // proprio tutti i messaggi per esser certi di ricostruire
          // correttamente lo stato della sessione.
          .c('history', {since: '1970-01-01T00:00:00Z'});
    connection.send(joinPresence);
  }

  function findNickFromJid(roomJid, jid) {
    var roomData = rooms[roomJid];
    for (var nick in roomData.roster) {
      if (Strophe.getBareJidFromJid(roomData.roster[nick].jid) === jid)
        return nick;
    }
    return false;
  }

  function unserializeXml(string) {
    return string.replace(/[{}]/g,
      function(m) {return (m === '{') ? '<' : '>'} );
  }

  function getDeck(smackProperties) {
    var cardsXml = unserializeXml(smackProperties.deck),
        deck = [];
    $(cardsXml).find('card').each(function() {
      var $this = $(this);
      if (!$this.find('hidden-card').length)
        deck.push($this.find('card-value').text());
    });
    return deck;
  }

  function getBacklog(smackProperties) {
    var backlogXml = unserializeXml(smackProperties.backlog),
        $backlog = $(backlogXml),
        backlog = [],
        currentStory = +$backlog.find('current-story').text() || -1,
        counter = 0;
    $backlog.find('story').each(function() {
      var $story = $(this),
          story = {
            current : (counter === currentStory),
            id : $story.find('id').html(),
            milestoneCreatedOn : $story.find('milestone-created-on').html(),
            milestoneId : $story.find('milestone-id').html(),
            milestoneDescription : $story.find('milestone-description').html(),
            storyText : $story.find('story-text').html(),
            notes : $story.find('notes').html(),
            estimate : $story.find('estimate').html()
          };
      backlog.push(story);
    });
    return backlog;
  }

  function getSmackProperties(message) {
    var $properties = $(message).find('properties');
    if (!$properties.length) return null;

    var properties = {};
    $properties.find('property').each(function() {
      var $prop = $(this),
          name = $prop.find('name').text(),
          $value = $prop.find('value'),
          value = $value.text(),
          valueType = $value.attr('type');
      if (valueType !== 'string')
        alert('Alert in decoding Smack Properties: property type of "'+
          valueType +'" is not supported.');
      properties[name] = value;
    });
    return properties;
  }

  function encodeSmackProperties(smackProperties) {
    var xml = '<properties xmlns="http://www.jivesoftware.com/xmlns/xmpp/properties">';
    for (var prop in smackProperties) {
      xml += '<property><name>'+ prop +'</name><value type="string">'
          + smackProperties[prop] +'</value></property>';
    }
    xml += '</properties>';
    return $(xml)[0];
  }

  function resetVotes(roomJid) {
    var room = rooms[roomJid];
    for (var nick in room.roster) {
      if ('vote' in room.roster[nick]) room.roster[nick].vote = null;
    }
  }

  function enablePoker(roomJid) {
    var room = rooms[roomJid];
    if (room.isPoker) return;
    $.extend(room, {
      isPoker : true,
      meetingStatus : MeetingStatus.stopped,
      estimationStatus : EstimationStatus.closed,
      deck : ['?', '0', '1', '2', '3', '5', '8', '20', '40', '100'],
      backlog : [],
      story : -1
    });
    for(var nick in room.roster) {
      var participant = room.roster[nick];
      $.extend(participant, {
        voter : !(participant.role === 'moderator'),
        scribe : false
      });
      if (nick === room.nick && participant.voter)
        sendPrivilege(roomJid, nick, PrivilegeAction.grant, Privilege.voter);
    }
    $(document).trigger('roomIsPoker', [roomJid]);
  }



  function onConnectionStateChange(status) {
    switch (status) {
      case Strophe.Status.ERROR:
        reset();
        $(document).trigger('error');
        break;

      case Strophe.Status.CONNFAIL:
        reset();
        $(document).trigger('connectionFail');
        break;

      case Strophe.Status.AUTHFAIL:
        reset();
        $(document).trigger('authFail');
        break;

      case Strophe.Status.CONNECTED:
        var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
        jid = Strophe.getBareJidFromJid(connection.jid);
        username = Strophe.getNodeFromJid(connection.jid);
        rooms = {};
        connection.sendIQ(iq, onRoster);
        connection.addHandler(onRosterChanged,
          'jabber:iq:roster', 'iq', 'set');
        connection.addHandler(onPresence, null, 'presence');
        connection.addHandler(onMessage, null, 'message');
        $(document).trigger('connected');
        break;

      case Strophe.Status.DISCONNECTED:
        $(document).trigger('disconnected');
        reset();
        break;
    }
  }

  function onRoster(iq) {
    roster = {};
    $(iq).find('item').each(function () {
      var $this = $(this),
          jid = $this.attr('jid'),
          name = $this.attr('name') || '';
      roster[jid] = {
        jid: jid,
        name: name,
        username: Strophe.getNodeFromJid(jid),
        status: 'unavailable'
      };
      $(document).trigger('contactAdded', jid);
    });
    connection.send($pres());
  }

  function onRosterChanged (iq) {
    $(iq).find('item').each(function () {
      var sub = $(this).attr('subscription'),
          jid = $(this).attr('jid'),
          name = $(this).attr('name') || '';

      if (sub === 'remove') {
        delete roster[jid];
        $(document).trigger('contactRemoved', jid);
      } else if (jid in roster) {
        roster[jid].name = name;
        $(document).trigger('contactChanged', jid);
      } else {
        roster[jid] = {jid: jid, name: name,
          username: Strophe.getNodeFromJid(jid), status: 'unavailable'};
        $(document).trigger('contactAdded', jid);
      }

    });

    return true;
  }

  function onPresence(presence) {
    if ($(presence).find('[xmlns="http://jabber.org/protocol/muc#user"]').length) {
      onRoomPresence(presence);
    } else {
      onRegularPresence(presence);
    }
    return true;
  }

  function onRegularPresence(presence) {
    var $presence = $(presence),
        ptype = $presence.attr('type'),
        jid = Strophe.getBareJidFromJid($presence.attr('from'));

    switch (ptype) {
      case 'error':
        break;
      case 'subscribe':
        $(document).trigger('subscriptionRequest', jid);
        break;
      case 'unsubscribe':
      case 'unsubscribed':
      case 'unavailable':
        if (!(jid in roster)) break;
        if (roster[jid].status !== 'unavailable') {
          roster[jid].status = 'unavailable';
          $(document).trigger('contactChanged', jid);
        }
        break;
      default:
        if (!(jid in roster)) break;
        roster[jid].status = $(presence).find('show').text() || 'chat';
        $(document).trigger('contactChanged', jid);
    }
  }

  function onRoomPresence(presence) {
    var $presence = $(presence),
        type = $presence.attr('type'),
        occupantJid = $presence.attr('from'),
        roomJid = Strophe.getBareJidFromJid(occupantJid),
        room = rooms[roomJid],
        nick = Strophe.getResourceFromJid(occupantJid);
    if (type === 'unavailable') {
      if (nick === room.nick) {
        delete rooms[roomJid];
        nick = null;
      } else {
        delete room.roster[nick];
      }
      $(document).trigger('roomLeft', [roomJid, nick]);
    } else {
      var $item = $presence.find('item'),
          jid = $item.attr('jid') || '',
          affiliation = $item.attr('affiliation'),
          role = $item.attr('role');
      room.roster[nick] = {
        jid: jid,
        nick: nick,
        affiliation: affiliation,
        role: role
      };
      if (room.isPoker) {
        $.extend(room.roster[nick], {
          voter : !(role === 'moderator'),
          scribe : false
        });
      }
      if (nick === room.nick) {
        // Quando ricevo la mia stessa presenza, significa che la stanza ha
        // finito di inviarmi le presenze dei partecipanti
        room.rosterStartup = false;
        // Se non sono il moderatore allora sono un voter, ma devo dichiararlo
        // agli altri
        if (room.roster[nick].voter) {
          Com.sendPrivilege(roomJid, nick, Com.PrivilegeAction.grant, 'voter');
        }
        nick = null;
      }
      if (! rooms[roomJid].rosterStartup)
        $(document).trigger('roomJoined', [roomJid, nick]);
    }
  }

  function onMessage(message) {
    var $message = $(message),
        type = $message.attr('type');
    switch(type) {
      case 'chat':
        onChatMessage(message);
        break;
      case 'groupchat':
        onRoomMessage(message);
        break;
      default:
        if ($message.find('x[xmlns="http://jabber.org/protocol/muc#user"]').length) {
          onMediatedInvitationMessage(message);
        } else if ($message.find('x[xmlns="jabber:x:conference"]').length) {
          onDirectInvitationMessage(message);
        }
    }
    return true;
  }

  function onChatMessage(message) {
    var $message = $(message),
        fullJid = $message.attr('from'),
        jid = Strophe.getBareJidFromJid(fullJid),
        body = $message.find('body');
    if (body.length) {
      body = body.text();
      $(document).trigger('message', [jid, body]);
    }
  }

  function onRoomMessage(message) {
    var $message = $(message),
        occupantJid = $message.attr('from'),
        roomJid = Strophe.getBareJidFromJid(occupantJid),
        nick = Strophe.getResourceFromJid(occupantJid),
        smackProperties = getSmackProperties($message),
        body = $message.find('body').text();
    if (smackProperties) onSmackProperties(smackProperties, roomJid, nick);
    if (body) $(document).trigger('roomMessage', [roomJid, nick, body]);
  }

  function onDirectInvitationMessage(message) {
    var $message = $(message),
        jid = Strophe.getBareJidFromJid($message.attr('from')),
        $x = $message.find('x'),
        roomJid = $x.attr('jid'),
        roomId = Strophe.getResourceFromJid(roomJid);
    $(document).trigger('roomInvite', [roomJid, roomId, jid]);
  }

  function onMediatedInvitationMessage(message) {
    var $message = $(message),
        roomJid = Strophe.getBareJidFromJid($message.attr('from')),
        roomId = Strophe.getNodeFromJid(roomJid),
        $invite = $message.find('> x > invite'),
        jid = Strophe.getBareJidFromJid($invite.attr('from')),
        reason = $invite.find('reason').text(),
        isPoker = (reason === 'planningpoker');
    $(document).trigger('roomInvite', [roomJid, roomId, jid, isPoker]);
  }

  function onMeetingStatus(properties, roomJid, fromNick) {
    var roomData = rooms[roomJid];
    switch (properties.Status) {
      case 'STARTED':
        if (roomData.meetingStatus !== MeetingStatus.started) {
          roomData.meetingStatus = MeetingStatus.started;
          $(document).trigger('meetingStatus',
            [roomJid, fromNick, MeetingStatus.started]);
        }
        break;
      case 'STOPPED':
        if (roomData.meetingStatus !== MeetingStatus.stopped) {
          roomData.meetingStatus = MeetingStatus.stopped;
          $(document).trigger('meetingStatus',
            [roomJid, fromNick, MeetingStatus.stopped]);
        }
        break;
    }
  }

  function onDeck(properties, roomJid, fromNick) {
    var room = rooms[roomJid],
        deck = getDeck(properties);
    if (!Util.equal(room.deck, deck)) {
      room.deck = deck;
      $(document).trigger('deck', [roomJid, fromNick]);
    }
  }

  function onBacklog(properties, roomJid, fromNick) {
    var roomData = rooms[roomJid],
        backlog = getBacklog(properties);
    if (!Util.equal(roomData.backlog, backlog)) {
      roomData.backlog = backlog;
      $(document).trigger('backlog', [roomJid, fromNick]);
    }
  }

  function onStoryNotes(properties, roomJid, fromNick) {
    var room = rooms[roomJid],
        notes = properties.WhiteBoardText;
    if (room.story > -1) {
      var story = room.backlog[room.story];
      if (story.notes !== notes) {
        story.notes = notes;
        $(document).trigger('storyNotes', [roomJid, fromNick]);
      }
    }
  }

  function onStoryIndex(properties, roomJid, fromNick) {
    var roomData = rooms[roomJid],
        index = properties.ItemId;
    // Index potrebbe essere uguale a "__FREE_TALK__"
    index = Util.isNumber(index) ? +index : -1;
    if (roomData.story !== index) {
      roomData.story = index;
      $(document).trigger('storyIndex', [roomJid, fromNick]);
    }
  }

  function onEstimationSession(properties, roomJid, fromNick) {
    var room = rooms[roomJid];
    resetVotes(roomJid);
    switch (properties.status) {
      case 'CREATED':
        if (room.estimationStatus !== EstimationStatus.opened) {
          room.estimationStatus = EstimationStatus.opened;
          $(document).trigger('estimationStatus',
            [roomJid, fromNick, EstimationStatus.opened]);
        }
        break;
      case 'CLOSED':
        if (room.estimationStatus !== EstimationStatus.closed) {
          room.estimationStatus = EstimationStatus.closed;
          $(document).trigger('estimationStatus',
            [roomJid, fromNick, EstimationStatus.closed]);
        }
        break;
      case 'REPEATED':
        for (var nick in room.roster) {
          if ('vote' in room.roster[nick]) room.roster[nick].vote = null;
        }
        $(document).trigger('estimationResetted', [roomJid, fromNick]);
        break;
    }

  }

  function onEstimateAssigned(properties, roomJid, fromNick) {
    var roomData = rooms[roomJid];
    roomData.backlog[roomData.story].estimate = properties.estimate;
    $(document).trigger('estimateAssigned', [roomJid, fromNick]);
  }

  function onCardSelection(properties, roomJid, fromNick) {
    var room = rooms[roomJid],
        occupant = room.roster[fromNick],
        occupantVote = occupant.vote;
    if (occupantVote !== properties.cardValue) {
      occupant.vote = properties.cardValue;
      if (!occupantVote) {
        $(document).trigger('estimate', [roomJid, fromNick]);
        var roster = room.roster,
            everyoneVoted = true,
            nick
        for (nick in roster) {
          if (roster[nick].voter && !roster[nick].vote) {
            everyoneVoted = false;
            break;
          }
        }
        if (everyoneVoted) {
          room.estimationStatus = EstimationStatus.closed;
          $(document).trigger('estimationCompleted', [roomJid]);
        }
      } else {
        $(document).trigger('estimateChanged', [roomJid, fromNick]);
      }
    }
  }

  function onPrivilege(properties, roomJid, fromNick) {
    var roomData = rooms[roomJid],
        toNick = properties.Nick;
    if (!toNick) {
      // La proprietà "Nick" è stata inventata da me, e non era inizialmente
      // prevista in eConference 3P. Il funzionamento originale prevedeva l'uso
      // della proprietà "UserId" contenente il jid dell'utente modificato.
      // Questo però creava problemi nelle stanze Semi-Anonymous, in cui solo
      // il moderatore conosce i jid degli occupanti: i partecipanti conoscono
      // invece solo i nick, e dunque non possono sapere a chi si riferisce lo
      // jid in "UserId". Se la stanza non è Semi-Anonymous, allora posso
      // ricavare il nick cercando "UserId" tra i jid nel roster.
      toNick = findNickFromJid(roomJid, properties.UserId);
    }
    if (toNick) {
      var occupant = roomData.roster[toNick],
          action = (properties.RoleAction === 'GRANT' ?
            PrivilegeAction.grant : PrivilegeAction.revoke),
          memberName = properties.SpecialRole.toLowerCase(),
          memberValue = (action === PrivilegeAction.grant),
          privilege = (memberName === 'voter' ?
            Privilege.voter : Privilege.scribe);
      if (occupant[memberName] !== memberValue) {
        occupant[memberName] = memberValue;
        // Se è stato assegnato il privilegio voter, inizializzo il voto
        if (memberName === 'voter' && memberValue === true)
          occupant.vote = null;
        $(document).trigger('privilege',
              [roomJid, fromNick, toNick, action, privilege]);
      }
    }
  }

  function onSmackProperties(properties, roomJid, fromNick) {
    enablePoker(roomJid);

    switch(properties.ExtensionName) {

      case 'StatusChange':
        onMeetingStatus(properties, roomJid, fromNick);
        break;

      case 'deck':
        onDeck(properties, roomJid, fromNick);
        break;

      case 'backlog':
        onBacklog(properties, roomJid, fromNick);
        break;

      case 'WhiteBoardChanged':
        onStoryNotes(properties, roomJid, fromNick);
        break;

      case 'CurrentAgendaItem':
        onStoryIndex(properties, roomJid, fromNick);
        break;

      case 'estimate-session':
        onEstimationSession(properties, roomJid, fromNick);
        break;

      case 'estimate-assigned':
        onEstimateAssigned(properties, roomJid, fromNick)
        break;

      case 'card-selection':
        onCardSelection(properties, roomJid, fromNick);
        break;

      case 'ChangedSpecialPrivilege':
        onPrivilege(properties, roomJid, fromNick);
    }
  }



  /*
   * Getters
   */

  function getJid() {
    return connection.jid;
  }
  function getRooms() {
    return rooms;
  }
  function inRooms(roomJid) {
    return (roomJid in rooms);
  }
  function getRoom(roomJid) {
    return rooms[roomJid];
  }
  function getRoster() {
    return roster;
  }
  function inRoster(jid) {
    return (jid in roster);
  }
  function getContact(jid) {
    return roster[jid];
  }
  function getUsername() {
    return username;
  }



  /*
   * Revealing
   */

  return {
    MeetingStatus : MeetingStatus,
    EstimationStatus : EstimationStatus,
    PrivilegeAction : PrivilegeAction,
    Privilege : Privilege,

    getJid : getJid,
    getUsername : getUsername,
    inRooms : inRooms,
    getRooms : getRooms,
    getRoom : getRoom,
    inRoster : inRoster,
    getRoster : getRoster,
    getContact : getContact,

    reset : reset,
    connect : connect,
    disconnect : disconnect,
    isConnected : isConnected,

    addContact : addContact,
    updateContact : updateContact,
    deleteContact : deleteContact,

    approveSubscription : approveSubscription,
    denySubscription : denySubscription,

    sendMessage : sendMessage,

    createRoom : createRoom,
    joinRoom : joinRoom,
    leaveRoom : leaveRoom,
    sendRoomMessage : sendRoomMessage,
    sendEstimate : sendEstimate,
    sendStoryNotes : sendStoryNotes,
    sendPrivilege : sendPrivilege,
    sendEstimationAssign : sendEstimationAssign,
    sendEstimationRepeat : sendEstimationRepeat,
    sendStoryIndex : sendStoryIndex,
    sendNewStory : sendNewStory,
    sendStoryUpdate : sendStoryUpdate,
    sendStoryDeletion : sendStoryDeletion,
    sendMeetingStart : sendMeetingStart,
    sendMeetingStop : sendMeetingStop
  };

})();