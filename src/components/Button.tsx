import React from 'react';
import styled from 'styled-components/native';
import { ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
}

const ButtonContainer = styled.TouchableOpacity<{ variant: string; disabled?: boolean }>`
  padding: 16px 24px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  background-color: ${({ variant, disabled }) => {
    if (disabled) return '#ccc';
    switch (variant) {
      case 'primary':
        return '#007AFF';
      case 'secondary':
        return '#5856D6';
      case 'outline':
        return 'transparent';
      default:
        return '#007AFF';
    }
  }};
  border-width: ${({ variant }) => (variant === 'outline' ? '2px' : '0')};
  border-color: #007AFF;
`;

const ButtonText = styled.Text<{ variant: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${({ variant }) => (variant === 'outline' ? '#007AFF' : '#fff')};
`;

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}) => {
  return (
    <ButtonContainer
      variant={variant}
      disabled={disabled || loading}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#007AFF' : '#fff'} />
      ) : (
        <ButtonText variant={variant}>{title}</ButtonText>
      )}
    </ButtonContainer>
  );
};
