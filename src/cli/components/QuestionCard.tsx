import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import type { QuestionPresentation, AnswerValue } from '../../types/index.js';
import OptionList from './OptionList.js';

interface QuestionCardProps {
  presentation: QuestionPresentation;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ presentation, value, onChange }) => {
  const { question, resolvedOptions, resolvedDefault } = presentation;

  useEffect(() => {
    if (value === null && resolvedDefault !== null) {
      onChange(resolvedDefault);
    }
  }, [resolvedDefault]);

  if (question.type === 'text') {
    return (
      <Box flexDirection="column">
        <Text bold>{question.prompt}</Text>
        {question.hint && <Text dimColor>{question.hint}</Text>}
        <Text>Text input: {value || '(empty)'}</Text>
      </Box>
    );
  }

  if (question.type === 'confirm') {
    return (
      <Box flexDirection="column">
        <Text bold>{question.prompt}</Text>
        {question.hint && <Text dimColor>{question.hint}</Text>}
        <Text>Press Enter to confirm...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>{question.group.toUpperCase()}</Text>
      <Text bold>{question.prompt}</Text>
      {question.hint && <Text dimColor>{question.hint}</Text>}
      <Box marginY={1}>
        {resolvedOptions && (
          <OptionList
            options={resolvedOptions}
            type={question.type === 'multi' ? 'multi' : 'single'}
            value={value as string | string[] | null}
            onChange={onChange}
          />
        )}
      </Box>
    </Box>
  );
};

export default QuestionCard;
