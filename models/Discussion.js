const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  validate: {
    validator: function() {
      return (this.groupId && !this.eventId) || (!this.groupId && this.eventId);
    },
    message: 'Une discussion doit être liée soit à un groupe, soit à un événement, mais pas les deux'
  }
});

module.exports = mongoose.model('Discussion', discussionSchema);
