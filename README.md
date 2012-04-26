# eConference 3P mobile

A mobile version of the [eConference 3P](http://code.google.com/p/econference-planning-poker-plugin/) software, written in HTML 5.  
eConference 3P mobile allows you to chat with your team via XMPP and participate to remote planning poker sessions, everything from your smartphone.


## Requirements

* Apache httpd 2 or greater
* PHP 5.2 or greater
* A BOSH Connection Manager ([Punjab](https://github.com/twonds/punjab) for example)


## Installation

1. Clone the repository (`git clone git://github.com/collab-uniba/eConference-3P-mobile.git`), or [download it](https://github.com/giuseppe-silvano/eConference-3P-mobile/zipball/master).
2. put all the files in the root of your webserver
3. update `/js/Com.Config.js` with the URL of your BOSH Connection Manager
4. open your browser and navigate to your web server URL, everything should work!


## Usage

Read the [How to use](https://github.com/collab-uniba/eConference-3P-mobile/wiki/How-to-use) wiki.


## Features

* play planning poker everywhere
* full control of your contacts list: add, edit and delete contacts
* create or participate to group chats, and invite friends
* chat functionality compatible with every other XMPP client
* simple and clean interface
* CSS 3 for the UI, with graceful degradation to CSS 2 if not supported
* speech recognition: dictate your messages instead of writing them (needed browser support)
* connects to XMPP using HTTP, better handling of firewalls and network switch
* lightweight, scripts and style sheets compressed for better performance and less band usage
* works on Opera Mobile 10+, Safari mobile (iOS 3.1+), Android browser (Android 1.+), Internet Explorer (Windows Phone 7.5+)


## License

The eConference 3P mobile source code is licensed under the MIT license, except for those components:
* [HTML 5 Mobile Boilerplate](http://html5boilerplate.com/mobile): Public Domain
* [jQuery](http://jquery.com/): MIT/GPL license
* [minify](http://code.google.com/p/minify/): New BSD
* [Normalize.css](http://necolas.github.com/normalize.css/): Public Domain
* [Strophe.js](http://strophe.im/strophejs/): MIT/Public domain
