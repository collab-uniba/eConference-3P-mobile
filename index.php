<!doctype html>
<!--[if IEMobile 7 ]> <html class="no-js iem7" lang="it"> <![endif]-->
<!--[if (gt IEMobile 7)|!(IEMobile)]><!--> <html class="no-js" lang="it"> <!--<![endif]-->

<head>
  <?php require_once "$_SERVER[DOCUMENT_ROOT]/assets_functions.php" ?>
  <meta charset="utf-8">

  <title>eConference 3P mobile</title>

  <meta name="HandheldFriendly" content="True">
  <meta name="MobileOptimized" content="320">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

  <link rel="apple-touch-startup-image" href="img/startup.png">
  <link rel="apple-touch-icon-precomposed" sizes="114x114" href="img/h/apple-touch-icon.png">
  <link rel="apple-touch-icon-precomposed" sizes="72x72" href="img/m/apple-touch-icon.png">
  <link rel="apple-touch-icon-precomposed" href="img/l/apple-touch-icon-precomposed.png">
  <link rel="shortcut icon" href="img/l/apple-touch-icon.png">

  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">

  <meta http-equiv="cleartype" content="on">

  <?php include_stylesheets() ?>

</head>

<body>

  <section id="loading-dialog">
    <img src="/img/loading.gif">Loading
      <small>please wait...</small>
  </section>

  <section id="connecting-dialog" class="dialog">
    <div><img src="/img/loading.gif">Loading...</div>
  </section>

  <section id="disconnecting-dialog" class="dialog">
    <div><img src="/img/loading.gif">Disconnecting...</div>
  </section>



  <section id="login-area">
    <div class="form">
      <div>Jabber ID:<br>
        <input type="email" value="ur1@jabber.org"></div>
      <div>Password:<br>
        <input type="password" value="pppppp"></div>
      <div class="more-margin">
        <button>Connect</button>
      </div>
    </div>
  </section>



  <section id="roster-area">
    <header class="clearfix">
      <button id="disconnect">Disconnect</button>
      <h1>Home</h1>
    </header>
    <section id="subscribers">
      <header>
        <h2>Requests</h2>
      </header>
      <ul class="list"><?php /*
        <li>giuseppesilvano@gmail.com<span class="icon">›</span>
        <li>sh2@jabber.org<span class="icon">›</span>
      */?></ul>
    </section>
    <section id="muc">
      <header>
        <h2>Group chats</h2>
        <button id="muc-new">New</button>
      </header>
      <div class="empty">No group chats to display.</div>
      <ul class="list"><?php /*
        <li>giuseppesilvano@gmail.com<span class="icon">›</span>
        <li>sh2@jabber.org<span class="icon">›</span>
      */?></ul>
    </section>
    <section id="roster">
      <header>
        <h2>Contacts</h2>
        <button id="roster-new">New</button>
        <button id="roster-edit">Edit</button>
        <button id="roster-accept" class="color1">End</button>
      </header>
      <ul class="list"><?php /*
        <li>giuseppesilvano@gmail.com<span class="icon">›</span>
        <li>sh2@jabber.org<span class="icon">›</span>
      */?></ul>
    </section>
  </section>



  <section id="contact-area">
    <header class="clearfix">
      <button id="contact-cancel">Home</button>
      <h1>Edit contact</h1>
    </header>
    <div class="form">
      <div>Jabber ID:<br>
        <input id="contact-jid" type="email" readonly>
      </div>
      <div>Name:<br>
        <input id="contact-name" type="text">
      </div>
      <div class="more-margin">
        <button id="contact-save">Apply changes</button>
        <button id="contact-delete" class="color2">Delete contact</button>
      </div>
    </div>
  </section>



  <section id="subscription-area">
    <header class="clearfix">
      <button id="subscription-cancel">Home</button>
      <h1>Request</h1>
    </header>
    <div class="form">
      <div>
        <strong id="subscriber"></strong><br>
        asks to receive your updates
      </div>
      <div class="more-margin">
        <button id="subscription-approve">Accept</button>
        <button id="subscription-deny" class="color2">Decline</button>
      </div>
    </div>
  </section>



  <section id="muc-setup-area">
    <header class="clearfix">
      <button id="muc-setup-cancel">Home</button>
      <h1>Group chat</h1>
      <button id="muc-setup-ok" class="right color1">End</button>
    </header>
    <div class="form">
      <div>
        A name for the chat:<br>
        <input type="text" id="muc-setup-name">
      </div>
      <div>
        Service:<br>
        <select id="muc-setup-service">
          <option selected>chat.core.im</option>
          <option>conference.codingteam.net</option>
        </select>
      </div>
      <div>
        <span id="muc-setup-poker" class="checkbox">Planning poker</span>
      </div>
      <div>
        Your nickname:<br>
        <input type="text" id="muc-setup-nick">
      </div>
      <div>
        Send invitations to:<br>
        <ul class="list"><?php /*
          <li>Testing user one<span class="icon">x</span></li>
          <li>Testing user two<span class="icon">-</span></li>
          <li>Testing user three<span class="icon">-</span></li>
        */?></ul>
      </div>
    </div>
  </section>



  <section id="muc-invitation-area">
    <header class="clearfix">
      <button id="muc-invitation-cancel">Home</button>
      <h1>Chat invitation</h1>
    </header>
    <div class="form">
      <div>
        <strong id="muc-invitation-from"></strong><br>
        invited you in the group chat<br>
        <strong id="muc-invitation-room"></strong>
      </div>
      <div class="more-margin">
        Your nickname:
        <input type="text" id="muc-invitation-nick">
        <button id="muc-invitation-accept">Join the chat</button>
        <button id="muc-invitation-ignore" class="color2">Ignore</button>
      </div>
    </div>
  </section>



  <section id="chat-area-prototype" class="chat-area">
    <header class="clearfix">
      <button class="chat-hide">Home</button>
      <h1 class="chat-title">Planning Poker</h1>
      <button class="chat-leave color2 right">Leave</button>
    </header>

    <nav class="clearfix">
      <span class="chat-show-messages active"></span>
      <span class="chat-show-users"></span>
      <span class="chat-show-stories"></span>
      <span class="chat-show-deck"></span>
    </nav>

    <section class="chat-logs">
      <ul class="chat-log"><?php /*
        <li><b>Me</b> Ciao a tutti
        <li>iniziamo?
        <li><b>ur2</b> Certo, aspettiamo solo ur3
        <li>poi iniziamo
        <li class="join"><b>ur3</b> è entrato
        <li><b>ur3</b> Ciao a tutti, ci sono anche io.
        <li><b>ur2</b> Ok, iniziamo.
        <li class="info"><b>ur2</b> ha avviato la conferenza
        <li class="info"><b>ur2</b> ha deciso la storia da discutere:<br><i>Progettare il layout</i>
      */ ?></ul>
      <div><input type="text" x-webkit-speech speech lang="it" value="type a message"><button class="chat-send">Send</button></div>
    </section>

    <section class="chat-users">
      <ul><?php /*
        <li><strong>ur1</strong> (Analista) <small>scriba</small>
        <li><strong>ur2</strong> (PO) <small>moderatore</small>
        <li><strong>ur3</strong> (Sviluppatore)  <small>votante</small>
      */ ?></ul>
    </section>

    <section class="chat-stories">
      <div class="chat-current-story">
        <h1 class="chat-current-story-text"><?php //Progettare il layout ?></h1>
        <small class="chat-current-story-info"><?php //<b>in discussione</b>, milestone 3, stima ? ?></small>
        <textarea class="chat-current-story-notes" readonly></textarea>
      </div>
      <div>
        <div class="chat-no-stories">
          No stories to display.
        </div>
        <ul><?php /*
          <li><strong>Produrre la grafica</strong>
            <small>milestone 3, stima ?</small>
          <li><strong>Collegare servizi esterni</strong>
            <small>milestone 3, stima ?</small>
          <li><strong>Implementare funzioni avanzate</strong>
            <small>milestone 3, stima ?</small>
        */ ?></ul>
      </div>
      <div class="chat-stories-actions form">
        <button class="chat-edit-stories">Edit user stories</button>
        <button class="chat-stop-editing-stories color1">Stop editing</button>
        <button class="chat-new-story">New user story</button>
        <br>
        <button class="chat-change-meeting-status color1">Start meeting</button>
      </div>
    </section>

    <section class="chat-deck">
      <div class="chat-deck-forbidden">
        You haven't the permission to vote.
      </div>
      <div class="chat-deck-disabled">
        Voting is disabled, for now.
      </div>
      <div class="chat-deck-cards clearfix"><?php /*
        <div>?</div>
        <div>0</div>
        <div>1</div>
        <div>2</div>
        <div class="active">3</div>
        <div>5</div>
        <div>8</div>
        <div>20</div>
        <div>40</div>
        <div>100</div>
      */ ?></div>
      <div class="chat-estimates">
        <ul><?php /*
          <li><strong>ur1</strong> <span>?</span>
          <li><strong>ur2</strong> <span>20</span>
          <li><strong>ur3</strong> <span>5</span>
          <li><strong>ur4</strong> <span>40</span>
          <li><strong>ur5</strong> <span>100</span>
        */ ?></ul>
        <div class="chat-estimates-actions form">
          <div class="chat-final-estimate-area">
            Final estimate:<br>
            <input class="chat-final-estimate" type="text">
          </div>
          <button class="chat-approve-estimation color1">Accept</button>
          <button class="chat-repeat-estimation color2">Repeat</button>
        </div>
      </div>
    </section>
  </section>



  <section id="occupant-area">
    <header class="clearfix">
      <button id="occupant-cancel">Back</button>
      <h1>Edit occupant privileges</h1>
    </header>
    <div class="form">
      <div>
        <h1 id="occupant-nick"></h1>
      </div>
      <div>
        <span id="occupant-voter" class="checkbox">Voter</span>
        <span id="occupant-scribe" class="checkbox">Scribe</span>
      </div>
      <div>
        <button id="occupant-apply">Apply</button>
      </div>
    </div>
  </section>



  <section id="story-area">
    <header class="clearfix">
      <button id="story-cancel">Back</button>
      <h1 id="story-title">New user story</h1>
    </header>
    <div class="form">
      <div>
        Id:<br>
        <input id="story-id" type="text"><br>
        Story text:<br>
        <input id="story-name"type="text"><br>
        Notes:<br>
        <textarea id="story-notes"></textarea><br>
        Estimate:<br>
        <select id="story-estimate">
          <option selected>?
          <option>0
          <option>1
          <option>2
          <option>3
          <option>5
          <option>8
          <option>20
          <option>40
          <option>100
        </select><br>
        Milestone Id:<br>
        <input id="story-milestone-id" type="text"><br>
        Milestone:<br>
        <input id="story-milestone-name" type="text"><br>
        Milestone creation date:<br>
        <input id="story-milestone-date" type="text"><br>
      </div>
      <div>
        <button id="story-save" class="color1">Save</button>
        <button id="story-delete" class="color2">Delete</button>
      </div>
    </div>
  </section>



  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
  <script>window.jQuery || document.write('<script src="js/libs/jquery-1.7.1.min.js"><\/script>')</script>
  <script src="js/libs/strophe-1.0.2.min.js"></script>
  <?php include_javascripts() ?>

</body>
</html>