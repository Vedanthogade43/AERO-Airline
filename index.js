import express from 'express';
import app from './server/index.js';

// Vercel detects and deploys this default-exported Express application.
void express;
export default app;
