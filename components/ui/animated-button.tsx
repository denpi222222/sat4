'use client';
import { Button, type ButtonProps } from '@/components/ui/button';
import { motion } from 'framer-motion';
import React from 'react';

const MotionButton = motion.create(Button as any);

export function AnimatedButton(props: ButtonProps) {
  return (
    <MotionButton
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      {...props}
    />
  );
}
