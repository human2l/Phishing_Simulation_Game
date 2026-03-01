# SecurMail Pro (Phishing Simulation Game)

SecurMail Pro is an enterprise-level phishing security awareness training SaaS platform, specifically tailored for Australian businesses. It features a highly realistic, full-screen three-column enterprise UI that immerses employees in a simulated inbox environment to train and test their ability to identify phishing attempts.

## Core Features
- **Realistic Enterprise UI:** A fully immersive layout mimicking a modern professional email client.
- **AI-Powered Dataset:** Utilizing the Deepseek API to generate highly nuanced, context-aware phishing and authentic commercial emails.
- **10-Question Gamified Quiz:** Every session serves exactly 10 intelligently randomized scenarios.
- **Advanced Scoring Board:** Real-time 100-point scale evaluating True Positives (TP), True Negatives (TN), False Positives (FP), and False Negatives (FN).
- **Inline Clue Highlighting:** Phishing clues are emphasized directly within the email body after evaluation, offering immediate contextual feedback without disruptive popups.
- **Interactive Onboarding:** Built-in guided tutorial (`react-joyride`) for initial visits.
- **Australian Corporate Context:** Localized pure Australian English (`en-AU`).

## Tech Stack
- **Frontend:** Next.js (App Router), React 19, Tailwind CSS v4, Framer Motion
- **Backend:** Next.js API Routes (Serverless-ready)
- **AI Core:** Deepseek API (`deepseek-chat`) offline generation
- **Language:** TypeScript

## Getting Started

### Prerequisites
- Node.js (v20+)
- npm / yarn / pnpm

### Installation

1. Clone the repository and navigate to the root directory:
   ```bash
   cd Phishing_Simulation_Game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment Variables:
   Create a `.env.local` file to store your Deepseek key (needed only for regenerating the dataset):
   ```env
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```

4. Run the Dev Server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Architecture (Agent Workflow)
Development is steered by an AI-agent Agile framework:
- **Agent A (Architect):** Project management, scoping, and state tracking (`status.json`, `plan.md`).
- **Agent B (Frontend):** UI implementation, animations, and React components.
- **Agent C (Backend):** APIs, data generation scripts, and AI integrations.

## License
Proprietary and Confidential.
