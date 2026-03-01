# Stock Research Agent

> **DISCLAIMER:** This is an educational tool for informational purposes only. It does NOT constitute investment advice, financial advice, or a personal recommendation. All investments involve risk of loss. Past performance does not guarantee future results. Always consult a licensed financial advisor before making investment decisions.

AI-powered multi-agent educational stock analysis system using Elasticsearch.

## Features

- **6 AI Agents** working together for comprehensive analysis
- **Educational Framing** - Uses descriptive language (bullish/bearish/neutral signals) instead of prescriptive recommendations
- **Wall Street Analyst Consensus** - Real analyst ratings from Financial Modeling Prep
- **Company Profile & Sector Peers** - Company info, sector, industry, CEO, and peer comparison
- **Enhanced Stock Comparison** - Compare 2-4 stocks with radar charts, winner highlighting, and side-by-side key findings
- **Analysis History & Accuracy Tracking** - Track past analyses and measure direction accuracy over time
- **Watchlist with Smart Alerts** - Add stocks to watchlist, get alerts on price moves against predictions
- **AI Agent Debate View** - Watch agents discuss and debate their findings in a conversational format
- **Performance Simulator** - Hypothetical what-if scenarios showing potential returns
- **News Timeline** - Recent news articles used in sentiment analysis
- **Interactive Price Chart** - Historical price chart with MA, Bollinger Bands, RSI, and volume overlays
- **Portfolio Tracker** - Track hypothetical positions with real-time P&L calculations
- **Market Overview Dashboard** - Major indices, sector performance, top gainers & losers
- **Stock Screener** - Screen stocks by sector, market cap, P/E, and beta with preset lists
- **Shareable Analysis Cards** - Share analysis summaries with copy-to-clipboard
- **UI Animations** - Smooth fade-in/slide-up transitions, hover effects, custom scrollbar
- **Keyboard Shortcuts** - Number keys 1-7 for tabs, Alt+Arrow for navigation
- **Export to PDF** - Save analysis results as PDF
- **3 Theme Modes** - Default (dark blue), Dark (pure dark), Light (off-white)
- **Legal Disclaimers** - Prominent disclaimers on every page
- **Terms of Service** - Full legal terms at /terms

## Architecture

6 AI Agents:
1. **Data Collector** - Fetches price data (Yahoo Finance) + fundamentals (FMP API)
2. **Technical Analyzer** - RSI, MACD, Moving Averages, Bollinger Bands
3. **Fundamental Analyzer** - P/E, EPS, Profit Margin, Debt/Equity
4. **Sentiment Analyzer** - News sentiment analysis
5. **Risk Assessor** - Volatility, Beta, key risk identification
6. **Coordinator** - Synthesizes all data into educational analysis

## Setup

1. Install dependencies:
```bash
npm run install:all
```

2. Copy `.env.example` to `.env` and add your API keys:
```
ANTHROPIC_API_KEY=your_key_here
FMP_API_KEY=your_fmp_key_here
NEWSAPI_KEY=your_newsapi_key (optional)
ELASTICSEARCH_CLOUD_ID=your_cloud_id (optional)
ELASTICSEARCH_USERNAME=your_username (optional)
ELASTICSEARCH_PASSWORD=your_password (optional)
```

3. Setup Elasticsearch indexes (optional):
```bash
npm run setup
```

4. Start everything:
```bash
npm run dev:all
```

- Frontend: http://localhost:3000
- API: http://localhost:3001

## Live Demo

- **Frontend:** https://stock-research-agent-seven.vercel.app
- **API:** https://stock-research-agent-production-366f.up.railway.app

## Usage

### Web UI:
Open https://stock-research-agent-seven.vercel.app and choose a mode:

**Analyze Mode:** Get detailed educational analysis of a single stock with AI agent debate view.
**Compare Mode:** Compare 2-4 stocks side-by-side with radar charts and winner highlighting.
**History Mode:** View past analyses with accuracy tracking and price change comparison.
**Watchlist Mode:** Track your favorite stocks with smart alerts on price moves.
**Portfolio Mode:** Track hypothetical stock positions with real-time P&L.
**Market Mode:** View market indices, sector performance, and top movers.
**Screener Mode:** Screen stocks by sector presets or custom lists with filters.

