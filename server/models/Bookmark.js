import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const BookmarkSchema = new Schema(
  {
    user:     { type: Schema.Types.ObjectId, ref: 'User',     required: true },
    question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    notes:      { type: String, maxlength: 500, default: '' },
    collection: { type: String, default: 'General' },
  },
  { timestamps: true }
);

BookmarkSchema.index({ user: 1, question: 1 }, { unique: true });
BookmarkSchema.index({ user: 1, collection: 1 });

export default model('Bookmark', BookmarkSchema);