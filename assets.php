<?php

return array(
   'minify' => (include dirname(__FILE__).'/production.php'),

  'js_version' => 15,
  'js' => array(
    'helper',
    'main',
    'Com',
    'Com.Config',
    'Util',
    'Gui.Dialog',
    'Gui.Login',
    'Gui.Home',
    'Gui.Chat',
    'Gui.Contact',
    'Gui.Subscription',
    'Gui.MucSetup',
    'Gui.MucInvitation',
    'Gui.Story',
    'Gui.Occupant'
  ),

  'css_version' => 15,
  'css' => array(
    'pre-normalize',
    'main',
    'dialog',
    'home',
    'chat',
    'other',
    'post-normalize'
  )

);