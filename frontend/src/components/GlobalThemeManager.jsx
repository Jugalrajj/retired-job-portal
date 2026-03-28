import React from 'react';
import useThemeStore from '../context/useThemeStore';

const GlobalThemeManager = () => {
  // Destructure theme. We no longer need toggleTheme or setTheme here 
  // because we removed the useEffect that forced the theme change on load.
  const { theme } = useThemeStore();

  return (
    <style>{`
      :root {
        /* --- BRAND COLORS (Professional Gold/Amber) --- */
        --primary: #f59e0b;       /* Amber 500 */
        --primary-hover: #d97706; /* Amber 600 */
        
        /* --- STATUS COLORS --- */
        --success: #10b981;       /* Emerald 500 */
        --danger: #ef4444;        /* Red 500 */
        --warning: #f59e0b;       /* Amber 500 */
        --info: #3b82f6;          /* Blue 500 */
        
        /* --- DYNAMIC VARIABLES --- */
        /* Logic Swapped: Checks for 'light' explicitly. If not light (or loading), defaults to DARK */
        ${theme === 'light' ? `
          /* === PROFESSIONAL LIGHT MODE (Crisp & Clean) === */
          --bg-root: #f8fafc;        /* Slate 50 - Very subtle off-white */
          --bg-sidebar: #ffffff;     /* Pure White */
          --bg-card: #ffffff;        /* Pure White */
          --bg-input: #f1f5f9;       /* Slate 100 - Clean input background */
          --bg-hover: #e2e8f0;       /* Hover state background */

          --border: #e2e8f0;         /* Slate 200 - Very subtle borders */
          
          --text-main: #0f172a;      /* Slate 900 - Deep, Dark Blue-Black */
          --text-sub: #64748b;       /* Slate 500 - Classy gray */
          --text-muted: #94a3b8;     /* Slate 400 */
          
          --primary-dim: rgba(245, 158, 11, 0.1);
          --glass: rgba(255, 255, 255, 0.85);
          --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        ` : `
          /* === TRUE DARK / BLACK THEME (DEFAULT) === */
          --bg-root: #000000;        /* Pure Black Background */
          --bg-sidebar: #0a0a0a;     /* Almost Black Sidebar */
          --bg-card: #111111;        /* Deep Gray Card */
          --bg-input: #1a1a1a;       /* Dark Input Fields */
          --bg-hover: #222222;       /* Dark Hover State */
          
          --border: #333333;         /* Dark Neutral Border */
          
          --text-main: #ffffff;      /* Pure White Text */
          --text-sub: #a3a3a3;       /* Neutral Gray Text */
          --text-muted: #525252;     /* Darker Gray Text */
          
          --primary-dim: rgba(245, 158, 11, 0.15); 
          --glass: rgba(10, 10, 10, 0.8);
          --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.8);
        `}
      }

      /* --- GLOBAL RESET & FIXES --- */
      html {
        height: 100%;
        margin: 0;
        padding: 0;
        scroll-behavior: smooth;
      }

      body {
        background-color: var(--bg-root); /* Forces theme color everywhere */
        color: var(--text-main);
        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        transition: background-color 0.3s ease, color 0.3s ease;
        
        min-height: 100vh; 
        width: 100%;
        margin: 0;
        padding: 0;
        overflow-x: hidden; 
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      #root {
        min-height: 100vh; 
        display: flex;
        flex-direction: column;
      }

      /* --- MODERN SCROLLBAR --- */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: var(--bg-root);
      }
      ::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: var(--text-sub);
      }

      /* --- UTILITY CLASSES --- */
      .fade-in { animation: fadeIn 0.4s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `}</style>
  );
};

export default GlobalThemeManager;