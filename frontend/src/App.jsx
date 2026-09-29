import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [decks, setDecks] = useState([]);
  const [deckName, setDeckName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const [studyMode, setStudyMode] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // ===============================
  // LOAD DECKS
  // ===============================
  useEffect(() => {
    fetch("http://localhost:5000/api/decks")
      .then((response) => response.json())
      .then((data) => {
        setDecks(data);
      })
      .catch((error) => {
        console.error("Failed to load decks:", error);
      });
  }, []);

  // ===============================
  // CREATE DECK
  // ===============================
  const createDeck = async () => {
    if (!deckName.trim()) {
      alert("Please enter a deck name");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/decks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: deckName.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setDecks([...decks, data]);
      setDeckName("");
      setShowForm(false);

      alert("Deck created successfully!");
    } catch (error) {
      console.error(error);
      alert("Backend connection failed");
    }
  };

  // ===============================
  // DELETE DECK
  // ===============================
  const deleteDeck = async (deckId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this deck?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/decks/${deckId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setDecks(
        decks.filter((deck) => deck._id !== deckId)
      );

      alert("Deck deleted successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to delete deck");
    }
  };

  // ===============================
  // ADD FLASHCARD
  // ===============================
  const addFlashcard = async () => {
    if (!question.trim() || !answer.trim()) {
      alert("Please enter both question and answer");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/decks/${selectedDeck._id}/cards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question.trim(),
            answer: answer.trim(),
          }),
        }
      );

      const updatedDeck = await response.json();

      if (!response.ok) {
        alert(updatedDeck.message);
        return;
      }

      setSelectedDeck(updatedDeck);

      setDecks(
        decks.map((deck) =>
          deck._id === updatedDeck._id
            ? updatedDeck
            : deck
        )
      );

      setQuestion("");
      setAnswer("");

      alert("Flashcard added successfully!");
    } catch (error) {
      console.error(error);
      alert("Backend connection failed");
    }
  };

  // ===============================
  // START STUDY
  // ===============================
  const startStudy = () => {
    if (selectedDeck.cards.length === 0) {
      alert("Add some flashcards first!");
      return;
    }

    setCurrentCard(0);
    setShowAnswer(false);
    setStudyMode(true);
  };

  // ===============================
  // SAVE RATING
  // ===============================
  const nextCard = async (rating) => {
  try {
    const card = selectedDeck.cards[currentCard];

    console.log("Deck ID:", selectedDeck._id);
    console.log("Card ID:", card._id);
    console.log("Rating:", rating);

    const response = await fetch(
      `http://localhost:5000/api/decks/${selectedDeck._id}/cards/${card._id}/review`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: rating,
        }),
      }
    );

    const data = await response.json();

    console.log("Rating response:", data);

    if (!response.ok) {
      alert(data.message || "Failed to save rating");
      return;
    }

    setSelectedDeck(data.deck);

    setDecks(
      decks.map((deck) =>
        deck._id === data.deck._id ? data.deck : deck
      )
    );

    if (currentCard < data.deck.cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
    } else {
      alert("🎉 Study session completed!");
      setStudyMode(false);
      setCurrentCard(0);
      setShowAnswer(false);
    }
  } catch (error) {
    console.error("Rating error:", error);
    alert("Failed to save rating");
  }
};

const isDue = (card) => {
  if (!card.nextReview) {
    return true;
  }

  return new Date(card.nextReview) <= new Date();
};
const getDashboardStats = () => {
  let totalCards = 0;
  let dueCards = 0;
  let learnedCards = 0;
  let upcomingCards = 0;

  decks.forEach((deck) => {
    deck.cards.forEach((card) => {
      totalCards++;

      if (!card.rating) {
        dueCards++;
      } else {
        learnedCards++;

        if (card.nextReview) {
          const reviewDate = new Date(card.nextReview);
          const today = new Date();

          if (reviewDate <= today) {
            dueCards++;
          } else {
            upcomingCards++;
          }
        }
      }
    });
  });

  return {
    totalCards,
    dueCards,
    learnedCards,
    upcomingCards,
  };
};

