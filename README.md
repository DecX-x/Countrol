# Countrol - AI Agent Based Financial Assistant

Countrol is an intelligent financial management application powered by advanced AI agents and modern cloud technologies. It helps users track expenses, analyze financial patterns, and make informed financial decisions through natural language interactions and image processing capabilities.

## 🌟 Features

### 💬 AI-Powered Chat Interface
- Natural language processing for financial queries
- Intelligent expense categorization and analysis
- Real-time conversation with AI financial advisor
- Support for both text and image inputs

### 📊 Smart Financial Tracking
- Automated transaction recording via receipt scanning
- Real-time expense breakdown with interactive charts
- Income vs expense comparison with visual indicators
- Comprehensive financial summaries and insights

### 📱 Modern User Experience
- Responsive design for desktop and mobile
- Glassmorphism UI with smooth animations
- Real-time data updates and streaming responses
- Intuitive navigation and user-friendly interface

### 🤖 AI Agent Capabilities
- **Create**: Add new income/expense transactions
- **Read**: Retrieve and analyze financial data
- **Update**: Modify existing transaction records
- **Delete**: Remove unwanted transactions
- **Analyze**: Generate insights from spending patterns

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization
- **Radix UI** - Accessible component primitives

### Backend & AI
- **Alibaba Cloud Qwen-Turbo** - Primary LLM for financial reasoning
- **Alibaba Cloud Qwen-VL** - Vision-language model for receipt processing
- **LangChain** - AI agent orchestration framework
- **LangGraph** - Workflow management for AI agents

### Database
- **MongoDB ApsaraDB** - Cloud-native document database


### Infrastructure
- **Alibaba Cloud** - Cloud computing platform


## 🏗️ Architecture

### AI Agent Workflow

```
User Input → Agent Router → Tool Selection → Execution → Response
     ↓            ↓             ↓            ↓          ↓
   Text/Image → Qwen Models → Financial Tools → Database → User
```

### Core Components

1. **Agent Controller** (`lib/agent.ts`)
   - Orchestrates AI model interactions
   - Manages conversation context and memory
   - Routes between text and vision models

2. **Financial Tools** (`lib/tools/financeTools.ts`)
   - CRUD operations for transactions
   - Data validation and processing
   - MongoDB integration

3. **Vision Processing**
   - Receipt image analysis using Qwen-VL
   - Automatic data extraction
   - Transaction detail recognition

4. **Financial Summarizer** (`lib/summarizer.ts`)
   - Comprehensive spending analysis
   - Trend identification
   - Personalized recommendations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB ApsaraDB instance
- Alibaba Cloud API credentials

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd countrol
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env.local` file:
```env
# Alibaba Cloud API
API_KEY=your_modelstudio_api_key

# MongoDB ApsaraDB
MONGO_URI=mongodb://your_mongodb_connection_string
DATABASE_NAME=countrol_db

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. **Database Setup**
```bash
# Seed initial data (optional)
npm run seed
```

5. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📖 Usage Guide

### Basic Operations

1. **Add Transactions**
   - Type: "Add expense 50000 for lunch at restaurant"
   - Upload receipt images for automatic processing
   - Use the chat interface for natural language input

2. **View Financial Data**
   - Navigate to `/tracker` for expense breakdown
   - View pie charts and category analysis
   - Generate comprehensive financial summaries

3. **AI Chat Assistant**
   - Ask: "How much did I spend this month?"
   - Query: "Show my transportation expenses"
   - Request: "Give me budgeting advice"

### Image Processing

1. **Upload Receipt**
   - Take photo of receipt or upload image
   - AI automatically extracts transaction details
   - Review and confirm before saving

2. **Supported Formats**
   - JPG, PNG image formats
   - Clear, readable receipt text
   - Indonesian and English receipts

## 🔧 API Endpoints

### Chat Interface
```
POST /api/chat
- Process user messages with AI agent
- Handle both text and image inputs
- Stream real-time responses
```

### Transactions
```
GET /api/transactions?userId=xxx
- Retrieve user transactions
- Support filtering by type, category, date
- Return formatted financial data
```

### Financial Summary
```
GET /api/summary?userId=xxx
- Generate comprehensive financial analysis
- AI-powered insights and recommendations
- Exportable summary data
```

## 🤖 AI Models Integration

### Qwen-Turbo
- **Purpose**: Primary reasoning and tool execution
- **Capabilities**: Natural language understanding, financial analysis
- **Integration**: LangChain tools binding

### Qwen-VL (Vision-Language)
- **Purpose**: Receipt and document processing
- **Capabilities**: OCR, data extraction, multimodal understanding
- **Integration**: Image analysis pipeline

### Model Selection Logic
```typescript
// Text-only queries → Qwen-Turbo
// Image processing → Qwen-VL
// Tool execution → Qwen-Turbo with function calling
```

## 📊 Database Schema

### Transactions Collection
```typescript
interface Transaction {
  _id: ObjectId
  userId: string
  type: "income" | "expense"
  category: string
  amount: Decimal128
  date: Date
  description: string
  createdAt: Date
  updatedAt: Date
}
```

### Users Collection
```typescript
interface User {
  userId: string
  username: string
  email: string
  createdAt: Date
  updatedAt: Date
}
```

## 🔐 Security Features

- **Input Validation**: Comprehensive data sanitization
- **Type Safety**: Full TypeScript implementation
- **MongoDB Security**: Parameterized queries prevent injection
- **API Rate Limiting**: Prevents abuse and ensures fair usage

## 🎯 Future Enhancements

### Planned Features
- [ ] Multi-currency support
- [ ] Budget planning and alerts
- [ ] Investment tracking
- [ ] Financial goal setting
- [ ] Bank account integration
- [ ] Expense prediction models

### Technical Improvements
- [ ] Offline support with PWA
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Mobile application (React Native)
- [ ] Voice input support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Countrol** - Taking control of your finances with AI 🚀💰
