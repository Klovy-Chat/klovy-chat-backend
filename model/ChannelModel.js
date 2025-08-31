import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Nazwa kanału jest wymagana"],
    trim: true,
    minlength: [3, "Nazwa kanału musi mieć minimum 3 znaki"],
    maxlength: [50, "Nazwa kanału nie może przekraczać 50 znaków"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, "Opis nie może przekraczać 200 znaków"]
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: {
    type: String,
    default: "",
  },
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Messages",
    },
  ],
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

channelSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

channelSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

channelSchema.index({ name: 1 });
channelSchema.index({ members: 1 });
channelSchema.index({ admin: 1 });

channelSchema.virtual("memberCount").get(function() {
  return this.members.length + 1;
});

channelSchema.virtual("messageCount").get(function() {
  return this.messages.length;
});

const Channel = mongoose.model("Channels", channelSchema);
export default Channel;
