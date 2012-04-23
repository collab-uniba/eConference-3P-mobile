Gui.Story = (function(){

  var
    $area,
    $title,
    $cancel,
    $save,
    $delete,
    $id,
    $name,
    $notes,
    $estimate,
    $milestoneId,
    $milestoneName,
    $milestoneDate,

    targetRoomJid,
    targetStoryIndex;

  function init() {
    $area = $('#story-area');
    $title = $('#story-title');
    $cancel = $('#story-cancel');
    $save = $('#story-save');
    $delete = $('#story-delete');
    $id = $('#story-id');
    $name = $('#story-name');
    $notes = $('#story-notes');
    $estimate = $('#story-estimate');
    $milestoneId = $('#story-milestone-id');
    $milestoneName = $('#story-milestone-name');
    $milestoneDate = $('#story-milestone-date');

    $cancel.bind('click', onCancelClick);
    $save.bind('click', onSaveClick);
    $delete.bind('click', onDeleteClick);
  }

  function show(roomJid, storyIndex) {
    targetRoomJid = roomJid;
    targetStoryIndex = storyIndex;
    if (targetStoryIndex >= 0) {
      $title.text('Edit user story');
      $delete.show();
      var story = Com.getRoom(roomJid).backlog[targetStoryIndex];
      $id.val(story.id).attr('readonly', true);
      $name.val(story.storyText);
      $notes.val(story.notes);
      $estimate.val(story.estimate);
      $milestoneId.val(story.milestoneId);
      $milestoneName.val(story.milestoneDescription);
      $milestoneDate.val(story.milestoneCreatedOn);
      $name.focus();
    } else {
      $title.text('New user story');
      $id.removeAttr('readonly');
      $area.find('input, textarea').val('');
      $estimate.val('?');
      $delete.hide();
      $id.focus();
    }
    $area.show();
    Gui.Chat.hide();
  }

  function hide() {
    if (targetRoomJid)
      Gui.Chat.show(targetRoomJid);
    $area.hide();
    targetRoomJid = null;
    targetStoryIndex = null;
  }

  function onSaveClick() {
    var story = {
          id : $.trim($id.val()),
          storyText : $.trim($name.val()),
          notes : $.trim($notes.val()),
          estimate : $estimate.val(),
          milestoneId : $.trim($milestoneId.val()),
          milestoneDescription : $.trim($milestoneName.val()),
          milestoneCreatedOn : $.trim($milestoneDate.val())
        };
    if (story.id === '') {
      alert('Story id is required!');
      $id.focus();
      return;
    }
    if (story.storyText === '') {
      alert('Story name is required!');
      $name.focus();
      return;
    }
    if (targetStoryIndex >= 0) {
      Com.sendStoryUpdate(targetRoomJid, targetStoryIndex, story);
    } else {
      Com.sendNewStory(targetRoomJid, story);
    }
    hide();
  }

  function onCancelClick() {
    hide();
  }

  function onDeleteClick() {
    if (targetStoryIndex === Com.getRoom(targetRoomJid).story) {
      alert('You cannot delete the user story in estimation.');
    } else {
      Com.sendStoryDeletion(targetRoomJid, targetStoryIndex);
      hide();
    }
  }

  return {
    init : init,
    show : show,
    hide : hide
  };

})();