const Deck = require("./models/Deck");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// GET ALL DECKS
// ===============================
app.get("/api/decks", async (req, res) => {
  try {
    const decks = await Deck.find();
    res.json(decks);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch decks",
      error: error.message,
    });
  }
});

// ===============================
// CREATE DECK
// ===============================
app.post("/api/decks", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Deck name is required",
      });
    }

    const deck = new Deck({
      name: name.trim(),
      cards: [],
    });

    const savedDeck = await deck.save();

    res.status(201).json(savedDeck);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create deck",
      error: error.message,
    });
  }
});

// ===============================
// ADD FLASHCARD
// ===============================
app.post("/api/decks/:deckId/cards", async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        message: "Question and answer are required",
      });
    }

    const deck = await Deck.findById(req.params.deckId);

    if (!deck) {
      return res.status(404).json({
        message: "Deck not found",
      });
    }

    deck.cards.push({
      question: question.trim(),
      answer: answer.trim(),
    });

    await deck.save();

    res.status(201).json(deck);
  } catch (error) {
    res.status(500).json({
      message: "Failed to add flashcard",
      error: error.message,
    });
  }
});
// ===============================
// EDIT FLASHCARD
// ===============================
app.put("/api/decks/:deckId/cards/:cardId", async (req, res) => {
  try {
    const { question, answer } = req.body;

    const deck = await Deck.findById(req.params.deckId);

    if (!deck) {
      return res.status(404).json({
        message: "Deck not found",
      });
    }

    const card = deck.cards.id(req.params.cardId);

    if (!card) {
      return res.status(404).json({
        message: "Flashcard not found",
      });
    }

    card.question = question.trim();
    card.answer = answer.trim();

    await deck.save();

    res.json(deck);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update flashcard",
      error: error.message,
    });
  }
});

// ===============================
// DELETE FLASHCARD
// ===============================
app.delete(
  "/api/decks/:deckId/cards/:cardId",
  async (req, res) => {
    try {
      const deck = await Deck.findById(req.params.deckId);

      if (!deck) {
        return res.status(404).json({
          message: "Deck not found",
        });
      }

      const card = deck.cards.id(req.params.cardId);

      if (!card) {
        return res.status(404).json({
          message: "Flashcard not found",
        });
      }

      card.deleteOne();

      await deck.save();

      res.json({
        message: "Flashcard deleted successfully",
        deck: deck,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete flashcard",
        error: error.message,
      });
    }
  }
);
// ===============================
// SAVE RATING + NEXT REVIEW
// ===============================
app.put(
  "/api/decks/:deckId/cards/:cardId/review",
  async (req, res) => {
    try {
      const { rating } = req.body;

      const allowedRatings = [
        "Again",
        "Hard",
        "Good",
        "Easy",
      ];

      if (!allowedRatings.includes(rating)) {
        return res.status(400).json({
          message: "Invalid rating",
        });
      }

      const deck = await Deck.findById(req.params.deckId);

      if (!deck) {
        return res.status(404).json({
          message: "Deck not found",
        });
      }

      const card = deck.cards.id(req.params.cardId);

      if (!card) {
        return res.status(404).json({
          message: "Card not found",
        });
      }

      let days;

      if (rating === "Again") {
        days = 1;
      } else if (rating === "Hard") {
        days = 2;
      } else if (rating === "Good") {
        days = 4;
      } else {
        days = 7;
      }

      const now = new Date();

      const nextReview = new Date(now);
      nextReview.setDate(nextReview.getDate() + days);

      card.rating = rating;
      card.lastReviewed = now;
      card.nextReview = nextReview;

      await deck.save();

      res.json({
        message: "Rating saved successfully",
        deck: deck,
      });
    } catch (error) {
      console.error("Rating error:", error);

      res.status(500).json({
        message: "Failed to save rating",
        error: error.message,
      });
    }
  }
);

// ===============================
// DELETE DECK
// ===============================
app.delete("/api/decks/:deckId", async (req, res) => {
  try {
    const deletedDeck = await Deck.findByIdAndDelete(
      req.params.deckId
    );

    if (!deletedDeck) {
      return res.status(404).json({
        message: "Deck not found",
      });
    }

    res.json({
      message: "Deck deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete deck",
      error: error.message,
    });
  }
});

// ===============================
// TEST
// ===============================
app.get("/", (req, res) => {
  res.json({
    message: "Digital Flashcards API is running!",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "Hello from the Digital Flashcards backend!",
  });
});

// ===============================
// MONGODB CONNECTION
// ===============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(5000, () => {
      console.log(
        "Server running on http://localhost:5000"
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });