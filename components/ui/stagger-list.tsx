'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { staggerChildren, fadeInUp } from './motion';

export function StaggerList({ children, delay = 0.06 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div variants={staggerChildren(delay)} initial="hidden" animate="show">
      {React.Children.map(children, (child) => (
        <motion.div variants={fadeInUp}>{child}</motion.div>
      ))}
    </motion.div>
  );
}
