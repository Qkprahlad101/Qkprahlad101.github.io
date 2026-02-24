# Project Context: Prahlad Kumar's Portfolio

## 🚀 Overview
A high-performance, responsive personal portfolio website for **Prahlad Kumar**, a Software Developer and Android Engineer. The site uses a sleek, modal-based single-page architecture with rich animations.

## 🛠 Technology Stack
- **Structure**: HTML5 (Semantic)
- **Styling**: 
  - Vanilla CSS3 (via `assets/css/main.css`)
  - Bootstrap 4.4.1 (for UI components like cards)
  - FontAwesome (for icons)
  - Sass (source files in `assets/sass`)
- **Logic**:
  - jQuery (v3.4.1 slim)
  - Custom JS (`assets/js/main.js` for navigation and animations)
  - Helper libraries: `util.js`, `breakpoints.js`, `browser.js`
- **Template**: Based on "Dimension" by HTML5 UP.

## 📁 Directory Structure
- `/index.html`: Main entry point containing all content sections.
- `/assets/`:
  - `css/`: Compiled stylesheets.
  - `js/`: Interactivity logic.
  - `sass/`: Modular styling source files.
  - `webfonts/`: FontAwesome and icon fonts.
- `/images/`: High-quality assets (profile pictures, project thumbnails, backgrounds).

## 🧩 Key Components & Features
1. **Header & Navigation**: 
   - Centered logo (`icon fa-fire`) and title.
   - Hash-based navigation (`#intro`, `#work`, `#about`, `#research`, `#contact`).
2. **Sections (Articles)**:
   - **Intro**: Career summary and high-res image.
   - **Skills**: Categorized list (Beginner, Intermediate, Advanced) using Bootstrap grid.
   - **Projects**: Portfolio of work using Bootstrap dark cards with links to GitHub.
   - **Research**: Highlights of academic/professional research projects.
   - **Contact**: Social icons linking to LinkedIn, GitHub, and Facebook.
3. **Animations**:
   - Page load fade-in.
   - Smooth article transitions (Fade/Blur effects managed by `main.js`).
   - Modal-style overlay for each section.
4. **Background**: Dynamic background image/overlay managed via `#bg`.

## 🧠 Workflows & Patterns
- **Adding a New Project**:
  - Open `index.html`.
  - Locate `<article id="about">`.
  - Add a new `<div class="card bg-dark text-white">` block with appropriate images and descriptions.
- **Updating Skills**:
  - Locate `<article id="work">`.
  - Update the `ul` lists under the Beginner/Intermediate/Advanced columns.
- **Modifying Animations**:
  - Logic is in `assets/js/main.js` under `$main._show` and `$main._hide`.
  - Timing is controlled by the `delay` variable (default: 325ms).

## 🔍 SEO & Meta
- **Title**: Prahlad Kumar
- **Viewport**: Mobile-optimized (`width=device-width, initial-scale=1.0`).
- **Styles**: Optimized loading with legacy support for non-JS browsers (`noscript.css`).

---
*Created for fast context retrieval by Antigravity.*
