const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },

  answer: {
    type: String,
    required: true,
  },

  rating: {
    type: String,
    default: null,
  },

  lastReviewed: {
    type: Date,
    default: null,
  },

  nextReview: {
    type: Date,
    default: null,
  },
});

const deckSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  cards: [cardSchema],
});

module.exports = mongoose.model("Deck", deckSchema);