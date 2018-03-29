const {RTMClient, WebClient} = require('@slack/client');

const tokenOauth = process.env.SLACK_TOKEN_OAUTH;
const tokenBot = process.env.SLACK_TOKEN_BOT;
const REACTION_TYPE = process.env.SLACK_REACTION;
const COUNT = process.env.SLACK_COUNT;

const rtm = new RTMClient(tokenBot);
const web = new WebClient(tokenOauth);

rtm.start();

rtm.on('reaction_added', (event) => {
  if (event.reaction === REACTION_TYPE) {
    var params = null;
    switch (event.item.type) {
      case 'message':
        params = {
          channel: event.item.channel,
          timestamp: event.item.ts
        };
        break;

      case 'file':
        params = {
          file: event.item.file
        };
        break;

      case 'file_comment':
        params = {
          file_comment: event.item.file_comment
        };
        break;
    }

    if (null === params) {
      return;
    }

    web.reactions.get(params).then((response) => {
      var reactions = [];
      var sender = null;
      var message = '';
      switch (response.type) {
        case 'message':
          reactions = response.message.reactions;
          sender = response.message.user;
          message = response.message.text;
          break;

        case 'file':
          reactions = response.file.reactions;
          sender = response.file.user;
          break;

        case 'file_comment':
          reactions = response.comment.reactions;
          sender = response.comment.user;
          message = response.comment.text;
          break;
      }

      var count = reactions.find((item) => item.name === REACTION_TYPE).count;

      if (count < COUNT) {
        return;
      }

      var text = [
        '<@' + sender + '>',
        ':point_right:',
        'got put in timeout by',
        count,
        'users',
        '\n',
        '`' + message + '`'
      ].join(' ');

      web.chat.postMessage(
          {
            channel: event.item.channel,
            text: text,
            icon_emoji: ':' + REACTION_TYPE + ':'
          }
      ).then((response) => {
        setTimeout(() => {
          if (event.item.channel[0] === 'G') {
            web.groups.kick({channel: event.item.channel, user: sender}).catch(console.error);
          } else {
            web.channels.kick({channel: event.item.channel, user: sender}).catch(console.error);
          }
        }, 3000);
      }).catch(console.error);
    }).catch(console.error);
  }
});
