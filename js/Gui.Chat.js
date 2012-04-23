Gui.Chat = (function(){

  var
    $prototype,
    areaQuery = '.chat-area',
    // Esprimere le query seguenti come RELATIVE all'area della chat.
    // In questo modo possono essere utilizzate sia concatenandole ad _areaQuery,
    // sia concatenandole all'id di una chat specifica
    titleQuery = '.chat-title',
    hideQuery = '.chat-hide',
    leaveQuery = '.chat-leave',
    sendQuery = '.chat-send',

    tabsQuery = 'nav',
    showMessagesQuery = '.chat-show-messages',
    showUsersQuery = '.chat-show-users',
    showStoriesQuery = '.chat-show-stories',
    showDeckQuery = '.chat-show-deck',

    logsAreaQuery = '.chat-logs',
    logColorsCount = 5,
    inputQuery = '.chat-logs input',

    usersAreaQuery = '.chat-users',
    usersQuery = '.chat-users ul',

    storiesAreaQuery = '.chat-stories',
    currentStoryQuery = '.chat-current-story',
    currentStoryTextQuery = '.chat-current-story-text',
    currentStoryInfoQuery = '.chat-current-story-info',
    currentStoryNotesQuery = '.chat-current-story-notes',
    storiesQuery = '.chat-stories ul',
    noStoriesQuery = '.chat-no-stories',
    newStoryQuery = '.chat-new-story',
    editStoriesQuery = '.chat-edit-stories',
    stopEditingStoriesQuery = '.chat-stop-editing-stories',
    changeMeetingStatus = '.chat-change-meeting-status',

    deckAreaQuery = '.chat-deck',
    deckCardsQuery = '.chat-deck-cards',

    estimatesAreaQuery = '.chat-estimates',
    estimatesQuery = '.chat-estimates ul',
    finalEstimateQuery = '.chat-final-estimate',
    approveEstimationQuery = '.chat-approve-estimation',
    repeatEstimationQuery = '.chat-repeat-estimation',

    inputDefaultText = 'type a message',

    openedChat,
    chats = {};


  function init() {
    $prototype = $('#chat-area-prototype');
    $(document)
      .bind('message', onMessage)
      .bind('roomMessage', onRoomMessage)
      .bind('roomJoined', onJoin)
      .bind('roomLeft', onLeave)
      .bind('roomIsPoker', onRoomIsPoker)
      .bind('meetingStatus', onMeetingStatus)
      .bind('deck', onDeck)
      .bind('backlog', onBacklog)
      .bind('storyNotes', onStoryNotes)
      .bind('storyIndex', onStoryIndex)
      .bind('estimate', onEstimate)
      .bind('estimateChanged', onEstimateChanged)
      .bind('estimateAssigned', onEstimateAssigned)
      .bind('estimationCompleted', onEstimationCompleted)
      .bind('estimationStatus', onEstimationStatus)
      .bind('estimationResetted', onEstimationResetted)
      .bind('privilege', onPrivilege);
  }

  function reset() {
    chats = {};
    $(areaQuery).not($prototype).remove();
  }

  function show(jid) {
    hide();
    var chat = (jid in chats) ? chats[jid] : initChat(jid);
    openedChat = jid;
    chat.$area.show();
    if (chat.unread > 0) {
      chat.unread = 0;
      Gui.Home.notifyUnreadMessage(jid);
    }
  }

  function hide() {
    $(areaQuery).hide();
    openedChat = null;
  }

  function getUnreadCount(jid) {
    return (jid in chats) ? chats[jid].unread : null;
  }



  /*
   * Funzioni di servizio interne
   */

  function initChat(jid) {
    var $area = $prototype.clone(),
        areaId = 'chat-area-'+ Util.slugify(jid),
        data = {
          jid : jid,
          $area : $area,
          isRoom : Com.inRooms(jid),
          isPoker : false,
          unread : 0,
          lastMessageFrom : null
        };
    $area
      .attr({'id' : areaId, 'data-jid' : jid})
      .find(inputQuery)
        .val(inputDefaultText)
        .bind('focus', onInputFocus)
        .bind('blur', onInputBlur)
        .bind('keypress', onInputKeyPress)
        .end()
      .find(sendQuery)
        .bind('click', onSendClick)
        .end()
      .find(hideQuery)
        .bind('click', onHideClick)
        .end()
      .find(leaveQuery)
        .bind('click', onLeaveClick)
        .end();
    if (data.isRoom) {
      $.extend(data, {colors: [], nextColor: 0});
      $area
        .addClass('muc')
        .find(titleQuery)
          .text(Com.getRoom(jid).name);
    } else {
      $area
        .find(titleQuery)
          .text(Com.getContact(jid).name || Com.getContact(jid).username);
    }
    $area.appendTo('body');
    data.$log = $area.find(logsAreaQuery + ' ul');
    chats[jid] = data;
    return data;
  }

  function enablePoker(chat) {
    if (chat.isPoker) return;
    chat.isPoker = true;
    chat.editingStories = false;
    chat.$area
      .find(tabsQuery)
        .show()
        .end()
      .find(showMessagesQuery)
        .bind('click', onShowMessagesClick)
        .end()
      .find(showUsersQuery)
        .bind('click', onShowUsersClick)
        .end()
      .find(showStoriesQuery)
        .bind('click', onShowStoriesClick)
        .end()
      .find(currentStoryNotesQuery)
        .bind('keypress', onCurrentStoryNotesKeypress)
        .bind('blur', onCurrentStoryNotesBlur)
        .end()
      .find(showDeckQuery)
        .bind('click', onShowDeckClick)
        .end();
    refreshDeck(chat);
    var room = Com.getRoom(chat.jid),
        roster = room.roster,
        nick,
        me = room.roster[room.nick];
    for(nick in roster) {
      removeOccupant(chat, nick);
      addOccupant(chat, nick);
      if (roster[nick].voter) addVoter(chat, nick);
    }
    if (me.voter) {
      chat.$area.addClass('voter');
    }
    if (me.role === 'moderator') {
      chat.$area
        .addClass('moderator')
        .find(usersQuery + ' li')
          .live('click', onUserClick)
          .end()
        .find(currentStoryQuery)
          .bind('click', onCurrentStoryClick)
          .end()
        .find(currentStoryNotesQuery)
          .bind('click', function(e){
            // Le note si trovano all'interno di currentStoryQuery, quindi
            // bisogna evitare che venga lanciato l'evento click del genitore
            if (!e) var e = window.event;
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
          })
          .end()
        .find(storiesQuery + ' li')
          .live('click', onStoryClick)
          .end()
        .find(newStoryQuery)
          .bind('click', onNewStoryClick)
          .end()
        .find(editStoriesQuery)
          .bind('click', onEditStoriesClick)
          .end()
        .find(stopEditingStoriesQuery)
          .bind('click', onStopEditingStoriesClick)
          .end()
        .find(changeMeetingStatus)
          .bind('click', onChangeMeetingStatusClick)
          .end()
        .find(approveEstimationQuery)
          .bind('click', onApproveEstimationClick)
          .end()
        .find(repeatEstimationQuery)
          .bind('click', onRepeatEstimationClick)
          .end();
    }
  }

  function refreshDeck(chat) {
    var newDeck = '',
        deck = Com.getRoom(chat.jid).deck;
    for (var i = 0; i < deck.length; i++) {
      newDeck += '<div>'+ deck[i] +'</div>';
    }
    chat.$area
      .find(deckCardsQuery)
        .html(newDeck)
        .find('div')
          .bind('click', onCardClick);
  }

  function resetDeck(chat) {
    chat.$area.find(deckCardsQuery)
      .find('.active').removeClass('active');
  }

  function changeTab($tab, subareaQuery) {
    if (!$tab.hasClass('active')) {
      var $area = $tab.closest(areaQuery);
      $area
        .find('section')
          .hide()
          .end()
        .find(subareaQuery)
          .show()
          .end()
        .find(tabsQuery + ' .active')
          .removeClass('active');
      $tab.addClass('active');
    }
  }

  function addOccupant(chat, nick) {
    // Assegno un colore al nuovo utente
    var color;
    if (nick in chat.colors) {
      color = chat.colors[nick];
    } else {
      color = chat.nextColor;
      chat.colors[nick] = color;
      chat.nextColor++;
    }
    if (chat.nextColor === logColorsCount) chat.nextColor = 0;
    // Posiziono il nuovo partecipante nella lista dei partecipanti
    var $usersList = chat.$area.find(usersQuery),
        $users = $usersList.find('li'),
        room = Com.getRoom(chat.jid),
        user = room.roster[nick],
        roles = [],
        inserted = false,
        newUser = nick,
        newUserHtml = '<li class="user-color'+ color +'" id="chat-user-'
          + Util.slugify(chat.jid + '/' + nick) + '" data-nick="'+ nick
          + '"><strong>' + nick + '</strong>';
    if (nick === room.nick)
      newUserHtml += ' (You)';
    // Elenco i ruoli dell'utente
    if (user.role === 'moderator')
      roles.push('moderator');
    if (user.voter)
      roles.push('voter');
    if (user.scribe)
      roles.push('scribe');
    if (roles.length)
      newUserHtml += '<small>'+ roles.join(', ') +'</small>';
    // Inserisco il nuovo utente nel posto giusto, mantenendo l'ordine
    // alfabetico della lista
    if ($users.length > 0) {
      $users.each(function() {
        var $this = $(this),
            curUser = $this.data('nick');
        if (newUser < curUser) {
          $this.before(newUserHtml);
          inserted = true;
          return false;
        }
      });
    }
    if (!inserted) $usersList.append(newUserHtml);
  }

  function removeOccupant(chat, nick) {
    $('#chat-user-' + Util.slugify(chat.jid + '/' + nick)).remove();
  }

  function addVoter(chat, nick) {
    var $votersList = chat.$area.find(estimatesQuery),
        voters = $votersList.find('li'),
        inserted = false,
        newVoter = nick,
        newVoterHtml = '<li class="user-color'+ chat.colors[nick] +'" id="chat-voter-'
          + Util.slugify(chat.jid + '/' + nick) + '" data-nick="'+ nick
          + '"><strong>' + nick + '</strong><span>-</span>';
    voters.each(function() {
      var $this = $(this),
          curVoter = $this.data('nick');
      if (newVoter < curVoter) {
        $this.before(newVoterHtml);
        inserted = true;
        return false;
      }
    });
    if (!inserted) $votersList.append(newVoterHtml);
  }

  function removeVoter(chat, nick) {
    $('#chat-voter-' + Util.slugify(chat.jid + '/' + nick)).remove();
  }

  function updateVoter(chat, nick, vote) {
    $('#chat-voter-' + Util.slugify(chat.jid + '/' + nick) + ' span')
      .html(vote);
  }

  function resetVoters(chat) {
    chat.$area
      .find(estimatesQuery +' li span')
        .html('-')
      .end()
      .find(finalEstimateQuery)
        .val('');
  }

  function refreshBacklog(chat) {
    var $chatArea = chat.$area,
        room =  Com.getRoom(chat.jid),
        backlog = room.backlog,
        storiesToList = backlog.length,
        html = '';
    if (room.story === -1) {
      $chatArea.find(currentStoryQuery).hide();
    } else {
      var story = room.backlog[room.story],
          info = '<b>current story</b>, ';
      if (story.milestoneId)
        info += 'milestone ' + story.milestoneId + ', ';
      info += 'estimate ' + (story.estimate || '?');
      $chatArea
        .find(currentStoryTextQuery)
          .text(story.storyText)
          .end()
        .find(currentStoryInfoQuery)
          .html(info)
          .end()
        .find(currentStoryNotesQuery)
          .val(story.notes)
          .end()
        .find(currentStoryQuery)
          .data('index', room.story)
          .show();
      storiesToList--;
    }
    if (storiesToList > 0) {
      for (var i in backlog) {
        if (i === room.story) continue;
        html += '<li data-index="'+ i +'"><strong>' + backlog[i].storyText
             +  '</strong><small>';
        if (backlog[i]['milestone-id'])
          html += 'milestone ' + backlog[i].milestoneId +', ';
        html += 'estimate ' + (backlog[i].estimate || '?') + '</small></li>';
      }
      $chatArea
        .find(storiesQuery)
          .html(html)
          .show()
          .end()
        .find(noStoriesQuery)
          .hide();
    } else {
      $chatArea.find(storiesQuery).hide();
      if (room.story === -1) {
        $chatArea.find(noStoriesQuery).show();
      } else {
        $chatArea.find(noStoriesQuery).hide();
      }
    }
  }

  function getChatterName(chat, who) {
    var name;
    if (chat.isRoom) {
      name = (who === Com.getRoom(chat.jid).nick) ? 'You' : who;
    } else {
      if (who === Com.getJid()) {
        name = 'You';
      } else {
        name = (Com.getContact(who).name || Com.getContact(who).username);
      }
    }
    return name;
  }

  function getChatterColor(chat, who) {
    if (chat.isRoom) {
      return chat.colors[who];
    } else {
      return (who === Com.getJid()) ? 0 : 1;
    }
  }

  function log(chat, from, text) {
    var html = '<li>';
    if (chat.lastMessageFrom !== from) {
      html += '<b class="user-color'+ getChatterColor(chat, from) +'">'
           +  getChatterName(chat, from) +'</b> ';
    }
    html += text;
    chat.$log.append(html);
    chat.lastMessageFrom = from;
    if (openedChat !== chat.jid) {
      chat.unread++;
      Gui.Home.notifyUnreadMessage(chat.jid);
    }
  }

  function logInfo(chat, from, text) {
    var html = '';
    if (from) {
      html += '<li class="user-color'+ getChatterColor(chat, from) +'"><b>'
           +  getChatterName(chat, from) +'</b> ';
    } else {
      html += '<li class="user-color0">';
    }
    html += text;
    chat.$log.append(html);
    chat.lastMessageFrom = null;
    if (openedChat !== chat.jid) {
      chat.unread++;
      Gui.Home.notifyUnreadMessage(chat.jid);
    }
  }

  function refreshLog(chat) {
    var $logsArea = chat.$area.find(logsAreaQuery),
        room = Com.getRoom(chat.jid),
        storyIndex = room.story,
        logName = 'chat-log',
        $log;
    if (storyIndex > -1) logName += '-' + room.backlog[storyIndex].id;
    $log = $logsArea.find('.' + logName);
    if ($log.length){
      $log.show();
    } else {
      $log = $('<ul class="'+ logName +'"></ul>').prependTo($logsArea);
    }
    chat.$log.hide();
    chat.$log = $log;
  }



  /*
   * Event handlers degli elementi di interfaccia
   */

  function onUserClick() {
    var $this = $(this),
        roomJid = $this.closest(areaQuery).data('jid'),
        nick = $this.data('nick');
    Gui.Occupant.show(roomJid, nick);
  }

  function onCurrentStoryClick() {
    var $this = $(this),
        roomJid = $this.closest(areaQuery).data('jid'),
        chat = chats[roomJid],
        index = $this.data('index');
    if (chat.editingStories) Gui.Story.show(roomJid, index);
  }

  function onStoryClick() {
    var $this = $(this),
        roomJid = $this.closest(areaQuery).data('jid'),
        chat = chats[roomJid],
        index = $this.data('index');
    if (chat.editingStories) {
      Gui.Story.show(roomJid, index);
    } else {
      if (Com.getRoom(roomJid).meetingStatus === Com.MeetingStatus.started) {
        Com.sendStoryIndex(roomJid, index);
      } else {
        alert('You should start the meeting, first.');
      }
    }
  }

  function onEditStoriesClick() {
    var $this = $(this),
        $area = $(this).closest(areaQuery),
        roomJid = $area.data('jid'),
        chat = chats[roomJid];
    chat.editingStories = true;
    $this.hide();
    $area.find(stopEditingStoriesQuery).show();
  }

  function onStopEditingStoriesClick() {
    var $this = $(this),
        $area = $(this).closest(areaQuery),
        roomJid = $area.data('jid'),
        chat = chats[roomJid];
    chat.editingStories = false;
    $this.hide();
    $area.find(editStoriesQuery).show();
  }

  function onChangeMeetingStatusClick() {
    var roomJid = $(this).closest(areaQuery).data('jid'),
        room = Com.getRoom(roomJid);
    if (room.meetingStatus === Com.MeetingStatus.started) {
      Com.sendMeetingStop(roomJid);
    } else {
      Com.sendMeetingStart(roomJid);
    }
  }

  function onNewStoryClick() {
    var roomJid = $(this).closest(areaQuery).data('jid');
    Gui.Story.show(roomJid);
  }

  function onCurrentStoryNotesKeypress() {
    var $this = $(this);
    if (!$this.attr('readonly'))
      $this.data('changed', true);
  }

  function onCurrentStoryNotesBlur() {
    var $this = $(this);
    if ($this.data('changed')) {
      var $chatArea = $this.closest(areaQuery),
          roomJid = $chatArea.data('jid'),
          room = Com.getRoom(roomJid),
          notes = $.trim($this.val());
      if (room.backlog[room.story] !== notes)
        Com.sendStoryNotes(roomJid, notes);
      $this.data('changed', null);
    }
  }

  function onInputFocus() {
    var $this = $(this);
    if ($this.val() === inputDefaultText) $this.val('');
    $this.addClass('focus');
  }

  function onInputBlur() {
    var $this = $(this);
    if ($.trim($this.val()) === '') $this.val(inputDefaultText);
    $this.removeClass('focus');
  }

  function onInputKeyPress(e) {
    if (e.which === 13) {
      e.preventDefault();
      $(this).closest(areaQuery).find(sendQuery).click();
    }
  }

  function onSendClick() {
    var $chatArea = $(this).closest(areaQuery),
        jid = $chatArea.data('jid'),
        chat = chats[jid],
        $input = $chatArea.find('input'),
        message = $input.val();
    if (chat.isRoom) {
      Com.sendRoomMessage(jid, message);
      // Non è necessario stampare qui il messaggio, in quanto il server
      // lo reinvierà a questo client, e verrà stampato come qualunque altro
      // messaggio in arrivo
    } else {
      Com.sendMessage(jid, message);
      // I messaggi mandati ad un utente singolo non vengono reinviati al
      // mittente, quindi la sua stampa a video deve essere gestita qui
      log(chat, Com.getJid(), message);
    }
    $input.val('');
  }

  function onHideClick() {
    Gui.Home.show();
    hide();
  }

  function onLeaveClick() {
    var $area = $(this).closest(areaQuery),
        roomJid = $area.data('jid');
    Com.leaveRoom(roomJid);
    Gui.Home.show();
    hide();
  }

  function onShowMessagesClick() {
    changeTab($(this), logsAreaQuery);
  }

  function onShowUsersClick() {
    changeTab($(this), usersAreaQuery);
  }

  function onShowStoriesClick() {
    changeTab($(this), storiesAreaQuery);
  }

  function onShowDeckClick() {
    changeTab($(this), deckAreaQuery);
  }

  function onCardClick() {
    var $this = $(this);
    if ($this.hasClass('active')) return;
    var $chatArea = $this.closest(areaQuery),
        roomJid = $chatArea.data('jid'),
        estimate = $this.text();
    resetDeck(chats[roomJid]);
    $this.addClass('active');
    Com.sendEstimate(roomJid, estimate);
  }

  function onApproveEstimationClick() {
    var $area = $(this).closest(areaQuery),
        roomJid = $area.data('jid'),
        estimation = $.trim($area.find(finalEstimateQuery).val());
    if (Com.getRoom(roomJid).deck.indexOf(estimation) === -1) {
      alert('The estimate isn\'t avaiable in the deck.');
      return;
    }
    Com.sendEstimationAssign(roomJid, estimation);
  }

  function onRepeatEstimationClick() {
    var roomJid = $(this).closest(areaQuery).data('jid');
    Com.sendEstimationRepeat(roomJid);
  }



  /*
   * Event handlers per chat individuali e di gruppo
   */

  function onMessage(e, jid, message) {
    if (!(jid in chats)) initChat(jid);
    log(chats[jid], jid, message);
  }

  function onRoomMessage(e, roomJid, nick, message) {
    log(chats[roomJid], nick, message);
  }

  function onJoin(e, roomJid, nick) {
    var chat = chats[roomJid],
        roster = Com.getRoom(roomJid).roster;
    if (nick === null) {
      for (nick in roster) {
        addOccupant(chat, nick);
        if (roster[nick].voter) addVoter(chat, nick);
      }
      //addOccupant(chat, room.nick);
    } else {
      addOccupant(chat, nick);
      if (roster[nick].voter) addVoter(chat, nick);
      logInfo(chat, nick, 'joined the room');
    }
  }

  function onLeave(e, roomJid, nick) {
    if (nick === null) {
      chats[roomJid].$area.remove();
      delete chats[roomJid];
    } else {
      var chat = chats[roomJid];
      logInfo(chat, nick, 'left the room');
      removeOccupant(chat, nick);
      // Se il nick non corrisponde ad un voter, non viene cambiato nulla e non
      // viene generato alcun errore: non serve fare ulteriori controlli
      removeVoter(chat, nick);
    }
  }



  /*
   * Event handlers per le sessioni di planning poker
   */

  function onRoomIsPoker(e, roomJid) {
    if(! (roomJid in chats)) initChat(roomJid);
    enablePoker(chats[roomJid]);
  }

  function onDeck(e, roomJid, fromNick) {
    var chat = chats[roomJid];
    refreshDeck(chat);
    logInfo(chat, fromNick, 'changed cards in deck');
  }

  function onBacklog(e, roomJid, fromNick) {
    var chat = chats[roomJid];
    refreshBacklog(chat);
    logInfo(chat, fromNick, 'updated the backlog');
  }

  function onMeetingStatus(e, roomJid, fromNick) {
    var chat = chats[roomJid],
        message;
    switch (Com.getRoom(roomJid).meetingStatus) {
      case Com.MeetingStatus.started:
        message = 'started the conference';
        chat.$area.find(changeMeetingStatus)
          .text('Stop meeting')
          .removeClass('color1')
          .addClass('color2');
        break;
      case Com.MeetingStatus.stopped:
        message = 'stopped the conference';
        chat.$area.find(changeMeetingStatus)
          .text('Start meeting')
          .removeClass('color2')
          .addClass('color1');
        break;
    }
    logInfo(chat, fromNick, message);
  }

  function onStoryNotes(e, roomJid, fromNick) {
    var chat = chats[roomJid],
        room = Com.getRoom(roomJid),
        story = room.backlog[room.story];
    chat.$area.find(currentStoryNotesQuery).val(story.notes);
    logInfo(chat, fromNick, 'updated story notes');
  }

  function onStoryIndex(e, roomJid, fromNick) {
    var chat = chats[roomJid],
        roomData = Com.getRoom(roomJid),
        backlog = roomData.backlog,
        story = roomData.story,
        message;
    refreshBacklog(chat);
    if (story === -1) {
      message = 'changed current story to none';
    } else {
      message = 'changed current story to <i>'
        + backlog[story].storyText + '</i>';
    }
    logInfo(chat, fromNick, message);
    chat.$area.removeClass('voted voting');
    resetVoters(chat);
    refreshLog(chat);
    logInfo(chat, fromNick, message);
  }

  function onEstimateAssigned(e, roomJid, fromNick) {
    var chat = chats[roomJid],
        roomData = Com.getRoom(roomJid),
        story = roomData.backlog[roomData.story];
    refreshBacklog(chat);
    logInfo(chat, fromNick, 'closed the estimation of the story <i>'
      + story.storyText +'</i> with '+ story.estimate);
    chat.$area.removeClass('voted');
    resetVoters(chat);
  }

  function onEstimate(e, roomJid, nick) {
    var chat = chats[roomJid],
        vote = Com.getRoom(roomJid).roster[nick].vote,
        message;
    if (nick === Com.getRoom(roomJid).nick) {
      message = 'made your estimate';
    } else {
      message = 'made his estimate';
    }
    updateVoter(chat, nick, vote)
    logInfo(chat, nick, message);
  }

  function onEstimationCompleted(e, roomJid) {
    var chat = chats[roomJid],
        estimates = [],
        roster = Com.getRoom(roomJid).roster,
        occupant,
        nick,
        middleIndex,
        estimate;
    chat.$area.removeClass('voting').addClass('voted');
    // Trovo la stima media da proporre come stima finale
    // Metto tutte le stime numeriche in un array
    for (nick in roster) {
      occupant = roster[nick];
      if (occupant.voter && Util.isNumber(occupant.vote))
        estimates.push(occupant.vote);
    }
    // Ordino l'array
    if (estimates.length === 0) {
      estimate = '?';
    } else {
      estimates.sort();
      // Prendo l'indice centrale quando il length è dispari, il primo della
      // metà maggiore quando il length è pari
      middleIndex = Math.floor(estimates.length / 2);
      estimate = estimates[middleIndex];
    }
    chat.$area.find(finalEstimateQuery).val(estimate);
    logInfo(chat, null, 'All voters voted, estimation closed');
  }

  function onEstimateChanged(e, roomJid, fromNick) {
    var chat = chats[roomJid],
        message;
    if (fromNick === Com.getRoom(roomJid).nick) {
      message = 'changed your estimate';
    } else {
      message = 'changed his estimate';
    }
    logInfo(chat, fromNick, message);
  }

  function onEstimationResetted(e, roomJid, fromNick) {
    var chat = chats[roomJid];
    resetVoters(chat);
    resetDeck(chat);
    chat.$area.removeClass('voted').addClass('voting');
    logInfo(chat, fromNick, 'restarted estimation');
  }

  function onEstimationStatus(e, roomJid, fromNick) {
    var chat = chats[roomJid],
        message;
    switch (Com.getRoom(roomJid).estimationStatus) {
      case Com.EstimationStatus.opened:
        chat.$area.addClass('voting');
        message = 'opened the estimation';
        break;
      case Com.EstimationStatus.closed:
        chat.$area.removeClass('voting voted');
        message = 'closed the estimation';
        break;
    }
    resetDeck(chat);
    logInfo(chat, fromNick, message);
  }

  function onPrivilege(e, roomJid, fromNick, toNick, action, privilege) {
    var chat = chats[roomJid],
        $chatArea = chat.$area,
        actionText = (action === Com.PrivilegeAction.grant ? 'granted' : 'revoked'),
        privilegeText = (privilege === Com.Privilege.voter ? 'voter' : 'scribe'),
        nickText = toNick,
        message;
    if (toNick === Com.getRoom(roomJid).nick) {
      nickText = 'you';
      switch (action) {
        case Com.PrivilegeAction.grant:
          switch (privilege) {
            case Com.Privilege.voter:
              $chatArea.addClass('voter');
              break;
            case Com.Privilege.scribe:
              $chatArea.find(currentStoryNotesQuery).removeAttr('readonly');
              break;
          }
          break;
        case Com.PrivilegeAction.revoke:
          switch (privilege) {
            case Com.Privilege.voter:
              $chatArea.removeClass('voter');
              break;
            case Com.Privilege.scribe:
              $chatArea.find(currentStoryNotesQuery).attr('readonly', 'readonly');
              break;
          }
          break;
      }
    }
    removeOccupant(chat, toNick);
    addOccupant(chat, toNick);
    message = actionText +' <b>'+ nickText +'</b> the <i>'+ privilegeText
            + '</i> privilege';
    logInfo(chat, fromNick, message);
  }


  return {
    init : init,
    reset : reset,
    show : show,
    hide : hide,
    getUnreadCount : getUnreadCount
  }

})();