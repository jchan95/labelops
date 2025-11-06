# LabelOps

A data labeling quality and operations dashboard built to demonstrate understanding of AI training data workflows, quality control systems, and operational metrics.

**Live Demo:** [[LabelOps]](https://labelops.netlify.app/)

---

## What It Does

LabelOps simulates a data labeling operation for sentiment analysis, tracking quality metrics and operational performance across 10 labelers processing 1,000 movie reviews.

### Key Features

- **Performance Dashboard** - Real-time metrics showing accuracy, throughput, and cost per labeler
- **Quality Analytics** - Edge case detection for samples with low agreement that need review
- **SQL Query Builder** - Interactive tool to explore the database with visual query construction
- **Operational Metrics** - Track total labels, accuracy rates, and cost analysis

---

## Tech Stack

- **Frontend:** React, JavaScript
- **Backend:** Supabase (PostgreSQL)
- **Data Viz:** Recharts
- **Deployment:** Netlify

---

## Database Schema

The system uses 5 PostgreSQL tables:

- `text_samples` - Movie reviews with true sentiment labels
- `labelers` - Worker profiles with accuracy and rate information
- `labels` - Individual labeling records with timestamps and confidence scores
- `quality_metrics` - Aggregated quality statistics
- `edge_cases` - Samples flagged for review

---

## Local Development

### Prerequisites

- Node.js 16+
- Supabase account

### Setup

1. Clone the repository
```bash
git clone https://github.com/jchan95/labelops.git
cd labelops
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file with your Supabase credentials
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173)

---

## Project Goals

This project was built to demonstrate:

- Understanding of data labeling operations and quality control
- Full-stack development with React and PostgreSQL
- Database design and complex SQL queries
- Data visualization and dashboard design
- Operational metrics relevant to AI/ML companies

---

## Contact

**John Chan**  
📧 jchan95@gmail.com  
💼 [LinkedIn](https://linkedin.com/in/jmchan)  
🐙 [GitHub](https://github.com/jchan95)

---

## License

MIT License - feel free to use this project for learning purposes.