### CLI:
```bash
npm run dev TSLA
```

### API Endpoints:
```
GET /api/analyze/:symbol   - Run full analysis on a stock
GET /api/history/:symbol   - Get analysis history for a symbol
GET /api/history           - Get all analyzed symbols summary
GET /api/price/:symbol     - Get current price for a symbol
GET /api/profile/:symbol   - Get company profile (sector, industry, etc.)
GET /api/peers/:symbol     - Get sector peer companies
GET /api/news/:symbol      - Get recent news articles
GET /api/chart/:symbol     - Get OHLC data with technical indicators
GET /api/market/overview   - Get market indices, sectors, top movers
POST /api/screener         - Screen multiple stocks (body: {symbols: [...]})
GET /api/health            - Health check
```

## What the Analysis Shows

| Section | Description |
|---|---|
| **Analysis Direction** | Bullish/Bearish/Neutral signals based on data |
| **Signal Strength** | Strong/Moderate/Weak confidence in the direction |
| **Key Findings** | Bullet points of what the data indicates |
| **Price Levels** | Current price, estimated fair value, technical support |
| **Analysis Scores** | Technical, Fundamental, Sentiment scores (0-100) |
| **Wall Street Consensus** | Third-party analyst Buy/Hold/Sell breakdown |
| **Performance Simulator** | What-if scenarios with hypothetical investment amounts |
| **Agent Debate** | Conversational view of agents discussing findings |
| **News Timeline** | Recent news articles used in sentiment analysis |
| **Risk Considerations** | Key risks identified by the analysis |
| **Price Chart** | Interactive chart with MA, BB, RSI overlays |
| **Agent Details** | Detailed breakdown from each AI agent |

## Feature Details

### Enhanced Stock Comparison
- **Radar Chart**: Visual overlay comparing all scores across stocks
- **Winner Highlighting**: Top-scored stock highlighted with "Top Scored" badge
- **Metric Winner Stars**: Best value per metric gets highlighted in green with a star
- **Upside %**: Shows estimated upside/downside for each stock
- **Key Findings Side-by-Side**: Compare what each analysis found

### Analysis History & Accuracy
- Every analysis is automatically stored (Elasticsearch or in-memory)
- View all past analyses per symbol with timestamps
- Direction accuracy tracking: did bullish/bearish calls match actual price movement?
- Current price comparison for all past analyses
- Overall accuracy percentage across all directional calls

### Watchlist with Smart Alerts
- Add/remove stocks (stored in browser localStorage)
- Shows latest analysis data + current price for each stock
- Smart alerts for:
  - Price dropped >5% after bullish analysis
  - Price rose >5% after bearish analysis
  - Price reached estimated fair value
  - High-risk stock had >3% move
- One-click re-analyze from watchlist

### Company Profile & Sector Analysis
- Company name, sector, industry, CEO, employee count, website
- Sector peers with current price and market cap
- Peer daily performance comparison

### Performance Simulator
- Enter hypothetical investment amount
- See 5 scenarios: fair value reached, +10%, no change, -10%, technical support
- Shows dollar returns and percentage for each scenario
- Educational disclaimers throughout

### News Timeline
- Shows recent news articles used in sentiment analysis
- Source attribution and timestamps
- Expandable list (5 shown by default, expand to see all)
- Direct links to original articles

### Interactive Price Chart
- Multiple time ranges: 1M, 3M, 6M, 1Y
- Price view with toggleable Moving Averages (MA20, MA50, MA200)
- Bollinger Bands overlay
- Volume view with green/red coloring
- RSI view with overbought/oversold reference lines
- Period stats: current price, high, low, change %, average volume

### Portfolio Tracker
- Add/remove hypothetical stock positions (stored in localStorage)
- Real-time price fetching for P&L calculations
- Summary cards: total value, total cost, total P&L, return %
- Average-in support when adding to existing positions
- One-click refresh for latest prices
- Educational disclaimers (no real trades executed)

