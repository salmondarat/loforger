import React, { useState, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import type { AnswerValue, QuestionPresentation, CompatibilityIssue } from '../../types/index.js';
import { QuestionnaireEngine } from '../../engine/questionnaire-engine.js';
import { CompatibilityEngine } from '../../engine/compatibility-engine.js';
import QuestionCard from './QuestionCard.js';
import SummaryView from './SummaryView.js';
import ProgressBar from './ProgressBar.js';

interface AppProps {
  initialAnswers?: Record<string, AnswerValue>;
}

export const App: React.FC<AppProps> = ({ initialAnswers = {} }) => {
  const { exit } = useApp();
  const [engine] = useState(() => new QuestionnaireEngine(initialAnswers));
  const [compatEngine] = useState(() => new CompatibilityEngine());
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPresentation | null>(
    () => engine.getNextQuestion()
  );
  const [currentValue, setCurrentValue] = useState<AnswerValue>(null);
  const [issues, setIssues] = useState<CompatibilityIssue[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const activeFlow = engine.getActiveFlow();
  const currentIndex = activeFlow.findIndex(q => q.question.id === currentQuestion?.question.id);

  const handleAnswer = useCallback(() => {
    if (!currentQuestion) return;

    const result = engine.answer(currentQuestion.question.id, currentValue);
    
    if (!result.ok) {
      return;
    }

    const newIssues = compatEngine.check(engine.getAnswers());
    setIssues(newIssues);

    if (result.nextQuestion) {
      setCurrentQuestion(result.nextQuestion);
      setCurrentValue(result.nextQuestion.resolvedDefault);
    } else {
      setShowSummary(true);
    }
  }, [currentQuestion, currentValue, engine, compatEngine]);

  const handleBack = useCallback(() => {
    const previous = engine.goBack();
    if (previous) {
      setCurrentQuestion(previous);
      setCurrentValue(engine.getAnswers()[previous.question.id] ?? previous.resolvedDefault);
      setIssues(compatEngine.check(engine.getAnswers()));
    }
  }, [engine, compatEngine]);

  const handleConfirm = useCallback(() => {
    if (compatEngine.hasBlockingErrors(engine.getAnswers())) {
      return;
    }
    setIsComplete(true);
    exit();
  }, [engine, compatEngine, exit]);

  const handleEdit = useCallback(() => {
    setShowSummary(false);
    engine.reset();
    setCurrentQuestion(engine.getNextQuestion());
    setCurrentValue(null);
    setIssues([]);
  }, [engine]);

  useInput((input, key) => {
    if (showSummary) {
      if (key.return) {
        handleConfirm();
      } else if (input === 'e') {
        handleEdit();
      }
      return;
    }

    if (key.return && currentValue !== null) {
      handleAnswer();
    } else if (key.escape) {
      handleBack();
    }
  });

  if (isComplete) {
    return (
      <Box flexDirection="column">
        <Text color="green" bold>✓ Project configuration complete!</Text>
        <Text dimColor>Configuration saved. Ready to generate.</Text>
      </Box>
    );
  }

  if (showSummary) {
    return (
      <SummaryView
        summary={engine.getSummary()}
        issues={issues}
        onConfirm={handleConfirm}
        onEdit={handleEdit}
      />
    );
  }

  if (!currentQuestion) {
    return <Text>No questions available.</Text>;
  }

  return (
    <Box flexDirection="column" padding={1}>
      <ProgressBar 
        current={currentIndex + 1} 
        total={activeFlow.length}
        label={`Step ${currentIndex + 1} of ${activeFlow.length}`}
      />
      
      {issues.length > 0 && (
        <Box marginY={1}>
          {issues.map(issue => (
            <Text key={issue.id} color={issue.severity === 'error' ? 'red' : 'yellow'}>
              ⚠ {issue.title}
            </Text>
          ))}
        </Box>
      )}

      <Box marginY={1}>
        <QuestionCard
          presentation={currentQuestion}
          value={currentValue ?? currentQuestion.resolvedDefault}
          onChange={setCurrentValue}
        />
      </Box>

      <Box marginTop={2}>
        <Text dimColor>
          Press <Text bold>Enter</Text> to continue, <Text bold>Esc</Text> to go back
        </Text>
      </Box>
    </Box>
  );
};

export default App;
