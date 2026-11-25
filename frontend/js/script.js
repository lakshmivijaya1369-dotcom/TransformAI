
const sourceText = document.getElementById("sourceText");
const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");
const generateBtn = document.getElementById("generateBtn");
const resultBox = document.getElementById("result");
const downloadBtn = document.getElementById("downloadBtn");
const message = document.getElementById("message");
const charCount = document.getElementById("charCount");

let latestResult = "";
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let studyIndex = 0;
let studyRevealed = false;
let currentData = null;


// Styles for the four modules
const style = document.createElement("style");
style.textContent = `
.module-title { margin-bottom: 18px; }
.module-card {
  padding: 18px;
  margin: 12px 0;
  border: 1px solid #d8dce5;
  border-radius: 12px;
}
.module-card h3 { margin-top: 0; }
.module-muted { opacity: .75; }
.module-progress {
  height: 7px;
  background: #e5e7eb;
  border-radius: 20px;
  overflow: hidden;
  margin: 12px 0 20px;
}
.module-progress span {
  display: block;
  height: 100%;
  background: #2563eb;
}
.module-option {
  display: block;
  width: 100%;
  padding: 13px;
  margin: 9px 0;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  text-align: left;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.module-option.selected {
  border: 2px solid #2563eb;
  background: #eff6ff;
}
.module-option.correct {
  border: 2px solid #16a34a;
  background: #dcfce7;
  color: #14532d;
}
.module-option.wrong {
  border: 2px solid #dc2626;
  background: #fee2e2;
  color: #7f1d1d;
}
.module-button {
  border: 0;
  border-radius: 8px;
  padding: 11px 18px;
  margin: 8px 6px 8px 0;
  background: #2563eb;
  color: white;
  cursor: pointer;
}
.module-button:disabled {
  opacity: .5;
  cursor: not-allowed;
}
.module-feedback {
  padding: 13px;
  border-radius: 9px;
  margin: 15px 0;
}
.module-feedback.correct {
  background: #dcfce7;
  color: #14532d;
}
.module-feedback.wrong {
  background: #fee2e2;
  color: #7f1d1d;
}
.module-term {
  padding: 12px;
  background: #f1f5f9;
  border-radius: 8px;
  margin: 9px 0;
}
.module-section {
  border-left: 4px solid #2563eb;
  padding: 12px 16px;
  margin: 16px 0;
  background: #f8fafc;
}
.module-answer {
  padding: 15px;
  border-radius: 9px;
  background: #ecfdf5;
  margin: 15px 0;
}
`;
document.head.appendChild(style);


// Safe element helpers
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function makeButton(text, callback, disabled = false) {
  const button = makeElement("button", "module-button", text);
  button.type = "button";
  button.disabled = disabled;
  button.addEventListener("click", callback);
  return button;
}

function makeProgress(current, total) {
  const track = makeElement("div", "module-progress");
  const fill = document.createElement("span");
  fill.style.width = `${(current / total) * 100}%`;
  track.appendChild(fill);
  return track;
}

function showHeading(title, subtitle) {
  const heading = makeElement("div", "module-title");
  heading.appendChild(makeElement("h2", "", title));
  if (subtitle) heading.appendChild(makeElement("p", "module-muted", subtitle));
  return heading;
}


// Summary module
function renderSummary(data) {
  resultBox.replaceChildren();
  resultBox.appendChild(showHeading(data.title || "Study Summary", data.overview));

  const pointsCard = makeElement("section", "module-card");
  pointsCard.appendChild(makeElement("h3", "", "Key Points"));

  (data.key_points || []).forEach((point, index) => {
    const item = makeElement("p", "", `${index + 1}. ${point}`);
    pointsCard.appendChild(item);
  });

  resultBox.appendChild(pointsCard);

  if (data.terms && data.terms.length) {
    const termsCard = makeElement("section", "module-card");
    termsCard.appendChild(makeElement("h3", "", "Important Terms"));

    data.terms.forEach(term => {
      const item = makeElement("div", "module-term");
      item.appendChild(makeElement("strong", "", term.term));
      item.appendChild(makeElement("p", "", term.meaning));
      termsCard.appendChild(item);
    });

    resultBox.appendChild(termsCard);
  }

  const conclusion = makeElement("section", "module-card");
  conclusion.appendChild(makeElement("h3", "", "Conclusion"));
  conclusion.appendChild(makeElement("p", "", data.conclusion || ""));
  resultBox.appendChild(conclusion);
}


// Report module
function renderReport(data) {
  resultBox.replaceChildren();
  resultBox.appendChild(showHeading(data.title || "Content Report", "Structured report"));

  (data.sections || []).forEach(section => {
    const block = makeElement("section", "module-section");
    block.appendChild(makeElement("h3", "", section.heading));
    block.appendChild(makeElement("p", "", section.content));
    resultBox.appendChild(block);
  });
}


