var App = {
  Models: {},
  Views: {},
  Collections: {},
  vent: {},
  vars: {
    identified: false,
    user: {},
    colors: [
      'orange',
      'green',
      'blue',
      'pink',
      'yellow',
    ]
  }
};

_.extend(App.vent, Backbone.Events);

App.vent.on('post-message', function(msg, sender) {
  postMessage(sender + ' said :  ' + msg, sender);
});

App.vent.on('submitted-id', function() {
  showIdName();
  App.Socket.emit('user-joined', { name: App.vars.identified });
  showSaySomethingWidget();
});

App.vent.on('incoming-message', function(args) {
  showIncomingMessage(args);
});

App.vent.on('notification', function(args) {
  App.vars.notification.model.set('message', args.message);
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
  className: 'form-control say-something',
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

App.Models.Nofication = Backbone.Model.extend({});

App.Views.Nofication = Backbone.View.extend({
  initialize: function() {
    this.model.on('change:message', function() {
      this.$el.text(this.model.get('message')).show();
      this.$el.fadeOut(2000);
    }, this);
  },
  tagName: 'p',
  className: 'notification',
  render: function() {
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
  className: 'message alert',
  render: function(colorClass) {
    this.$el.text(this.model.get('text'));
    this.$el.addClass(colorClass);
    return this;
  }
});

function postMessage(msg, sender) {
  var color = App.vars.user.color;
  App.Socket.emit('posted-message', { msg: msg, sender: sender, color: color });
}

function showIdInput() {
  App.vars.idInput = new App.Views.Identification();
  App.vars.user.name = 'username';
  App.vars.user.color = getRandomArrayElement(App.vars.colors);
  $('span.id').append(App.vars.idInput.render().el);
  $('input.sender').focus();
}

function showIdName() {
  App.vars.idComponent = new App.Views.IdComponent();
  $('h1').replaceWith(App.vars.idComponent.render().el);
}

function showSaySomethingWidget(color) {
  App.vars.messageHeader = new App.Views.MessageHeader();
  var messages = new App.Collections.Messages();
  var input = new App.Views.Input({ collection: messages });
  $('#input-message').append(App.vars.messageHeader.render().el)
    .append(input.render(color).el);
  $('input.say-something').select()
}

function showIncomingMessage(args) {
  var message = new App.Models.Message({ text: args.msg });
  var view = new App.Views.Message({ model: message });
  $('#messages ul').prepend(view.render(args.color).el);
}

$(document).ready(function() {
  App.Socket = io.connect('http://localhost:3000');

  App.Socket.on('server-message', function(args) {
    App.vent.trigger('incoming-message', args);
  });

  App.Socket.on('notification', function(args) {
    App.vent.trigger('notification', args);
  });
  $('span.loading').remove();

  App.vars.notification = new App.Views.Nofication({
    model: new App.Models.Nofication()
  });

  $('span.notification').append(App.vars.notification.render().el);
  showIdInput();
});