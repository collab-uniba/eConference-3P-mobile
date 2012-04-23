Gui.Contact = (function(){

  var
    $area,
    $jid,
    $name,
    $save,
    $cancel,
    $delete,

    updateMode = false;


  function init() {
    $area = $('#contact-area');
    $jid = $('#contact-jid');
    $name = $('#contact-name');
    $save = $('#contact-save');
    $cancel = $('#contact-cancel');
    $delete = $('#contact-delete');

    $save.bind('click', onSaveClick);
    $cancel.bind('click', onCancelClick);
    $delete.bind('click', onDeleteClick);
  }

  function show(jid) {
    if (jid) {
      updateMode = true;
      $jid.attr('readonly','readonly').val(jid);
      $name.val(Com.getContact(jid).name);
      $save.text('Apply changes');
      $delete.show();
      $area.show();
      Gui.Home.hide();
      $name.focus();
    } else {
      updateMode = false;
      $save.text('Add to contacts list');
      $delete.hide();
      $jid.removeAttr('readonly').val('');
      $name.val('');
      $area.show();
      Gui.Home.hide();
      $jid.focus();
    }
  }

  function hide() {
    $area.hide();
  }

  function onSaveClick() {
    if (updateMode) {
      Com.updateContact($jid.val(), $name.val());
    } else {
      Com.addContact($jid.val(), $name.val());
    }
    hide();
    Gui.Home.show();
  }

  function onCancelClick() {
    hide();
    Gui.Home.show();
  }

  function onDeleteClick() {
    Com.deleteContact($jid.val());
    hide();
    Gui.Home.show();
  }



  return {
    init: init,
    show : show,
    hide : hide
  };

})();