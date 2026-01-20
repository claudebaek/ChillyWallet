import React from 'react';
import styled from 'styled-components/native';
import { TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const Container = styled.View`
  margin-bottom: 16px;
`;

const Label = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
`;

const StyledInput = styled.TextInput<{ hasError?: boolean }>`
  background-color: #f5f5f5;
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  color: #1a1a1a;
  border-width: 1px;
  border-color: ${({ hasError }) => (hasError ? '#FF3B30' : '#e0e0e0')};
`;

const ErrorText = styled.Text`
  font-size: 12px;
  color: #FF3B30;
  margin-top: 4px;
`;

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <Container>
      {label && <Label>{label}</Label>}
      <StyledInput
        hasError={!!error}
        placeholderTextColor="#999"
        {...props}
      />
      {error && <ErrorText>{error}</ErrorText>}
    </Container>
  );
};