const stats = getDashboardStats();
// ===============================
// EDIT FLASHCARD
// ===============================
const editCard = async (card) => {
  const newQuestion = window.prompt(
    "Edit question:",
    card.question
  );

  if (newQuestion === null) return;

  const newAnswer = window.prompt(
    "Edit answer:",
    card.answer
  );

  if (newAnswer === null) return;

  if (!newQuestion.trim() || !newAnswer.trim()) {
    alert("Question and answer cannot be empty");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/decks/${selectedDeck._id}/cards/${card._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: newQuestion.trim(),
          answer: newAnswer.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    setSelectedDeck(data.deck);

    setDecks(
      decks.map((deck) =>
        deck._id === data.deck._id
          ? data.deck
          : deck
      )
    );

    alert("Flashcard updated successfully!");
  } catch (error) {
    console.error(error);
    alert("Failed to update flashcard");
  }
};

// ===============================
// DELETE FLASHCARD
// ===============================
const deleteCard = async (cardId) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this flashcard?"
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `http://localhost:5000/api/decks/${selectedDeck._id}/cards/${cardId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    setSelectedDeck(data.deck);

    setDecks(
      decks.map((deck) =>
        deck._id === data.deck._id
          ? data.deck
          : deck
      )
    );

    alert("Flashcard deleted successfully!");
  } catch (error) {
    console.error(error);
    alert("Failed to delete flashcard");
  }
};
  return (
    <div className="app">

      {/* ===============================
          HEADER
      =============================== */}

      <header className="header">
        <h1>📚 Digital Flashcards</h1>
        <p>
          Learn smarter with spaced repetition
        </p>
      </header>

      <main className="container">

        {/* ===============================
            HOME PAGE
        =============================== */}

        {!selectedDeck && (
          <section className="decks">

            <h2>
              Welcome to Digital Flashcards
            </h2>

            <p>
              Create decks, add flashcards
              and study.
            </p>

            <h2>My Decks</h2>
            <div className="dashboard">

              <div className="stat-card">
                <h3>📚</h3>
                <p>Total Cards</p>
                <strong>{stats.totalCards}</strong>
              </div>

              <div className="stat-card">
                <h3>🔴</h3>
                <p>Due Today</p>
                <strong>{stats.dueCards}</strong>
                </div>

                <div className="stat-card">
                  <h3>🟢</h3>
                  <p>Learned</p>
                  <strong>{stats.learnedCards}</strong>
                </div>

                <div className="stat-card">
                  <h3>📅</h3>
                  <p>Upcoming</p>
                  <strong>{stats.upcomingCards}</strong>
                </div>

              </div>
            {decks.length === 0 ? (
              <p>No decks yet.</p>
            ) : (
              decks.map((deck) => (
                <div
                  className="deck-card"
                  key={deck._id}
                >

                  <h3>
                    📘 {deck.name}
                  </h3>

                  <p>
                    {deck.cards.length} flashcards
                  </p>

                  <button
                    onClick={() =>
                      setSelectedDeck(deck)
                    }
                  >
                    Open Deck
                  </button>

                  <button
                    onClick={() =>
                      deleteDeck(deck._id)
                    }
                  >
                    🗑️ Delete
                  </button>

                </div>
              ))
            )}

            {!showForm ? (
              <button
                className="create-btn"
                onClick={() =>
                  setShowForm(true)
                }
              >
                + Create New Deck
              </button>
            ) : (
              <div className="create-form">

                <input
                  placeholder="Enter deck name"
                  value={deckName}
                  onChange={(e) =>
                    setDeckName(e.target.value)
                  }
                />

                <button
                  onClick={createDeck}
                >
                  Create
                </button>

                <button
                  onClick={() => {
                    setShowForm(false);
                    setDeckName("");
                  }}
                >
                  Cancel
                </button>

              </div>
            )}

          </section>
        )}

        {/* ===============================
            DECK PAGE
        =============================== */}

        {selectedDeck && !studyMode && (
          <section className="deck-page">

            <button
              onClick={() => {
                setSelectedDeck(null);
                setQuestion("");
                setAnswer("");
              }}
            >
              ← Back to Decks
            </button>

            <h2>
              📘 {selectedDeck.name}
            </h2>

            <p>
              {selectedDeck.cards.length} flashcards
            </p>

            <button
              onClick={startStudy}
            >
              ▶ Start Studying
            </button>

            {/* ADD FLASHCARD */}

            <div className="card-form">

              <h3>Add Flashcard</h3>

              <input
                placeholder="Enter question"
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
              />

              <textarea
                placeholder="Enter answer"
                value={answer}
                onChange={(e) =>
                  setAnswer(e.target.value)
                }
              />

              <button
                onClick={addFlashcard}
              >
                + Add Flashcard
              </button>

            </div>

            {/* FLASHCARD LIST */}

            <div className="card-list">

              <h3>
                Your Flashcards
              </h3>

              {selectedDeck.cards.length === 0 ? (
                <p>
                  No flashcards yet.
                </p>
              ) : (
                selectedDeck.cards.map(
                  (card, index) => (
                    <div
                      className="flashcard-item"
                      key={card._id}
                    >

                      <strong>
                        {index + 1}.{" "}
                        {card.question}
                      </strong>

                      <p>
                        {card.answer}
                      </p>
                      <div className="card-actions">
                        <button onClick={() => editCard(card)}>
                          📝 Edit
                        </button>

                        <button onClick={() => deleteCard(card._id)}>
                          🗑️ Delete
                        </button>
                      </div>
                      {/* RATING */}

                      {card.rating && (
                        <p>
                          ⭐ Rating:{" "}
                          <strong>
                            {card.rating}
                          </strong>
                        </p>
                      )}

                      {/* LAST REVIEWED */}

                      {card.lastReviewed && (
                        <p>
                          🕒 Last reviewed:{" "}
                          {new Date(
                            card.lastReviewed
                          ).toLocaleDateString()}
                        </p>
                      )}

                      {/* NEXT REVIEW */}

                      {card.nextReview && (
                        <p>
                          📅 Next review:{" "}
                          {new Date(
                            card.nextReview
                          ).toLocaleDateString()}
                        </p>
                      )}

                    </div>
                  )
                )
              )}

            </div>

          </section>
        )}

        {/* ===============================
            STUDY MODE
        =============================== */}

        {selectedDeck && studyMode && (
          <section className="study-section">

            <button
              onClick={() => {
                setStudyMode(false);
                setShowAnswer(false);
              }}
            >
              ← Exit Study
            </button>

            <h2>
              📖 Study Mode
            </h2>

            <p>
              Card {currentCard + 1} of{" "}
              {selectedDeck.cards.length}
            </p>

            {/* STUDY CARD */}

            <div
              className="study-card"
              onClick={() =>
                setShowAnswer(
                  !showAnswer
                )
              }
            >

              {!showAnswer ? (
                <>
                  <span>
                    QUESTION
                  </span>

                  <h2>
                    {
                      selectedDeck
                        .cards[currentCard]
                        .question
                    }
                  </h2>

                  <p>
                    Click to reveal answer
                  </p>
                </>
              ) : (
                <>
                  <span>
                    ANSWER
                  </span>

                  <h2>
                    {
                      selectedDeck
                        .cards[currentCard]
                        .answer
                    }
                  </h2>

                  <p>
                    Choose how well you
                    knew it
                  </p>
                </>
              )}

            </div>

            {/* RATING BUTTONS */}

            {showAnswer && (
              <div className="rating-buttons">

                <button
                  onClick={() =>
                    nextCard("Again")
                  }
                >
                  ❌ Again
                </button>

                <button
                  onClick={() =>
                    nextCard("Hard")
                  }
                >
                  😐 Hard
                </button>

                <button
                  onClick={() =>
                    nextCard("Good")
                  }
                >
                  🙂 Good
                </button>

                <button
                  onClick={() =>
                    nextCard("Easy")
                  }
                >
                  😎 Easy
                </button>

              </div>
            )}

          </section>
        )}

      </main>

    </div>
  );
}

export default App;