### Market Overview Dashboard
- Major indices: S&P 500, Dow Jones, NASDAQ, Russell 2000
- Sector performance via ETFs (XLK, XLF, XLV, XLE, etc.) with visual bars
- Top 5 gainers and top 5 losers from large-cap stocks
- Auto-refresh with timestamp

### Stock Screener
- 6 preset sector lists: Mega Cap Tech, Finance, Healthcare, Consumer, Energy, Dividend Stars
- Custom symbol input (comma or space separated)
- Sortable columns: Symbol, Price, Change %, Market Cap, P/E, Beta, Sector
- Filters: Min Market Cap, Max P/E, Max Beta
- Up to 20 symbols per screen

### Shareable Analysis Cards
- Compact visual summary card with direction, scores, price, and summary
- Copy as formatted text to clipboard
- Modal overlay with clean design
- Educational disclaimer included

### Keyboard Shortcuts
- Keys `1`-`7`: Jump directly to each tab
- `Alt+Left`: Previous tab
- `Alt+Right`: Next tab
- Shortcuts disabled when typing in input fields

### AI Agent Debate View
- Conversational format showing each agent presenting findings
- Coordinator moderates the discussion
- Each agent's stance (Bullish/Bearish/Neutral) shown
- Consensus bar showing agent agreement
- Highlights where agents agree or disagree

## Legal Safety

This application uses **educational/descriptive language** throughout:
- "Bullish Signals Detected" instead of "BUY"
- "Bearish Signals Detected" instead of "SELL"
- "Mixed Signals" instead of "HOLD"
- "Estimated Fair Value" instead of "Target Price"
- "Technical Support" instead of "Stop Loss"
- "Analysis suggests..." instead of "You should..."

Disclaimers appear on:
- Main page (before analysis form)
- Every analysis result (bottom of results)
- Page footer
- Terms of Service page (/terms)

## Tech Stack

- **Backend:** TypeScript, Express.js, Elasticsearch
- **AI:** Claude Sonnet (Anthropic API)
- **Data:** Yahoo Finance, Financial Modeling Prep API, NewsAPI
- **Frontend:** Next.js 14, React, Tailwind CSS, Recharts (Bar + Radar charts), Lucide Icons
- **Theming:** CSS Custom Properties with 3 themes
- **Storage:** Elasticsearch (optional) with in-memory fallback

## Development Log

### Phase 1 Complete
- [x] Enhanced Stock Comparison (radar chart, winner highlighting, key findings)
- [x] Historical Analysis Tracking (storage, accuracy, price comparison)
- [x] Watchlist with Smart Alerts (localStorage, price alerts, re-analyze)
- [x] AI Agent Debate View (conversational format, consensus bar)
- [x] API endpoints for history and price data

### Phase 2 Complete
- [x] Company Profile & Sector Analysis (FMP profile, sector peers)
- [x] Performance Simulator (what-if investment scenarios)
- [x] News Timeline (recent articles with source attribution)
- [x] API endpoints for profile, peers, and news

### Phase 3 Complete
- [x] Interactive Price Chart (line chart with MA20/MA50/MA200, Bollinger Bands, RSI, volume views)
- [x] Portfolio Tracker (hypothetical positions, real-time P&L, localStorage persistence)
- [x] Market Overview Dashboard (S&P 500, Dow, NASDAQ, Russell 2000, sector ETFs, top movers)
- [x] UI Animations & Polish (fadeIn, slideUp, scaleIn, stagger animations, card hover effects, custom scrollbar)
- [x] API endpoints for chart data and market overview
- [x] Responsive tab navigation with 6 modes

### Phase 4 Complete
- [x] Stock Screener (preset sector lists, custom symbols, sortable columns, filters for MCap/P/E/Beta)
- [x] Shareable Analysis Cards (compact summary card with copy-to-clipboard)
- [x] Keyboard Shortcuts (1-7 for tabs, Alt+Arrow for prev/next)
- [x] API endpoint for batch stock screening
- [x] Responsive 7-tab navigation
