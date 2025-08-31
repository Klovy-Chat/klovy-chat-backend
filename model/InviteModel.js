import mongoose from 'mongoose';
const { Schema } = mongoose;
import { v4 as uuidv4 } from 'uuid';

const InviteSchema = new Schema({
  inviteId: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
  },
  channelId: {
    type: Schema.Types.ObjectId,
    ref: 'Channels',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  used: {
    type: Boolean,
    default: false
  }
});

const Invite = mongoose.model('Invite', InviteSchema);
export default Invite;
