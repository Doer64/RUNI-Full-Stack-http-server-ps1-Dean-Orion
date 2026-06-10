const { createServer } = require("./server");

const app = createServer();

app.resource("/question").get((req, res) => {
  res.status(200).body("What is the capital of Italy?").send();
});

app.resource("/answer").get((req, res) => {
  res
    .status(206)
    .body(
      `GET /answer ?! You thought I would just give you the answer like that? 
Write your answer in a post request to /answer/:text like so /answer/London`,
    )
    .send();
});

let numOfTries = 0;

app.resource("/answer/:text").post((req, res) => {
  const answer = req.params.text;
  numOfTries++;
  if (answer.toLowerCase() === "rome" && numOfTries == 1) {
    res.status(200).body("Nice! \nFirst try!").send();
  } else if (answer.toLowerCase() === "rome" && numOfTries > 1) {
    res
      .status(200)
      .body(`Correct!\nThat took you ${numOfTries} tries. Proud of you!`)
      .send();
  } else {
    res.status(200).body(`Wrong! Try again.`).send();
  }
  lastAnswer = answer;
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
