var App = {
  Models: {},
  Views: {},
  Collections: {},
  vent: {},
  vars: {
    identified: false
  }
};

_.extend(App.vent, Backbone.Events);

App.vent.on('post-message', function(msg, sender) {
  postMessage(sender + ': ' + msg, sender);
});

App.vent.on('submitted-id', function() {
  showIdName();
  showMessageBox();
});

App.vent.on('incoming-message', function(args) {
  console.log('vent just processed an incoming message', args);
  showIncomingMessage(args);
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
    return App.vars.identified !== false;
  },
  trySubmit: function(e) {
    if (e.keyCode == 13) {

      if (this.canSubmit()) {
        this.collection.add({ text: e.target.value });
        App.vent.trigger('post-message', e.target.value, $('input.sender').val());
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

App.Views.Identification = Backbone.View.extend({
  tagName: 'input',
  className: 'sender form-control md-col-6',
  placeholder: 'enter your name',
  events: {
    keypress: 'trySubmit'
  },
  hide: function() {
    $('span.id').hide();
    return this;
  },
  render: function() {
    this.$el.attr('placeholder', this.placeholder);
    return this;
  },
  trySubmit: function(e) {
    if (e.keyCode == 13) {
      App.vars.identified = this.$el.val();
      App.vent.trigger('submitted-id');
      this.hide();
    }
  }
});

App.Views.IdComponent = Backbone.View.extend({
  tagName: 'h1',
  className: 'page-header',
  render: function() {
    this.$el.text('Welcome ' + App.vars.identified);
    return this;
  }
});

App.Views.MessageHeader = Backbone.View.extend({
  tagName: 'h2',
  render: function() {
    this.$el.text('Say Something:');
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
  App.Socket.emit('posted-message', { msg: msg, sender: sender });
}

function showIdInput() {
  App.vars.idInput = new App.Views.Identification();
  $('span.id').append(App.vars.idInput.render().el);
}

function showIdName() {
  App.vars.idComponent = new App.Views.IdComponent();
  $('h1').replaceWith(App.vars.idComponent.render().el);
}

function showMessageBox() {
  App.vars.messageHeader = new App.Views.MessageHeader();
  var messages = new App.Collections.Messages();
  var input = new App.Views.Input({ collection: messages });
  $('#input-message').append(App.vars.messageHeader.render().el);
  $('#input-message').append(input.render().el);
}

function showIncomingMessage(args) {
  console.log(args);
  var message = new App.Models.Message({ text: args.msg });
  var view = new App.Views.Message({ model: message });
  $('#messages ul').prepend(view.render().el);
}

$(document).ready(function() {
  App.Socket = io.connect('http://localhost:3000');

  App.Socket.on('server-message', function(args) {
    App.vent.trigger('incoming-message', args);
  });
  $('span.loading').remove();

  showIdInput();
});