import React, { useState } from 'react';
import { BookOpen, Code, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface Exercise {
  question: string;
  code: string;
  answer: string;
  hint: string;
  validate?: 'exact' | 'color' | 'length' | 'className' | 'number';
}

interface CodeExample {
  label: string;
  lines: string[];
}

interface TopicData {
  title: string;
  icon: React.ReactNode;
  explanation: string;
  examples: CodeExample[];
  exercises: Exercise[];
}

// ── Topic data ──────────────────────────────────────────────────────────────

const topics: Record<string, TopicData> = {
  'html-basics': {
    title: 'HTML Basics',
    icon: <BookOpen size={14} />,
    explanation:
      'HTML5 documents begin with <!DOCTYPE html> to trigger standards mode. The root <html> element wraps <head> (metadata, title, linked resources) and <body> (visible content). Headings h1-h6 create a document outline, <p> defines paragraphs, <br> inserts line breaks, <hr> draws a horizontal rule, and <!-- --> creates comments. Character entities like &amp; and &lt; render reserved symbols.',
    examples: [
      {
        label: 'Document skeleton',
        lines: [
          '<!DOCTYPE html>',
          '<html lang="en">',
          '<head>',
          '  <meta charset="UTF-8" />',
          '  <meta name="viewport"',
          '    content="width=device-width, initial-scale=1.0" />',
          '  <title>My First Page</title>',
          '</head>',
          '<body>',
          '  <h1>Hello, World!</h1>',
          '  <p>Welcome to the web.</p>',
          '</body>',
          '</html>',
        ],
      },
      {
        label: 'Headings, paragraphs, br, hr',
        lines: [
          '<h1>Main Title</h1>',
          '<h2>Subtitle</h2>',
          '<h3>Section Heading</h3>',
          '<h4>Subsection</h4>',
          '<h5>Minor Heading</h5>',
          '<h6>Smallest Heading</h6>',
          '',
          '<p>First paragraph of content.</p>',
          '<p>Second paragraph with a<br />line break.</p>',
          '<hr />',
          '<!-- This is an HTML comment -->',
          '<p>Content after the horizontal rule.</p>',
        ],
      },
      {
        label: 'Character entities',
        lines: [
          '<!-- Reserved characters need entities -->',
          '<p>5 &lt; 10 and 10 &gt; 5</p>',
          '<p>AT&amp;T Corporation</p>',
          '<p>&quot;Quoted text&quot;</p>',
          '<p>Non-breaking&nbsp;space</p>',
          '<p>&copy; 2025 My Company</p>',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the HTML5 document type declaration:',
        code: '<!DOCTYPE ___>',
        answer: 'html',
        hint: 'HTML5 uses a simple declaration with just the language name.',
      },
      {
        question: 'Which tag defines the page title shown in the browser tab?',
        code: '<___>My Page</___>',
        answer: 'title',
        hint: 'This tag goes inside <head> and sets the browser tab text.',
      },
    ],
  },

  'text-links': {
    title: 'Text & Links',
    icon: <Code size={14} />,
    explanation:
      'Inline text elements add semantic meaning: <strong> for important text (bold), <em> for emphasis (italic), <mark> for highlighted text, <small> for side comments, <sub>/<sup> for subscripts/superscripts. The anchor tag <a> creates hyperlinks with href for the URL, target="_blank" to open in a new tab, and rel="noopener noreferrer" for security. URLs can be absolute, relative, or special (mailto:, tel:). Fragment links (#id) jump to page sections.',
    examples: [
      {
        label: 'Inline text formatting',
        lines: [
          '<p>This is <strong>bold and important</strong> text.</p>',
          '<p>This is <em>emphasized</em> text.</p>',
          '<p>This is <mark>highlighted</mark> text.</p>',
          '<p>This is <small>smaller side text</small>.</p>',
          '<p>H<sub>2</sub>O is water.</p>',
          '<p>E = mc<sup>2</sup></p>',
          '<p><del>Old price: $50</del></p>',
          '<p><ins>New price: $35</ins></p>',
        ],
      },
      {
        label: 'Anchor tags and link types',
        lines: [
          '<!-- Absolute URL -->',
          '<a href="https://example.com">Visit Example</a>',
          '',
          '<!-- Open in new tab (secure) -->',
          '<a href="https://example.com"',
          '   target="_blank"',
          '   rel="noopener noreferrer">New Tab</a>',
          '',
          '<!-- Relative URL -->',
          '<a href="/about">About Page</a>',
          '<a href="../index.html">Go Back</a>',
          '',
          '<!-- Email and phone -->',
          '<a href="mailto:hi@example.com">Email Us</a>',
          '<a href="tel:+1234567890">Call Us</a>',
          '',
          '<!-- Bookmark / fragment link -->',
          '<a href="#section2">Jump to Section 2</a>',
          '<h2 id="section2">Section 2</h2>',
        ],
      },
    ],
    exercises: [
      {
        question: 'Which tag makes text bold with semantic importance?',
        code: '<___>Important text</___>',
        answer: 'strong',
        hint: 'This tag conveys strong importance, not just visual boldness.',
      },
      {
        question: 'What attribute opens a link in a new browser tab?',
        code: '<a href="https://example.com" ___="_blank">Link</a>',
        answer: 'target',
        hint: 'This attribute specifies where to open the linked document.',
      },
    ],
  },

  'lists-tables': {
    title: 'Lists & Tables',
    icon: <BookOpen size={14} />,
    explanation:
      'Unordered lists (<ul>) display bullet points, ordered lists (<ol>) display numbered items, and both use <li> for items. Lists can nest inside each other. Definition lists (<dl>) pair terms (<dt>) with descriptions (<dd>). Tables use <table>, <thead>, <tbody>, <tr> for rows, <th> for headers, and <td> for data cells. The colspan and rowspan attributes let cells span multiple columns or rows. Add <caption> for table descriptions.',
    examples: [
      {
        label: 'Lists and nesting',
        lines: [
          '<!-- Unordered list -->',
          '<ul>',
          '  <li>HTML</li>',
          '  <li>CSS',
          '    <ul>',
          '      <li>Flexbox</li>',
          '      <li>Grid</li>',
          '    </ul>',
          '  </li>',
          '  <li>JavaScript</li>',
          '</ul>',
          '',
          '<!-- Ordered list -->',
          '<ol>',
          '  <li>First step</li>',
          '  <li>Second step</li>',
          '  <li>Third step</li>',
          '</ol>',
          '',
          '<!-- Definition list -->',
          '<dl>',
          '  <dt>HTML</dt>',
          '  <dd>HyperText Markup Language</dd>',
          '  <dt>CSS</dt>',
          '  <dd>Cascading Style Sheets</dd>',
          '</dl>',
        ],
      },
      {
        label: 'Table with colspan and rowspan',
        lines: [
          '<table>',
          '  <caption>Quarterly Sales</caption>',
          '  <thead>',
          '    <tr>',
          '      <th>Product</th>',
          '      <th>Q1</th>',
          '      <th>Q2</th>',
          '    </tr>',
          '  </thead>',
          '  <tbody>',
          '    <tr>',
          '      <td>Widget A</td>',
          '      <td>$500</td>',
          '      <td>$700</td>',
          '    </tr>',
          '    <tr>',
          '      <td>Widget B</td>',
          '      <td colspan="2">Data unavailable</td>',
          '    </tr>',
          '    <tr>',
          '      <td rowspan="2">Widget C</td>',
          '      <td>$300</td>',
          '      <td>$400</td>',
          '    </tr>',
          '    <tr>',
          '      <td>$350</td>',
          '      <td>$450</td>',
          '    </tr>',
          '  </tbody>',
          '</table>',
        ],
      },
    ],
    exercises: [
      {
        question: 'Which tag creates an unordered (bulleted) list?',
        code: '<___>\n  <li>Item one</li>\n  <li>Item two</li>\n</___>',
        answer: 'ul',
        hint: 'Two letters: the abbreviation for "unordered list".',
      },
      {
        question: 'Make a table cell span 3 columns:',
        code: '<td ___="3">Spanning cell</td>',
        answer: 'colspan',
        hint: 'This attribute merges cells horizontally across columns.',
      },
    ],
  },

  forms: {
    title: 'Forms',
    icon: <Code size={14} />,
    explanation:
      'The <form> element wraps input controls and specifies action (URL) and method (GET/POST). Input types include text, email, password, number, date, checkbox, radio, file, range, and color. <select> with <option> creates dropdowns, <textarea> handles multi-line text. The <label> element links to inputs via the for attribute. Group related fields with <fieldset> and <legend>. Validation attributes include required, placeholder, pattern, min, max, and minlength.',
    examples: [
      {
        label: 'Form with various input types',
        lines: [
          '<form action="/api/register" method="POST">',
          '  <fieldset>',
          '    <legend>Account Details</legend>',
          '',
          '    <label for="username">Username:</label>',
          '    <input type="text" id="username"',
          '      required minlength="3" maxlength="20" />',
          '',
          '    <label for="email">Email:</label>',
          '    <input type="email" id="email"',
          '      placeholder="you@example.com" required />',
          '',
          '    <label for="pwd">Password:</label>',
          '    <input type="password" id="pwd"',
          '      pattern="(?=.*\\d).{8,}"',
          '      title="8+ chars, at least one digit" />',
          '',
          '    <label for="age">Age:</label>',
          '    <input type="number" id="age"',
          '      min="13" max="120" />',
          '',
          '    <label for="dob">Birthday:</label>',
          '    <input type="date" id="dob" />',
          '  </fieldset>',
          '</form>',
        ],
      },
      {
        label: 'Checkboxes, radios, selects, file, range',
        lines: [
          '<form>',
          '  <!-- Checkboxes -->',
          '  <label>',
          '    <input type="checkbox" name="agree" required />',
          '    I agree to the terms',
          '  </label>',
          '',
          '  <!-- Radio buttons -->',
          '  <input type="radio" name="plan" value="free" /> Free',
          '  <input type="radio" name="plan" value="pro" /> Pro',
          '',
          '  <!-- Select dropdown -->',
          '  <select name="country">',
          '    <option value="">Choose country</option>',
          '    <option value="us">United States</option>',
          '    <option value="uk">United Kingdom</option>',
          '    <option value="in">India</option>',
          '  </select>',
          '',
          '  <!-- File upload -->',
          '  <input type="file" accept=".jpg,.png,.pdf" />',
          '',
          '  <!-- Range slider -->',
          '  <input type="range" min="0" max="100" step="5" />',
          '',
          '  <!-- Color picker -->',
          '  <input type="color" value="#3b82f6" />',
          '',
          '  <textarea rows="4" placeholder="Message..."></textarea>',
          '  <button type="submit">Submit</button>',
          '  <button type="reset">Clear</button>',
          '</form>',
        ],
      },
    ],
    exercises: [
      {
        question: 'Set the input type for collecting an email address:',
        code: '<input type="___" placeholder="Email" />',
        answer: 'email',
        hint: 'This type enables built-in email validation and a special mobile keyboard.',
      },
      {
        question: 'Which attribute makes a form field mandatory?',
        code: '<input type="text" ___ />',
        answer: 'required',
        hint: 'This boolean attribute prevents form submission if the field is empty.',
      },
    ],
  },

  semantic: {
    title: 'Semantic HTML',
    icon: <BookOpen size={14} />,
    explanation:
      'Semantic elements describe their content\'s purpose rather than appearance. <header> holds introductory content, <nav> wraps navigation, <main> contains the primary content, <section> groups thematic content, <article> is self-contained content, <aside> holds tangential info, and <footer> closes sections or pages. <figure>/<figcaption> pair media with captions. <details>/<summary> create expandable sections. Use alt text on images and aria-label on interactive elements for accessibility.',
    examples: [
      {
        label: 'Page structure with semantic tags',
        lines: [
          '<header>',
          '  <h1>TechBlog</h1>',
          '  <nav aria-label="Main navigation">',
          '    <a href="/">Home</a>',
          '    <a href="/blog">Blog</a>',
          '    <a href="/about">About</a>',
          '    <a href="/contact">Contact</a>',
          '  </nav>',
          '</header>',
          '',
          '<main>',
          '  <article>',
          '    <h2>Understanding Semantic HTML</h2>',
          '    <time datetime="2025-01-15">Jan 15, 2025</time>',
          '    <p>Semantic tags improve accessibility...</p>',
          '    <figure>',
          '      <img src="diagram.png"',
          '        alt="Diagram showing HTML document structure" />',
          '      <figcaption>HTML5 document layout</figcaption>',
          '    </figure>',
          '  </article>',
          '',
          '  <aside>',
          '    <h3>Related Posts</h3>',
          '    <ul>',
          '      <li><a href="/css-basics">CSS Basics</a></li>',
          '    </ul>',
          '  </aside>',
          '</main>',
          '',
          '<footer>',
          '  <address>Contact: <a href="mailto:hi@blog.com">hi@blog.com</a></address>',
          '  <p>&copy; 2025 TechBlog</p>',
          '</footer>',
        ],
      },
      {
        label: 'Details, summary, accessibility',
        lines: [
          '<!-- Expandable content -->',
          '<details>',
          '  <summary>Frequently Asked Questions</summary>',
          '  <p>Q: What is HTML?</p>',
          '  <p>A: HyperText Markup Language.</p>',
          '</details>',
          '',
          '<!-- Accessible image -->',
          '<img src="photo.jpg"',
          '  alt="A golden retriever sitting on grass" />',
          '',
          '<!-- Accessible button -->',
          '<button aria-label="Close modal">',
          '  &times;',
          '</button>',
          '',
          '<!-- Skip navigation link -->',
          '<a href="#main-content" class="sr-only">',
          '  Skip to main content',
          '</a>',
          '<main id="main-content">...</main>',
        ],
      },
    ],
    exercises: [
      {
        question: 'Which semantic tag wraps navigation links?',
        code: '<___>\n  <a href="/">Home</a>\n  <a href="/about">About</a>\n</___>',
        answer: 'nav',
        hint: 'Three-letter abbreviation for "navigation".',
      },
      {
        question: 'Which tag pairs an image with its caption?',
        code: '<___>\n  <img src="pic.jpg" alt="Photo" />\n  <figcaption>A photo</figcaption>\n</___>',
        answer: 'figure',
        hint: 'This element wraps media content and its associated <figcaption>.',
      },
    ],
  },

  'css-basics': {
    title: 'CSS Basics',
    icon: <Code size={14} />,
    explanation:
      'CSS can be applied inline (style attribute), internally (<style> in <head>), or externally (<link> to .css file). A CSS rule has a selector and a declaration block. Selectors target elements (p), classes (.name), or IDs (#id). The cascade resolves conflicts by origin, specificity (inline=1000, #id=100, .class=10, element=1), and source order. Inherited properties (color, font) flow from parent to child. The !important flag overrides everything but should be avoided.',
    examples: [
      {
        label: 'Three ways to apply CSS',
        lines: [
          '<!-- 1. Inline (highest specificity) -->',
          '<p style="color: red;">Inline styled</p>',
          '',
          '<!-- 2. Internal stylesheet -->',
          '<head>',
          '  <style>',
          '    p { color: blue; }',
          '  </style>',
          '</head>',
          '',
          '<!-- 3. External stylesheet (recommended) -->',
          '<head>',
          '  <link rel="stylesheet" href="styles.css" />',
          '</head>',
        ],
      },
      {
        label: 'Selectors and specificity',
        lines: [
          '/* Element selector     -> specificity 0-0-1 */',
          'p { color: #333; }',
          '',
          '/* Class selector       -> specificity 0-1-0 */',
          '.highlight { background: yellow; }',
          '',
          '/* ID selector          -> specificity 1-0-0 */',
          '#hero { font-size: 32px; }',
          '',
          '/* Combined selector    -> specificity 0-1-1 */',
          'p.intro { font-weight: bold; }',
          '',
          '/* Descendant selector  -> specificity 0-0-2 */',
          'article p { line-height: 1.8; }',
          '',
          '/* !important overrides all (avoid!) */',
          '.alert { color: red !important; }',
        ],
      },
      {
        label: 'Cascade, inheritance, and properties',
        lines: [
          '/* Inherited properties: color, font-*, visibility, etc. */',
          'body {',
          '  font-family: Arial, sans-serif;',
          '  color: #222;',
          '  line-height: 1.6;',
          '}',
          '',
          '/* Non-inherited: margin, padding, border, background */',
          'h1 {',
          '  color: navy;             /* overrides inherited #222 */',
          '  margin-bottom: 16px;',
          '  border-bottom: 2px solid navy;',
          '  padding-bottom: 8px;',
          '}',
          '',
          '/* Later rules win at equal specificity */',
          'p { color: gray; }',
          'p { color: darkslategray; }  /* this wins */',
        ],
      },
    ],
    exercises: [
      {
        question: 'Set the text color to red using a CSS property:',
        code: 'p {\n  ___: red;\n}',
        answer: 'color',
        hint: 'The CSS property that changes text color.',
      },
      {
        question: 'Complete the class selector for the "card" class:',
        code: '___ {\n  padding: 16px;\n  border-radius: 8px;\n}',
        answer: '.card',
        hint: 'Class selectors start with a dot followed by the class name.',
      },
    ],
  },

  'box-model': {
    title: 'Box Model',
    icon: <ChevronRight size={14} />,
    explanation:
      'Every element is a rectangular box with four layers: content (innermost), padding (space inside the border), border (visible edge), and margin (space outside the border). By default, width/height set only the content area (content-box). Setting box-sizing: border-box includes padding and border in the declared dimensions. Use min-width/max-width to constrain sizing. The overflow property controls what happens when content exceeds the box. Outline is similar to border but does not affect layout.',
    examples: [
      {
        label: 'Box model layers',
        lines: [
          '.card {',
          '  /* Content dimensions */',
          '  width: 300px;',
          '  height: 200px;',
          '',
          '  /* Padding: space inside border */',
          '  padding: 20px;',
          '  padding-top: 12px;',
          '',
          '  /* Border: visible edge */',
          '  border: 2px solid #ccc;',
          '  border-radius: 8px;',
          '',
          '  /* Margin: space outside border */',
          '  margin: 16px auto;   /* auto = centered */',
          '  margin-bottom: 24px;',
          '}',
        ],
      },
      {
        label: 'Box-sizing and overflow',
        lines: [
          '/* border-box: width includes padding + border */',
          '*, *::before, *::after {',
          '  box-sizing: border-box;',
          '}',
          '',
          '/* Without border-box: total = 300+40+4 = 344px */',
          '/* With border-box:    total = 300px (fits inside) */',
          '.box {',
          '  width: 300px;',
          '  padding: 20px;',
          '  border: 2px solid black;',
          '  box-sizing: border-box;',
          '}',
          '',
          '/* Constrain dimensions */',
          '.fluid {',
          '  width: 100%;',
          '  max-width: 800px;',
          '  min-width: 280px;',
          '}',
          '',
          '/* Overflow control */',
          '.scroll-box {',
          '  height: 200px;',
          '  overflow-y: auto;    /* scroll if needed */',
          '  overflow-x: hidden;  /* hide horizontal */',
          '}',
        ],
      },
      {
        label: 'Outline versus border',
        lines: [
          '/* Border takes space in layout */',
          '.bordered {',
          '  border: 3px solid blue;',
          '}',
          '',
          '/* Outline does NOT affect layout */',
          '.focused {',
          '  outline: 3px solid orange;',
          '  outline-offset: 2px;',
          '}',
          '',
          '/* Common: remove default focus outline */',
          'button:focus {',
          '  outline: none;',
          '  box-shadow: 0 0 0 3px rgba(59,130,246,0.5);',
          '}',
        ],
      },
    ],
    exercises: [
      {
        question: 'Which box-sizing value includes padding and border in the width?',
        code: 'box-sizing: ___;',
        answer: 'border-box',
        hint: 'The alternative to "content-box" that simplifies layout math.',
      },
      {
        question: 'Set the element width with auto horizontal margins to center it:',
        code: 'margin: 0 ___;',
        answer: 'auto',
        hint: 'This keyword distributes remaining space equally on both sides.',
      },
    ],
  },

  'css-layout': {
    title: 'CSS Layout',
    icon: <Code size={14} />,
    explanation:
      'The display property controls layout behavior: block elements take full width, inline elements flow in text, inline-block combines both, and none hides elements. The position property places elements: static (default), relative (offset from normal position), absolute (relative to positioned ancestor), fixed (relative to viewport), and sticky (hybrid that sticks on scroll). z-index controls stacking order for positioned elements. Float was used for layouts before flexbox/grid; clear prevents wrapping around floats.',
    examples: [
      {
        label: 'Display values',
        lines: [
          '/* Block: full width, new line */',
          'div, p, h1 { display: block; }',
          '',
          '/* Inline: flows in text, no width/height */',
          'span, a, strong { display: inline; }',
          '',
          '/* Inline-block: inline flow + width/height */',
          '.badge {',
          '  display: inline-block;',
          '  padding: 4px 12px;',
          '  border-radius: 12px;',
          '  background: #e0e7ff;',
          '}',
          '',
          '/* None: completely hidden */',
          '.hidden { display: none; }',
        ],
      },
      {
        label: 'Position values',
        lines: [
          '/* Relative: offset from normal spot */',
          '.nudged {',
          '  position: relative;',
          '  top: 5px;',
          '  left: 10px;',
          '}',
          '',
          '/* Absolute: positioned to nearest ancestor */',
          '.tooltip {',
          '  position: absolute;',
          '  top: 100%;',
          '  left: 50%;',
          '  transform: translateX(-50%);',
          '  z-index: 10;',
          '}',
          '',
          '/* Fixed: stays in viewport on scroll */',
          '.navbar {',
          '  position: fixed;',
          '  top: 0;',
          '  left: 0;',
          '  width: 100%;',
          '  z-index: 100;',
          '}',
          '',
          '/* Sticky: scrolls then sticks */',
          '.sidebar-heading {',
          '  position: sticky;',
          '  top: 0;',
          '}',
        ],
      },
      {
        label: 'Centering techniques',
        lines: [
          '/* 1. Margin auto (horizontal block centering) */',
          '.center-block {',
          '  width: 300px;',
          '  margin: 0 auto;',
          '}',
          '',
          '/* 2. Text-align (inline/inline-block centering) */',
          '.center-text { text-align: center; }',
          '',
          '/* 3. Absolute positioning + transform */',
          '.center-abs {',
          '  position: absolute;',
          '  top: 50%;',
          '  left: 50%;',
          '  transform: translate(-50%, -50%);',
          '}',
          '',
          '/* 4. Flexbox (easiest for most cases) */',
          '.center-flex {',
          '  display: flex;',
          '  justify-content: center;',
          '  align-items: center;',
          '}',
        ],
      },
    ],
    exercises: [
      {
        question: 'Which position value keeps an element fixed in the viewport?',
        code: 'position: ___;',
        answer: 'fixed',
        hint: 'The element stays in place even when the user scrolls.',
      },
      {
        question: 'Which display value makes an element completely invisible and removes it from layout?',
        code: 'display: ___;',
        answer: 'none',
        hint: 'Unlike visibility:hidden, this fully removes the element from the document flow.',
      },
    ],
  },

  flexbox: {
    title: 'Flexbox',
    icon: <ChevronRight size={14} />,
    explanation:
      'Flexbox is a one-dimensional layout system for distributing items along a main axis (row or column). Set display:flex on the container, choose direction with flex-direction, distribute space with justify-content, and align the cross-axis with align-items. Children control their sizing with flex-grow (expand), flex-shrink (compress), and flex-basis (starting size); the shorthand flex: 1 means grow equally. Gap sets spacing between items. The order property rearranges items without changing HTML.',
    examples: [
      {
        label: 'Flex container properties',
        lines: [
          '.container {',
          '  display: flex;',
          '  flex-direction: row;       /* row | column */',
          '  flex-wrap: wrap;           /* wrap | nowrap */',
          '  justify-content: space-between;',
          '    /* flex-start | flex-end | center',
          '       space-between | space-around | space-evenly */',
          '  align-items: center;',
          '    /* stretch | flex-start | flex-end | center */',
          '  gap: 16px;',
          '}',
        ],
      },
      {
        label: 'Flex item properties',
        lines: [
          '/* flex shorthand: grow shrink basis */',
          '.item { flex: 1; }         /* grow equally */',
          '.sidebar { flex: 0 0 250px; } /* fixed 250px */',
          '.main { flex: 1 1 0; }     /* fill remaining */',
          '',
          '/* Individual control */',
          '.item-a {',
          '  flex-grow: 2;   /* gets 2x extra space */',
          '  flex-shrink: 0; /* never shrinks */',
          '  flex-basis: 200px;',
          '  align-self: flex-start;  /* override parent */',
          '  order: -1;      /* move to front */',
          '}',
        ],
      },
      {
        label: 'Common flexbox layouts',
        lines: [
          '/* Navbar: logo left, links right */',
          '.navbar {',
          '  display: flex;',
          '  justify-content: space-between;',
          '  align-items: center;',
          '  padding: 0 24px;',
          '}',
          '',
          '/* Full-height centered content */',
          '.hero {',
          '  display: flex;',
          '  flex-direction: column;',
          '  justify-content: center;',
          '  align-items: center;',
          '  min-height: 100vh;',
          '  gap: 24px;',
          '}',
          '',
          '/* Equal-height card row */',
          '.card-row {',
          '  display: flex;',
          '  gap: 16px;',
          '}',
          '.card-row > .card { flex: 1; }',
        ],
      },
    ],
    exercises: [
      {
        question: 'Enable flexbox on a container:',
        code: 'display: ___;',
        answer: 'flex',
        hint: 'The display value that activates the flexible box layout model.',
      },
      {
        question: 'Distribute items with equal space between them:',
        code: 'justify-content: ___;',
        answer: 'space-between',
        hint: 'First item at start, last at end, equal gaps between.',
      },
    ],
  },

  grid: {
    title: 'CSS Grid',
    icon: <Code size={14} />,
    explanation:
      'CSS Grid is a two-dimensional layout system for rows and columns simultaneously. Define column tracks with grid-template-columns using px, fr (fractional unit), or repeat(). The fr unit distributes remaining space proportionally. Gap sets gutters. Items can span tracks with grid-column/grid-row using span or line numbers. Named grid areas create readable layouts. Auto-fit with minmax() builds fully responsive grids without media queries.',
    examples: [
      {
        label: 'Grid fundamentals',
        lines: [
          '.grid {',
          '  display: grid;',
          '  grid-template-columns: 1fr 1fr 1fr;',
          '  grid-template-rows: auto 1fr auto;',
          '  gap: 16px;              /* row-gap + column-gap */',
          '}',
          '',
          '/* Alternative notation */',
          '.grid-alt {',
          '  display: grid;',
          '  grid-template-columns: repeat(3, 1fr);',
          '  gap: 20px 16px;  /* row-gap column-gap */',
          '}',
          '',
          '/* Spanning tracks */',
          '.full-width {',
          '  grid-column: 1 / -1;  /* span all columns */',
          '}',
          '.span-two {',
          '  grid-column: span 2;',
          '  grid-row: span 2;',
          '}',
        ],
      },
      {
        label: 'Named grid areas',
        lines: [
          '.page {',
          '  display: grid;',
          '  grid-template-columns: 200px 1fr 200px;',
          '  grid-template-rows: auto 1fr auto;',
          '  grid-template-areas:',
          '    "header header header"',
          '    "sidebar main   aside"',
          '    "footer footer footer";',
          '  min-height: 100vh;',
          '  gap: 16px;',
          '}',
          '',
          '.page-header  { grid-area: header; }',
          '.page-sidebar { grid-area: sidebar; }',
          '.page-main    { grid-area: main; }',
          '.page-aside   { grid-area: aside; }',
          '.page-footer  { grid-area: footer; }',
        ],
      },
      {
        label: 'Responsive auto-fit grid',
        lines: [
          '/* Cards auto-fit: no media queries needed */',
          '.auto-grid {',
          '  display: grid;',
          '  grid-template-columns:',
          '    repeat(auto-fit, minmax(250px, 1fr));',
          '  gap: 20px;',
          '}',
          '',
          '/* auto-fill: creates empty tracks */',
          '.fill-grid {',
          '  display: grid;',
          '  grid-template-columns:',
          '    repeat(auto-fill, minmax(150px, 1fr));',
          '  gap: 12px;',
          '}',
          '',
          '/* Explicit placement */',
          '.featured {',
          '  grid-column: 1 / 3;',
          '  grid-row: 1 / 3;',
          '}',
        ],
      },
    ],
    exercises: [
      {
        question: 'Create 3 equal columns using the fractional unit:',
        code: 'grid-template-columns: ___ 1fr 1fr;',
        answer: '1fr',
        hint: 'The fractional unit that distributes available space equally.',
      },
      {
        question: 'Make an item span all columns from first to last:',
        code: 'grid-column: 1 / ___;',
        answer: '-1',
        hint: 'Negative line numbers count from the end; -1 is the last line.',
        validate: 'exact',
      },
    ],
  },

  responsive: {
    title: 'Responsive Design',
    icon: <ChevronRight size={14} />,
    explanation:
      'Responsive design adapts layouts to different screen sizes. The viewport meta tag ensures mobile browsers render at device width. Media queries (@media) apply styles conditionally based on screen width. Mobile-first design starts with small screens and adds complexity with min-width queries. Relative units (em, rem, %, vw, vh) scale with context. The clamp() function sets a value with min and max bounds. The aspect-ratio property maintains element proportions.',
    examples: [
      {
        label: 'Viewport meta and media queries',
        lines: [
          '<!-- Required in <head> for mobile -->',
          '<meta name="viewport"',
          '  content="width=device-width, initial-scale=1.0" />',
          '',
          '/* Mobile-first: base styles for small screens */',
          '.container {',
          '  padding: 16px;',
          '  max-width: 100%;',
          '}',
          '',
          '/* Tablet: 768px and up */',
          '@media (min-width: 768px) {',
          '  .container {',
          '    padding: 24px;',
          '    max-width: 720px;',
          '    margin: 0 auto;',
          '  }',
          '}',
          '',
          '/* Desktop: 1024px and up */',
          '@media (min-width: 1024px) {',
          '  .container {',
          '    max-width: 960px;',
          '  }',
          '}',
          '',
          '/* Large desktop: 1280px and up */',
          '@media (min-width: 1280px) {',
          '  .container {',
          '    max-width: 1200px;',
          '  }',
          '}',
        ],
      },
      {
        label: 'Relative units and clamp()',
        lines: [
          '/* rem: relative to root font-size (16px default) */',
          'html { font-size: 16px; }',
          'h1 { font-size: 2rem; }     /* 32px */',
          'h2 { font-size: 1.5rem; }   /* 24px */',
          'p  { font-size: 1rem; }     /* 16px */',
          '',
          '/* em: relative to parent font-size */',
          '.sidebar { font-size: 0.875em; }',
          '',
          '/* Viewport units */',
          '.hero {',
          '  width: 100vw;   /* full viewport width */',
          '  height: 100vh;  /* full viewport height */',
          '}',
          '',
          '/* clamp(min, preferred, max) */',
          '.title {',
          '  font-size: clamp(1.5rem, 4vw, 3rem);',
          '}',
          '.container {',
          '  width: clamp(300px, 90%, 1200px);',
          '}',
          '',
          '/* Aspect ratio */',
          '.video {',
          '  width: 100%;',
          '  aspect-ratio: 16 / 9;',
          '}',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the media query for screens 768px and wider:',
        code: '@media (___: 768px) { ... }',
        answer: 'min-width',
        hint: 'Mobile-first uses this property to target larger screens.',
      },
      {
        question: 'Which unit is relative to the root element font-size?',
        code: 'font-size: 1.5___;  /* 24px if root is 16px */',
        answer: 'rem',
        hint: 'Three letters: "root em".',
      },
    ],
  },

  'advanced-css': {
    title: 'Advanced CSS',
    icon: <Code size={14} />,
    explanation:
      'Custom properties (CSS variables) store reusable values with --name syntax and are accessed via var(). calc() performs math with mixed units. Transitions animate property changes smoothly (property, duration, timing-function, delay). Keyframe animations define multi-step sequences. Transforms move (translate), rotate, and scale elements. Pseudo-classes (:hover, :focus, :nth-child) target states. Pseudo-elements (::before, ::after) insert generated content.',
    examples: [
      {
        label: 'Custom properties and calc()',
        lines: [
          '/* Define variables on :root */',
          ':root {',
          '  --primary: #3b82f6;',
          '  --primary-dark: #2563eb;',
          '  --radius: 8px;',
          '  --spacing: 16px;',
          '  --font-body: "Inter", sans-serif;',
          '}',
          '',
          '/* Use variables */',
          '.button {',
          '  background: var(--primary);',
          '  border-radius: var(--radius);',
          '  padding: var(--spacing);',
          '  font-family: var(--font-body);',
          '}',
          '',
          '/* Fallback value */',
          '.alt { color: var(--accent, #666); }',
          '',
          '/* calc() for mixed unit math */',
          '.sidebar {',
          '  width: calc(100% - 250px);',
          '  height: calc(100vh - 64px);',
          '  padding: calc(var(--spacing) * 2);',
          '}',
        ],
      },
      {
        label: 'Transitions and transforms',
        lines: [
          '/* Transition: property duration timing delay */',
          '.card {',
          '  transition: transform 0.3s ease,',
          '             box-shadow 0.3s ease;',
          '}',
          '.card:hover {',
          '  transform: translateY(-4px);',
          '  box-shadow: 0 12px 24px rgba(0,0,0,0.15);',
          '}',
          '',
          '/* Transform functions */',
          '.rotated { transform: rotate(45deg); }',
          '.scaled  { transform: scale(1.5); }',
          '.moved   { transform: translate(10px, 20px); }',
          '.combo   { transform: rotate(5deg) scale(1.1); }',
          '',
          '/* Keyframe animation */',
          '@keyframes fadeSlideIn {',
          '  from {',
          '    opacity: 0;',
          '    transform: translateY(-20px);',
          '  }',
          '  to {',
          '    opacity: 1;',
          '    transform: translateY(0);',
          '  }',
          '}',
          '.animate {',
          '  animation: fadeSlideIn 0.4s ease-out forwards;',
          '}',
        ],
      },
      {
        label: 'Pseudo-classes and pseudo-elements',
        lines: [
          '/* Pseudo-classes: state-based styles */',
          'a:hover { color: var(--primary); }',
          'input:focus { border-color: blue; }',
          'button:active { transform: scale(0.98); }',
          'input:disabled { opacity: 0.5; }',
          '',
          '/* Structural pseudo-classes */',
          'li:first-child { font-weight: bold; }',
          'li:last-child { border: none; }',
          'tr:nth-child(even) { background: #f9f9f9; }',
          'p:not(.special) { color: gray; }',
          '',
          '/* Pseudo-elements: generated content */',
          '.required::after {',
          '  content: " *";',
          '  color: red;',
          '}',
          '',
          '.quote::before {',
          '  content: "\\201C";  /* left double quote */',
          '  font-size: 2em;',
          '  color: #ccc;',
          '}',
          '',
          '/* Decorative line with ::after */',
          '.title::after {',
          '  content: "";',
          '  display: block;',
          '  width: 60px;',
          '  height: 3px;',
          '  background: var(--primary);',
          '  margin-top: 8px;',
          '}',
        ],
      },
    ],
    exercises: [
      {
        question: 'Access a CSS custom property named --primary:',
        code: 'background: ___( --primary );',
        answer: 'var',
        hint: 'The CSS function that retrieves the value of a custom property.',
      },
      {
        question: 'Complete the pseudo-element selector for generated content after an element:',
        code: '.label___  { content: " *"; color: red; }',
        answer: '::after',
        hint: 'Uses double colons and targets content placed after the element.',
      },
    ],
  },
};

const topicKeys = Object.keys(topics);

// ── Syntax highlighting ─────────────────────────────────────────────────────

function highlightLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  const push = (text: string, cls?: string) => {
    nodes.push(
      cls ? <span key={k++} className={cls}>{text}</span> : <span key={k++}>{text}</span>
    );
  };

  while (i < line.length) {
    // HTML comments
    if (line.startsWith('<!--', i)) {
      const end = line.indexOf('-->', i + 4);
      const close = end >= 0 ? end + 3 : line.length;
      push(line.slice(i, close), 'text-gray-500');
      i = close;
      continue;
    }

    // CSS comments
    if (line.startsWith('/*', i)) {
      const end = line.indexOf('*/', i + 2);
      const close = end >= 0 ? end + 2 : line.length;
      push(line.slice(i, close), 'text-gray-500');
      i = close;
      continue;
    }

    // HTML tags
    if (line[i] === '<') {
      push('<', 'text-blue-400');
      i++;
      if (i < line.length && line[i] === '/') { push('/', 'text-blue-400'); i++; }
      if (i < line.length && line[i] === '!') {
        const s = i;
        while (i < line.length && /[a-zA-Z!]/.test(line[i])) i++;
        push(line.slice(s, i), 'text-blue-400');
      } else {
        const s = i;
        while (i < line.length && /[a-zA-Z0-9-]/.test(line[i])) i++;
        if (i > s) push(line.slice(s, i), 'text-blue-400');
      }
      while (i < line.length && line[i] !== '>') {
        if (/\s/.test(line[i])) { push(line[i]); i++; continue; }
        if (line[i] === '/') { push('/', 'text-blue-400'); i++; continue; }
        if (/[a-zA-Z_-]/.test(line[i])) {
          const s = i;
          while (i < line.length && /[a-zA-Z0-9_-]/.test(line[i])) i++;
          push(line.slice(s, i), 'text-purple-400');
          if (i < line.length && line[i] === '=') {
            push('='); i++;
            if (i < line.length && (line[i] === '"' || line[i] === "'")) {
              const q = line[i]; const vs = i; i++;
              while (i < line.length && line[i] !== q) i++;
              if (i < line.length) i++;
              push(line.slice(vs, i), 'text-green-400');
            }
          }
          continue;
        }
        push(line[i]); i++;
      }
      if (i < line.length && line[i] === '>') { push('>', 'text-blue-400'); i++; }
      continue;
    }

    // Quoted strings (outside tags)
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i]; const s = i; i++;
      while (i < line.length && line[i] !== q) i++;
      if (i < line.length) i++;
      push(line.slice(s, i), 'text-green-400');
      continue;
    }

    // @-rules
    if (line[i] === '@') {
      const s = i; i++;
      while (i < line.length && /[a-zA-Z-]/.test(line[i])) i++;
      push(line.slice(s, i), 'text-purple-400');
      continue;
    }

    // CSS custom properties (--var-name)
    if (line[i] === '-' && i + 1 < line.length && line[i + 1] === '-') {
      const s = i; i += 2;
      while (i < line.length && /[a-zA-Z0-9_-]/.test(line[i])) i++;
      const varName = line.slice(s, i);
      let j = i;
      while (j < line.length && line[j] === ' ') j++;
      if (j < line.length && line[j] === ':' && (j + 1 >= line.length || line[j + 1] !== '/')) {
        const ac = j + 1 < line.length ? line[j + 1] : ' ';
        if (!/[a-zA-Z]/.test(ac)) {
          push(varName, 'text-cyan-400');
          push(line.slice(i, j + 1)); i = j + 1;
          while (i < line.length && line[i] === ' ') { push(' '); i++; }
          const vs = i;
          while (i < line.length && line[i] !== ';' && line[i] !== '{' && line[i] !== '}') i++;
          if (i > vs) push(line.slice(vs, i), 'text-orange-400');
          if (i < line.length && line[i] === ';') { push(';'); i++; }
          continue;
        }
      }
      push(varName, 'text-cyan-400');
      continue;
    }

    // Pseudo-classes and pseudo-elements
    if (line[i] === ':' && i + 1 < line.length && (/[a-zA-Z]/.test(line[i + 1]) || line[i + 1] === ':')) {
      const s = i; i++;
      if (i < line.length && line[i] === ':') i++;
      while (i < line.length && /[a-zA-Z-]/.test(line[i])) i++;
      push(line.slice(s, i), 'text-purple-400');
      continue;
    }

    // Class selectors
    if (line[i] === '.' && i + 1 < line.length && /[a-zA-Z]/.test(line[i + 1])) {
      const s = i; i++;
      while (i < line.length && /[a-zA-Z0-9_-]/.test(line[i])) i++;
      push(line.slice(s, i), 'text-yellow-400');
      continue;
    }

    // ID selectors
    if (line[i] === '#' && i + 1 < line.length && /[a-zA-Z]/.test(line[i + 1])) {
      const s = i; i++;
      while (i < line.length && /[a-zA-Z0-9_-]/.test(line[i])) i++;
      push(line.slice(s, i), 'text-yellow-400');
      continue;
    }

    // CSS property: value pairs and other words
    if (/[a-zA-Z_]/.test(line[i])) {
      const s = i;
      while (i < line.length && /[a-zA-Z0-9_-]/.test(line[i])) i++;
      const word = line.slice(s, i);
      let j = i;
      while (j < line.length && line[j] === ' ') j++;
      if (j < line.length && line[j] === ':') {
        if (j + 1 < line.length && line[j + 1] === '/') { push(word); continue; }
        const ac = j + 1 < line.length ? line[j + 1] : ' ';
        if (/[a-zA-Z]/.test(ac)) { push(word); continue; }
        push(word, 'text-cyan-400');
        push(line.slice(i, j + 1)); i = j + 1;
        while (i < line.length && line[i] === ' ') { push(' '); i++; }
        const vs = i;
        while (i < line.length && line[i] !== ';' && line[i] !== '{' && line[i] !== '}') i++;
        if (i > vs) push(line.slice(vs, i), 'text-orange-400');
        if (i < line.length && line[i] === ';') { push(';'); i++; }
        continue;
      }
      push(word);
      continue;
    }

    push(line[i]); i++;
  }

  return nodes;
}

