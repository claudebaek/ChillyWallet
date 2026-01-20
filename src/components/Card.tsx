import styled from 'styled-components/native';

export const Card = styled.View`
  background-color: #fff;
  border-radius: 16px;
  padding: 20px;
  margin: 8px 0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 3;
`;

export const CardTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
`;

export const CardContent = styled.View`
  flex: 1;
`;
