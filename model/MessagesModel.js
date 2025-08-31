import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Nadawca jest wymagany"]
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channels"
  },
  content: {
    type: String,
    required: [true, "Treść wiadomości jest wymagana"],
    trim: true,
    maxlength: [2000, "Wiadomość nie może przekraczać 2000 znaków"]
  },
  messageType: {
    type: String,
    enum: ["TEXT", "FILE", "IMAGE", "VIDEO", "AUDIO"],
    default: "TEXT"
  },
  fileUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return this.messageType === "TEXT" || (this.messageType !== "TEXT" && v);
      },
      message: "URL pliku jest wymagany dla wiadomości typu FILE, IMAGE, VIDEO lub AUDIO"
    }
  },
  fileType: {
    type: String
  },
  fileSize: {
    type: Number
  },
  fileName: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: {
    type: Map,
    of: reactionSchema,
    default: new Map()
  },
  quotedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Messages"
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ channel: 1 });
messageSchema.index({ timestamp: -1 });

messageSchema.virtual("reactionCount").get(function() {
  return this.reactions.size;
});

messageSchema.virtual("readCount").get(function() {
  return this.readBy.length;
});

messageSchema.pre("save", function(next) {
  if (this.isModified("content") && !this.isNew) {
    this.edited = true;
    this.editedAt = Date.now();
  }
  next();
});

const Message = mongoose.model("Messages", messageSchema);
export default Message;
