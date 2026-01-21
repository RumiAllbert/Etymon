"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Home,
} from "lucide-react";
import type { Quiz, QuizQuestion } from "@/utils/schema";
import Spinner from "@/components/spinner";
import Link from "next/link";

type QuizType = "mixed" | "guess_origin" | "match_meaning" | "word_family";
type Difficulty = "easy" | "medium" | "hard";

async function fetchQuiz(
  type: QuizType,
  difficulty: Difficulty,
  count: number
): Promise<Quiz> {
  const response = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, difficulty, count }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate quiz");
  }

  return response.json();
}

export default function QuizPage() {
  const [quizType, setQuizType] = useState<QuizType>("mixed");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const {
    data: quiz,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["quiz", quizType, difficulty, questionCount],
    queryFn: () => fetchQuiz(quizType, difficulty, questionCount),
    enabled: quizStarted,
  });

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setAnswers([]);
    setShowResult(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered || !quiz) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    const question = quiz.questions[currentQuestion];
    const isCorrect = answer === question.correctAnswer;

    if (isCorrect) {
      setScore((prev) => prev + question.points);
    }

    setAnswers((prev) => [...prev, answer]);
  };

  const nextQuestion = () => {
    if (!quiz) return;

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setScore(0);
    setAnswers([]);
    setShowResult(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  const question = quiz?.questions[currentQuestion];
  const maxScore = quiz?.questions.reduce((acc, q) => acc + q.points, 0) || 0;

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-white dark:text-gray-100 text-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Back to Etymon</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-serif">Etymology Quiz</h1>
          </div>
        </div>

        {!quizStarted ? (
          /* Quiz Setup */
          <div className="space-y-8">
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-serif mb-2">Test Your Etymology Knowledge</h2>
              <p className="text-gray-500">
                Challenge yourself with questions about word origins, meanings,
                and language history.
              </p>
            </div>

            <div className="space-y-6 p-6 rounded-xl dark:bg-gray-800/50 bg-gray-50/50">
              {/* Quiz Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quiz Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "mixed", label: "Mixed Questions" },
                    { value: "guess_origin", label: "Guess the Origin" },
                    { value: "match_meaning", label: "Match the Meaning" },
                    { value: "word_family", label: "Word Families" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setQuizType(option.value as QuizType)}
                      className={`p-3 rounded-lg border transition-colors ${
                        quizType === option.value
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "easy", label: "Easy", color: "green" },
                    { value: "medium", label: "Medium", color: "yellow" },
                    { value: "hard", label: "Hard", color: "red" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDifficulty(option.value as Difficulty)}
                      className={`p-3 rounded-lg border transition-colors ${
                        difficulty === option.value
                          ? `border-${option.color}-500 bg-${option.color}-500/10 text-${option.color}-400`
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Questions
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`p-3 rounded-lg border transition-colors ${
                        questionCount === count
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              Start Quiz
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : isLoading ? (
          /* Loading */
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner variant="wordTree" />
            <p className="mt-4 text-gray-500">Generating your quiz...</p>
          </div>
        ) : error ? (
          /* Error */
          <div className="text-center py-20">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-4">Failed to generate quiz</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </button>
          </div>
        ) : showResult ? (
          /* Results */
          <div className="text-center py-8 space-y-8">
            <div>
              <Trophy
                className={`w-20 h-20 mx-auto mb-4 ${
                  score / maxScore >= 0.8
                    ? "text-yellow-500"
                    : score / maxScore >= 0.5
                    ? "text-gray-400"
                    : "text-amber-700"
                }`}
              />
              <h2 className="text-3xl font-serif mb-2">Quiz Complete!</h2>
              <p className="text-5xl font-bold text-blue-500 my-4">
                {score} / {maxScore}
              </p>
              <p className="text-gray-500">
                You answered{" "}
                {answers.filter(
                  (a, i) => a === quiz?.questions[i].correctAnswer
                ).length}{" "}
                out of {quiz?.questions.length} questions correctly
              </p>
            </div>

            {/* Review answers */}
            <div className="space-y-4 text-left">
              <h3 className="font-medium">Review Your Answers</h3>
              {quiz?.questions.map((q, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg ${
                    answers[i] === q.correctAnswer
                      ? "dark:bg-green-500/10 bg-green-50 border border-green-500/20"
                      : "dark:bg-red-500/10 bg-red-50 border border-red-500/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {answers[i] === q.correctAnswer ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{q.question}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Your answer: {answers[i]}
                        {answers[i] !== q.correctAnswer && (
                          <span className="text-green-500 ml-2">
                            Correct: {q.correctAnswer}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={resetQuiz}
                className="flex-1 py-3 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                New Quiz
              </button>
              <Link
                href="/"
                className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Back to Etymon
              </Link>
            </div>
          </div>
        ) : question ? (
          /* Question */
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm">
              <span>
                Question {currentQuestion + 1} of {quiz?.questions.length}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                {score} points
              </span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${
                    ((currentQuestion + 1) / (quiz?.questions.length || 1)) * 100
                  }%`,
                }}
              />
            </div>

            {/* Question */}
            <div className="p-6 rounded-xl dark:bg-gray-800/50 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    question.difficulty === "easy"
                      ? "bg-green-500/20 text-green-400"
                      : question.difficulty === "medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {question.difficulty}
                </span>
                <span className="text-xs text-gray-500">
                  {question.points} points
                </span>
              </div>
              <h2 className="text-xl font-serif mb-6">{question.question}</h2>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option, i) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === question.correctAnswer;
                  const showCorrect = isAnswered && isCorrect;
                  const showIncorrect = isAnswered && isSelected && !isCorrect;

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(option)}
                      disabled={isAnswered}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        showCorrect
                          ? "border-green-500 bg-green-500/10"
                          : showIncorrect
                          ? "border-red-500 bg-red-500/10"
                          : isSelected
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            showCorrect
                              ? "bg-green-500 text-white"
                              : showIncorrect
                              ? "bg-red-500 text-white"
                              : "bg-gray-700"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{option}</span>
                        {showCorrect && (
                          <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                        )}
                        {showIncorrect && (
                          <XCircle className="w-5 h-5 text-red-500 ml-auto" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {isAnswered && (
                <div className="mt-6 p-4 rounded-lg dark:bg-gray-900/50 bg-gray-100/50">
                  <p className="text-sm">{question.explanation}</p>
                </div>
              )}
            </div>

            {/* Next button */}
            {isAnswered && (
              <button
                onClick={nextQuestion}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {currentQuestion < (quiz?.questions.length || 0) - 1
                  ? "Next Question"
                  : "See Results"}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
