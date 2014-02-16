var App = {
  Models: {},
  Views: {},
  Collections: {},
  vent: {}
};

_.extend(App.vent, Backbone.Events);

App.vent.on('post', function(msg, sender) {
  console.log('post a message:' + msg);
  postMessage(sender + ': ' + msg, sender);
});

App.Models.Message = Backbone.Model.extend({
  defaults: {
    sender: 'me',
    text: 'some text'
  }
});

App.Collections.Messages = Backbone.Collection.extend({
  model: App.Models.Message
});

App.Views.Input = Backbone.View.extend({
  tagName: 'input',
  className: 'form-control',
  placeholder: 'type a message, then hit enter',
  events: {
    keypress: 'trySubmit'
  },
  canSubmit: function() {
    return $('input.sender').val() != '';
  },
  trySubmit: function(e) {
    if (e.keyCode == 13) {

      if (this.canSubmit()) {
        this.collection.add({ text: e.target.value });
        App.vent.trigger('post', e.target.value, $('input.sender').val());
        e.target.value = '';
      } else {
        alert('please identify yourself!');
      }

    }
  },
  render: function() {
    this.$el.attr('placeholder', this.placeholder);
    return this;
  }
});

App.Views.Message = Backbone.View.extend({
  tagName: 'li',
  render: function() {
    this.$el.text(this.model.get('text'));
    this.$el.css('background-color', '#'+Math.floor(Math.random()*16777215).toString(16));
    return this;
  }
});

function postMessage(msg, sender) {
  var message = new App.Models.Message({ text: msg });
  var view = new App.Views.Message({ model: message });
  App.Socket.emit('message-post', { msg: msg, sender: sender });

  $('#messages ul').append(view.render().el);
}

$(document).ready(function() {
  App.Socket = io.connect('http://localhost:3000');

  App.Socket.on('news', function (data) {
    console.log(data);
    App.Socket.emit('my other event', { my: 'data' });
  });
  $('span.loading').remove();

  var messages = new App.Collections.Messages();
  var input = new App.Views.Input({ collection: messages });

  $('#input-message').append(input.render().el);
});