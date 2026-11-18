import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { NonHomeHeader } from "@/components";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getSellQuizState, markSellQuizCompleted } from "@/core/client";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Choice = {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
};

type Question = {
  id: string;
  title: string;
  choices: Choice[];
};

function createQuizQuestions(
  t: (k: string, o?: Record<string, unknown>) => string,
): Question[] {
  return [
    {
      id: "separate-bank",
      title: t("SELL_QUIZ_Q1_TITLE"),
      choices: [
        {
          id: "protect-account",
          text: t("SELL_QUIZ_Q1_A1"),
          isCorrect: true,
          explanation: t("SELL_QUIZ_Q1_A1_EXPL"),
        },
        {
          id: "tax-savings",
          text: t("SELL_QUIZ_Q1_A2"),
          isCorrect: false,
          explanation: t("SELL_QUIZ_Q1_A2_EXPL"),
        },
      ],
    },
    {
      id: "smart-limits",
      title: t("SELL_QUIZ_Q2_TITLE"),
      choices: [
        {
          id: "reduce-freezes",
          text: t("SELL_QUIZ_Q2_A1"),
          isCorrect: true,
          explanation: t("SELL_QUIZ_Q2_A1_EXPL"),
        },
        {
          id: "restrict-users",
          text: t("SELL_QUIZ_Q2_A2"),
          isCorrect: false,
          explanation: t("SELL_QUIZ_Q2_A2_EXPL"),
        },
      ],
    },
  ];
}

export function SellQuiz() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const QUIZ_QUESTIONS = useMemo(() => createQuizQuestions(t), [t]);
  const { track } = useAnalytics();

  // If quiz already completed, skip
  useEffect(() => {
    const res = getSellQuizState();
    if (res.isOk() && res.value.completed) {
      // Replace history so back does not return to quiz once completed
      navigate(INTERNAL_HREFS.SELL_PREVIEW, {
        state: locationState,
        replace: true,
      });
    }
  }, [navigate, locationState]);

  // Analytics: quiz started (once per mount, only when actually shown)
  const startedAtRef = useRef(Date.now());
  const wrongAnswersRef = useRef(0);
  useEffect(() => {
    const res = getSellQuizState();
    if (res.isOk() && res.value.completed) return;
    track(EVENTS.TRANSACTION, {
      transaction_type: "sell",
      status: "quiz_started",
    });
  }, [track]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLastSlide, setIsLastSlide] = useState(false);

  const question = QUIZ_QUESTIONS[currentIndex];
  const progress = useMemo(() => {
    return ((currentIndex + (selected ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100;
  }, [currentIndex, selected, QUIZ_QUESTIONS.length]);

  useEffect(() => {
    setIsLastSlide(currentIndex === QUIZ_QUESTIONS.length - 1);
  }, [currentIndex, QUIZ_QUESTIONS.length]);

  const selectedChoice = question.choices.find((c) => c.id === selected);
  const isAnswerCorrect = selectedChoice?.isCorrect ?? false;

  // Continue is enabled as soon as the correct answer is picked — the
  // explanation stays on screen, so there's no forced wait.
  const handleChoice = (value: string) => {
    setSelected(value);
    setShowExplanation(true);

    const chosen = question.choices.find((c) => c.id === value);
    if (chosen && !chosen.isCorrect) {
      wrongAnswersRef.current += 1;
      track(EVENTS.TRANSACTION, {
        transaction_type: "sell",
        status: "quiz_wrong_answer",
        questionId: question.id,
        choiceId: chosen.id,
      });
    }
  };

  const handleNext = () => {
    if (!selected) return;
    if (!isAnswerCorrect) return;

    if (isLastSlide) {
      // Mark one-time completion and replace so back doesn't land on quiz
      markSellQuizCompleted();
      track(EVENTS.TRANSACTION, {
        transaction_type: "sell",
        status: "quiz_completed",
        wrongAnswers: wrongAnswersRef.current,
        durationMs: Date.now() - startedAtRef.current,
      });
      navigate(INTERNAL_HREFS.SELL_PREVIEW, {
        state: locationState,
        replace: true,
      });
      return;
    }

    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setShowExplanation(false);
  };

  return (
    <>
      <NonHomeHeader title={t("SELL_USDC")} />
      <main className="container-narrow flex h-full w-full flex-col gap-6 py-6">
        <section className="flex w-full items-center justify-center">
          <Progress className="h-3 w-full" value={progress} />
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="font-medium text-xl">{question.title}</h2>
          <RadioGroup
            value={selected ?? undefined}
            onValueChange={handleChoice}
            className="gap-3">
            {question.choices.map((choice) => {
              const isSelected = selected === choice.id;
              const stateColor = isSelected
                ? choice.isCorrect
                  ? "border-primary"
                  : "border-destructive"
                : "border-primary/20";
              return (
                <Card
                  key={choice.id}
                  className={cn(
                    "w-full cursor-pointer border-2 bg-background/40 p-3 transition",
                    stateColor,
                  )}
                  onClick={() => handleChoice(choice.id)}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={choice.id} />
                    <p className="text-sm">{choice.text}</p>
                  </div>
                </Card>
              );
            })}
          </RadioGroup>
          {showExplanation && selectedChoice ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}>
              <Alert variant={isAnswerCorrect ? "default" : "warning"}>
                {isAnswerCorrect ? (
                  <CheckCircle2 className="text-success" />
                ) : (
                  <AlertTriangle />
                )}
                <AlertDescription
                  className={isAnswerCorrect ? "text-success" : undefined}>
                  {selectedChoice.explanation}
                </AlertDescription>
              </Alert>
              {isAnswerCorrect ? null : (
                <p className="mt-2 text-center text-destructive text-xs">
                  {t("SELL_QUIZ_TRY_AGAIN")}
                </p>
              )}
            </motion.div>
          ) : null}
        </section>
      </main>
      <footer className="container-narrow flex w-full items-center justify-center gap-2 p-4">
        <div className="w-full">
          <Button
            onClick={handleNext}
            disabled={!showExplanation || !isAnswerCorrect}
            className="w-full p-6">
            {isLastSlide ? t("SELL_QUIZ_FINISH") : t("SELL_QUIZ_NEXT")}
          </Button>
        </div>
      </footer>
    </>
  );
}