// ── Validation helpers ──────────────────────────────────────────────────────

function checkAnswer(exercise: Exercise, input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  return trimmed.toLowerCase() === exercise.answer.toLowerCase();
}

// ── Component ───────────────────────────────────────────────────────────────

export const HtmlCssLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>('html-basics');
  const [activeExample, setActiveExample] = useState<number>(0);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});

  const topic = topics[activeTopic];

  const exKey = (topicKey: string, exIdx: number) => `${topicKey}_ex${exIdx}`;

  const completedCount = topicKeys.reduce((sum, tKey) => {
    const t = topics[tKey];
    const allDone = t.exercises.every((_, eIdx) => results[exKey(tKey, eIdx)] === true);
    return sum + (allDone ? 1 : 0);
  }, 0);

  const handleCheck = (exIdx: number) => {
    const key = exKey(activeTopic, exIdx);
    const val = inputs[key]?.trim() ?? '';
    const exercise = topic.exercises[exIdx];
    setResults((p) => ({ ...p, [key]: checkAnswer(exercise, val) }));
  };

  const handleReset = (exIdx: number) => {
    const key = exKey(activeTopic, exIdx);
    setInputs((p) => ({ ...p, [key]: '' }));
    setResults((p) => ({ ...p, [key]: null }));
    setShowHint((p) => ({ ...p, [key]: false }));
  };

  const handleTopicChange = (key: string) => {
    setActiveTopic(key);
    setActiveExample(0);
  };

  const isTopicComplete = (tKey: string) => {
    const t = topics[tKey];
    return t.exercises.every((_, eIdx) => results[exKey(tKey, eIdx)] === true);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-pink-50 dark:from-gray-950 dark:to-pink-950/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <Code size={16} className="text-pink-600 dark:text-pink-400" />
        <h1 className="text-sm font-semibold text-slate-800 dark:text-gray-100">HTML &amp; CSS Lab</h1>
        <span className="text-[11px] text-slate-400 dark:text-gray-500 ml-1">
          {completedCount}/{topicKeys.length} topics mastered
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-24 h-1.5 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 dark:bg-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / topicKeys.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-gray-500">
            {Math.round((completedCount / topicKeys.length) * 100)}%
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 overflow-y-auto">
          <nav className="py-1">
            <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-400 dark:text-gray-600 font-semibold">HTML</div>
            {topicKeys.slice(0, 5).map((key) => {
              const t = topics[key];
              const isActive = activeTopic === key;
              const done = isTopicComplete(key);
              return (
                <button
                  key={key}
                  onClick={() => handleTopicChange(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                    isActive
                      ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-medium'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="shrink-0">{t.icon}</span>
                  <span className="truncate flex-1">{t.title}</span>
                  {done && <Check size={12} className="text-emerald-500 shrink-0" />}
                  {isActive && !done && <ChevronRight size={12} className="shrink-0 opacity-50" />}
                </button>
              );
            })}
            <div className="px-3 py-2 mt-1 text-[10px] uppercase tracking-wider text-slate-400 dark:text-gray-600 font-semibold">CSS</div>
            {topicKeys.slice(5).map((key) => {
              const t = topics[key];
              const isActive = activeTopic === key;
              const done = isTopicComplete(key);
              return (
                <button
                  key={key}
                  onClick={() => handleTopicChange(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                    isActive
                      ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-medium'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="shrink-0">{t.icon}</span>
                  <span className="truncate flex-1">{t.title}</span>
                  {done && <Check size={12} className="text-emerald-500 shrink-0" />}
                  {isActive && !done && <ChevronRight size={12} className="shrink-0 opacity-50" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Topic header */}
          <div className="flex items-center gap-2">
            <span className="text-pink-600 dark:text-pink-400">{topic.icon}</span>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">{topic.title}</h2>
            {isTopicComplete(activeTopic) && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                <Check size={10} /> Mastered
              </span>
            )}
          </div>

          {/* Explanation */}
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-gray-400 max-w-2xl">
            {topic.explanation}
          </p>

          {/* Example tabs + code block */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-900 rounded-t-lg border-b border-gray-700">
              <Code size={12} className="text-gray-400 mr-1" />
              {topic.examples.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveExample(idx)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    activeExample === idx
                      ? 'bg-gray-700 text-gray-100 font-medium'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <div className="bg-gray-950 rounded-b-lg p-3 font-mono text-[12px] text-gray-200 leading-relaxed overflow-x-auto">
              {(topic.examples[activeExample]?.lines ?? []).map((line, idx) => (
                <div key={idx} className="min-h-[1.3em]">
                  {line === '' ? '\u00A0' : highlightLine(line)}
                </div>
              ))}
            </div>
          </div>

          {/* Exercises */}
          {topic.exercises.map((exercise, exIdx) => {
            const key = exKey(activeTopic, exIdx);
            const currentInput = inputs[key] ?? '';
            const currentResult = results[key] ?? null;

            return (
              <div
                key={exIdx}
                className="max-w-2xl border border-slate-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900/60 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-gray-800/40 border-b border-slate-200 dark:border-gray-800">
                  <BookOpen size={13} className="text-amber-500" />
                  <span className="text-[13px] font-medium text-slate-700 dark:text-gray-300">
                    Exercise {exIdx + 1}
                  </span>
                  {currentResult === true && (
                    <Check size={12} className="text-emerald-500 ml-auto" />
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-[13px] text-slate-700 dark:text-gray-300">{exercise.question}</p>

                  <div className="bg-gray-950 rounded-lg p-3 font-mono text-[12px] text-gray-300 whitespace-pre-wrap">
                    {exercise.code.split('___').map((part, idx, arr) => (
                      <React.Fragment key={idx}>
                        {highlightLine(part)}
                        {idx < arr.length - 1 && (
                          <span className="inline-block text-amber-400 border-b border-dashed border-amber-400/50">
                            ___
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => {
                          setInputs((p) => ({ ...p, [key]: e.target.value }));
                          if (currentResult !== null) setResults((p) => ({ ...p, [key]: null }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && currentInput.trim()) handleCheck(exIdx);
                        }}
                        placeholder="Type your answer..."
                        className={`w-full px-3 py-2 text-[13px] rounded-md border bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-600 outline-none transition-colors ${
                          currentResult === true
                            ? 'border-emerald-400 dark:border-emerald-500'
                            : currentResult === false
                            ? 'border-red-400 dark:border-red-500'
                            : 'border-slate-300 dark:border-gray-700 focus:border-pink-400 dark:focus:border-pink-500'
                        }`}
                      />
                      {currentResult === true && (
                        <Check size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                      )}
                      {currentResult === false && (
                        <X size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500" />
                      )}
                    </div>
                    <button
                      onClick={() => handleCheck(exIdx)}
                      disabled={!currentInput.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check size={12} /> Check
                    </button>
                    <button
                      onClick={() => handleReset(exIdx)}
                      className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                  </div>

                  {currentResult === true && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[12px] text-emerald-700 dark:text-emerald-300">
                        Correct! Well done.
                      </span>
                    </div>
                  )}
                  {currentResult === false && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <X size={14} className="text-red-600 dark:text-red-400" />
                        <span className="text-[12px] text-red-700 dark:text-red-300">
                          Not quite. Try again or check the hint.
                        </span>
                      </div>
                      {!showHint[key] && (
                        <button
                          onClick={() => setShowHint((p) => ({ ...p, [key]: true }))}
                          className="text-[12px] text-pink-600 dark:text-pink-400 hover:underline"
                        >
                          Show hint
                        </button>
                      )}
                    </div>
                  )}
                  {showHint[key] && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                      <ChevronRight size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-[12px] text-amber-700 dark:text-amber-300">
                        {exercise.hint}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );
};
