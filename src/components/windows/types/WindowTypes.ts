import React from 'react';

export interface WindowTheme {
  headerBg?: string;
  headerText?: string;
  headerBorder?: string;
  bodyBg?: string;
  bodyText?: string;
  accentColor?: string;
  glassEffect?: boolean;
  borderColor?: string;
  shadowColor?: string;
}

export interface WindowType {
  id: string;
  title: string;
  content: React.ReactNode;
  isOpen: boolean;
  isMinimized?: boolean;
  zIndex: number;
  icon?: React.ReactNode;
  showInStartMenu?: boolean;
  showInTaskbar?: boolean;
  isResizable?: boolean;
  isMaximizable?: boolean;
  isClosable?: boolean;
  defaultSize?: {
    width: number;
    height: number;
  };
  defaultPosition?: {
    x: number;
    y: number;
  };
  theme?: WindowTheme;
}
