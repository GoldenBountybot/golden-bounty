import React from 'react';
import { Navigate } from 'react-router-dom';

// Accounts are created automatically from the player's Telegram identity,
// so there is no separate sign-up step.
export default function Register() {
  return <Navigate to="/login" replace />;
}