// Quiz module
function renderQuiz(data) {
  resultBox.replaceChildren();

  const questions = data.questions || [];

  if (!questions.length) {
    resultBox.textContent = "No quiz questions were available.";
    return;
  }

  const question = questions[quizIndex];
  const card = makeElement("section", "module-card");

  card.appendChild(showHeading(data.title || "Knowledge Check"));
  card.appendChild(makeElement(
    "p",
    "module-muted",
    `Question ${quizIndex + 1} of ${questions.length}`
  ));
  card.appendChild(makeProgress(quizIndex + 1, questions.length));
  card.appendChild(makeElement("h3", "", question.question));

  const feedback = makeElement("div", "module-feedback", "");
  feedback.hidden = true;

  const optionButtons = [];

  question.options.forEach((option, index) => {
    const button = makeButton(
      `${String.fromCharCode(65 + index)}. ${option}`,
      () => {
        if (quizAnswered) return;

        optionButtons.forEach(item => item.classList.remove("selected"));
        button.classList.add("selected");
        card.dataset.selected = String(index);
        checkButton.disabled = false;
      }
    );

    button.classList.add("module-option");
    optionButtons.push(button);
    card.appendChild(button);
  });

  const checkButton = makeButton("Check Answer", () => {
    const chosen = Number(card.dataset.selected);
    const correct = Number(question.answer);

    quizAnswered = true;

    if (chosen === correct) {
      quizScore++;
      feedback.textContent = "Correct answer! Well done!";
      feedback.className = "module-feedback correct";
    } else {
      feedback.textContent =
        `Incorrect. Correct answer: ${String.fromCharCode(65 + correct)}. ${question.options[correct]}`;
      feedback.className = "module-feedback wrong";
    }

    if (question.explanation) {
      feedback.textContent += ` Explanation: ${question.explanation}`;
    }

    feedback.hidden = false;

    optionButtons.forEach((button, index) => {
      button.disabled = true;
      if (index === correct) button.classList.add("correct");
      else if (index === chosen) button.classList.add("wrong");
    });

    checkButton.hidden = true;
    nextButton.hidden = false;
  }, true);

  const nextButton = makeButton(
    quizIndex === questions.length - 1 ? "Finish Quiz" : "Next Question →",
    () => {
      if (quizIndex < questions.length - 1) {
        quizIndex++;
        quizAnswered = false;
        renderQuiz(data);
      } else {
        renderQuizFinish(data);
      }
    }
  );
  nextButton.hidden = true;

  card.appendChild(feedback);
  card.appendChild(checkButton);
  card.appendChild(nextButton);
  resultBox.appendChild(card);
}

function renderQuizFinish(data) {
  resultBox.replaceChildren();

  const card = makeElement("section", "module-card");
  card.appendChild(showHeading("Quiz Completed!"));
  card.appendChild(makeElement(
    "h2",
    "",
    `Your Score: ${quizScore} / ${data.questions.length}`
  ));

  card.appendChild(makeElement(
    "p",
    "",
    quizScore === data.questions.length
      ? "Excellent! You answered every question correctly."
      : "Good effort! Review the material and try again."
  ));

  card.appendChild(makeButton("Try Again", () => {
    quizIndex = 0;
    quizScore = 0;
    quizAnswered = false;
    renderQuiz(data);
  }));

  resultBox.appendChild(card);
}


// Study Q&A module
function renderStudy(data) {
  resultBox.replaceChildren();

  const questions = data.questions || [];

  if (!questions.length) {
    resultBox.textContent = "No study questions were available.";
    return;
  }

  const item = questions[studyIndex];
  const card = makeElement("section", "module-card");

  card.appendChild(showHeading(data.title || "Study Practice"));
  card.appendChild(makeElement(
    "p",
    "module-muted",
    `Question ${studyIndex + 1} of ${questions.length}`
  ));
  card.appendChild(makeProgress(studyIndex + 1, questions.length));
  card.appendChild(makeElement("h3", "", item.question));

  if (studyRevealed) {
    const answer = makeElement("div", "module-answer");
    answer.appendChild(makeElement("strong", "", "Answer"));
    answer.appendChild(makeElement("p", "", item.answer));
    card.appendChild(answer);
  } else {
    card.appendChild(makeElement(
      "p",
      "module-muted",
      "Think about your answer, then reveal it."
    ));
    card.appendChild(makeButton("Reveal Answer", () => {
      studyRevealed = true;
      renderStudy(data);
    }));
  }

  const navigation = makeElement("div", "");

  navigation.appendChild(makeButton("← Previous", () => {
    if (studyIndex > 0) {
      studyIndex--;
      studyRevealed = false;
      renderStudy(data);
    }
  }, studyIndex === 0));

  navigation.appendChild(makeButton(
    studyIndex === questions.length - 1 ? "Finish" : "Next →",
    () => {
      if (studyIndex < questions.length - 1) {
        studyIndex++;
        studyRevealed = false;
        renderStudy(data);
      } else {
        resultBox.replaceChildren();
        const finish = makeElement("section", "module-card");
        finish.appendChild(showHeading("Practice Completed!"));
        finish.appendChild(makeElement(
          "p",
          "",
          `You reviewed ${questions.length} study questions.`
        ));
        finish.appendChild(makeButton("Start Again", () => {
          studyIndex = 0;
          studyRevealed = false;
          renderStudy(data);
        }));
        resultBox.appendChild(finish);
      }
    }
  ));

  card.appendChild(navigation);
  resultBox.appendChild(card);
}


// Display the correct module
function renderResult(data) {
  currentData = data;

  if (data.type === "summary") renderSummary(data);
  else if (data.type === "quiz") renderQuiz(data);
  else if (data.type === "report") renderReport(data);
  else if (data.type === "questions") renderStudy(data);
  else throw new Error("Unknown result type.");
}


// Character count
sourceText.addEventListener("input", () => {
  charCount.textContent = `${sourceText.value.length.toLocaleString()} characters`;
});


// Selected transformation style
document.querySelectorAll(".output-option").forEach(option => {
  option.addEventListener("click", () => {
    document.querySelectorAll(".output-option").forEach(item => {
      item.classList.remove("selected");
    });
    option.classList.add("selected");
  });
});


// Clear
document.getElementById("clearBtn").addEventListener("click", () => {
  sourceText.value = "";
  fileInput.value = "";
  fileStatus.textContent = "No document selected";
  charCount.textContent = "0 characters";
  message.textContent = "";
  latestResult = "";
  currentData = null;
  downloadBtn.disabled = true;

  resultBox.textContent = "Your result will appear here.";
});


// Upload
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  if (file.size > 8 * 1024 * 1024) {
    message.textContent = "File size must be less than 8 MB.";
    fileInput.value = "";
    return;
  }

  fileStatus.textContent = `Reading ${file.name}...`;
  message.textContent = "";

  const form = new FormData();
  form.append("file", file);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: form
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Upload failed.");

    sourceText.value = data.text;
    charCount.textContent = `${data.characters.toLocaleString()} characters`;
    fileStatus.textContent = `✓ Loaded ${data.filename}`;
    message.textContent = "Document loaded successfully.";
    latestResult = "";
    downloadBtn.disabled = true;

  } catch (error) {
    fileStatus.textContent = "Could not load file";
    message.textContent = error.message;
  }
});


// Generate
generateBtn.addEventListener("click", async () => {
  const text = sourceText.value.trim();
  const outputType =
    document.querySelector('input[name="output"]:checked').value;
  const detailLevel = document.getElementById("detailLevel").value;

  if (text.length < 30) {
    message.textContent = "Please provide at least 30 characters.";
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";
  downloadBtn.disabled = true;
  latestResult = "";
  message.textContent = "";

  resultBox.textContent = "Preparing your result...";

  try {
    const response = await fetch("/api/transform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        output_type: outputType,
        detail_level: detailLevel
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.detail || "Generation failed.");
    }

    latestResult = responseData.result;

    const data = JSON.parse(latestResult);

    if (data.type !== outputType) {
      throw new Error("The returned result does not match the selected module.");
    }

    quizIndex = 0;
    quizScore = 0;
    quizAnswered = false;
    studyIndex = 0;
    studyRevealed = false;

    renderResult(data);

    downloadBtn.disabled = false;
    message.textContent = "Your content is ready!";

  } catch (error) {
    resultBox.textContent = "Could not display the result.";
    message.textContent = error.message;

  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = "<span>✦</span> Generate Result";
  }
});


// Download the generated data
downloadBtn.addEventListener("click", () => {
  if (!latestResult) return;

  let downloadText = latestResult;

  try {
    const data = JSON.parse(latestResult);
    downloadText = JSON.stringify(data, null, 2);
  } catch {
    // Keep original result if it is not JSON.
  }

  const blob = new Blob([downloadText], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "transformai-output.txt";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
});


// Backend health check
fetch("/api/health")
  .then(response => {
    if (!response.ok) throw new Error("Health check failed.");
    return response.json();
  })
  .then(data => {
    if (!data.ai_configured) {
      message.textContent =
        "Setup needed: enable Demo Mode or configure an AI service.";
    }
  })
  .catch(() => {
    message.textContent =
      "Cannot connect to the backend. Start the server using the README instructions.";
  });
