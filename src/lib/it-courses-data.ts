/**
 * Centralized, verified course data for Skyora's IT training subjects:
 * - /it/data-science
 * - /it/artificial-intelligence
 * - /it/machine-learning
 * - /it/data-analytics
 *
 * Sourced directly from verified database seed records, siteConfig,
 * and existing course definitions. No invented fees, fake ratings, or unverified claims.
 */

export interface ITCourseInfo {
  slug: string;
  route: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  tagline: string;
  duration: string;
  overview: string;
  skills: string[];
  tools: string[];
  jobRoles: string[];
  workplaces: string[];
  highlights: string[];
  prerequisites: string;
  certification: {
    short: string;
    full: string;
  };
  relatedSlugs: string[];
}

export const IT_COURSES_DATA: Record<string, ITCourseInfo> = {
  "data-science": {
    slug: "data-science",
    route: "/it/data-science",
    title: "Data Science",
    seoTitle: "Data Science Course in Kochi | Python, ML & MLOps Training",
    seoDescription:
      "STED Council certified Data Science course in Kochi, Kerala at Skyora Group. Learn Python, statistics, predictive modeling, machine learning, and MLOps with 1:1 mentorship and placement support.",
    tagline:
      "End-to-end data pipelines, statistical modeling, machine learning algorithms and MLOps on real industry datasets.",
    duration: "6 Months",
    overview:
      "The Skyora Data Science program in Kochi is designed to bridge the gap between academic theory and production data engineering. Students master Python, exploratory data analysis, inferential statistics, machine learning algorithms, deep learning fundamentals, and MLOps deployment pipelines under the guidance of working industry mentors.",
    skills: [
      "Python, NumPy & Pandas Data Manipulation",
      "Applied Statistics & Experiment Design",
      "Machine Learning Algorithms (Scikit-Learn, XGBoost)",
      "Deep Learning Foundations (PyTorch)",
      "Feature Engineering & Dimensionality Reduction",
      "MLOps: Model Tracking, Deployment & Monitoring",
      "Capstone: End-to-End Machine Learning Project",
    ],
    tools: [
      "Python",
      "NumPy",
      "Pandas",
      "Scikit-Learn",
      "PyTorch",
      "XGBoost",
      "Jupyter",
      "Git",
    ],
    jobRoles: [
      "Data Scientist",
      "Machine Learning Engineer",
      "Data Analyst",
      "Business Intelligence Analyst",
      "AI/ML Associate",
    ],
    workplaces: [
      "Product & e-commerce companies (e.g., Flipkart, Amazon)",
      "IT services & consulting enterprises (e.g., TCS, Infosys, Accenture)",
      "Fintech, banking & risk analytics units",
      "Specialized data & analytics consulting firms",
    ],
    highlights: [
      "STED Council recognized certification upon successful completion",
      "70% hands-on project work with real industry datasets",
      "Weekly 1:1 mentor code reviews and architecture guidance",
      "Dedicated placement cell support, resume labs & mock interview panels",
    ],
    prerequisites:
      "Basic computer literacy and logical problem-solving abilities. Prior coding experience in any programming language is beneficial but not required; foundational Python programming is taught from scratch.",
    certification: {
      short: "Certificate by STED Council",
      full: "Certificate provided by STED Council (Scientific & Technical Education Development Council) on successful course completion.",
    },
    relatedSlugs: ["machine-learning", "artificial-intelligence", "data-analytics"],
  },

  "artificial-intelligence": {
    slug: "artificial-intelligence",
    route: "/it/artificial-intelligence",
    title: "Artificial Intelligence",
    seoTitle: "Artificial Intelligence (AI) Course in Kochi | Deep Learning & LLMs",
    seoDescription:
      "STED Council certified Artificial Intelligence training in Kochi, Kerala at Skyora Group. Master neural networks, PyTorch, computer vision, NLP, and LLM applications with mentor-led projects.",
    tagline:
      "Build intelligent systems with neural networks, deep learning architectures, computer vision, NLP, and modern LLM applications.",
    duration: "6 Months",
    overview:
      "The Skyora Artificial Intelligence program equips aspiring AI engineers with practical capabilities in deep learning, computer vision, natural language processing (NLP), and large language model (LLM) fine-tuning. Delivered at our Kochi training center with 1:1 practitioner mentorship and portfolio capstone development.",
    skills: [
      "Python for AI & Scientific Computing",
      "TensorFlow & PyTorch Deep Learning Frameworks",
      "Neural Network Architectures & Optimization",
      "Computer Vision & Image Processing (OpenCV)",
      "Natural Language Processing (NLP & Transformers)",
      "Large Language Models (LLMs) & Fine-Tuning",
      "AI Model Serving & RESTful API Deployment",
    ],
    tools: [
      "Python",
      "PyTorch",
      "TensorFlow",
      "Hugging Face",
      "OpenCV",
      "FastAPI",
      "Docker",
    ],
    jobRoles: [
      "AI Engineer",
      "Machine Learning Engineer",
      "Computer Vision Specialist",
      "NLP Engineer",
      "AI Solutions Associate",
    ],
    workplaces: [
      "AI product startups & technology ventures",
      "Global IT services & enterprise consultancies",
      "Enterprise R&D labs and technology innovation centers",
      "Healthcare, fintech, and digital media automation teams",
    ],
    highlights: [
      "STED Council recognized certification upon course completion",
      "Hands-on development of vision, NLP, and generative AI models",
      "Weekly 1:1 feedback from active industry practitioners",
      "Interview preparation with behavioral drills and live technical mock panels",
    ],
    prerequisites:
      "Basic programming concepts and fundamental mathematical reasoning. Beginners start with foundational Python before progressing into advanced deep neural networks.",
    certification: {
      short: "Certificate by STED Council",
      full: "Certificate provided by STED Council (Scientific & Technical Education Development Council) on successful course completion.",
    },
    relatedSlugs: ["machine-learning", "data-science", "data-analytics"],
  },

  "machine-learning": {
    slug: "machine-learning",
    route: "/it/machine-learning",
    title: "Machine Learning",
    seoTitle: "Machine Learning Course in Kochi | Algorithms, Models & MLOps",
    seoDescription:
      "Applied Machine Learning course in Kochi, Kerala at Skyora Group. Master supervised and unsupervised learning, predictive modeling, feature engineering, and MLOps with STED Council certification.",
    tagline:
      "Applied machine learning engineering: predictive modeling, algorithmic feature engineering, model tuning, and production MLOps.",
    duration: "6 Months",
    overview:
      "The Skyora Machine Learning course focuses on the practical mechanics of training, evaluating, and deploying robust mathematical models. Students master regression, classification, clustering, ensemble algorithms (Random Forests, Gradient Boosting), and model deployment pipelines with rigorous code quality standards.",
    skills: [
      "Applied Python & Vectorized Computation (NumPy, Pandas)",
      "Supervised Learning: Regression & Classification",
      "Ensemble Techniques (Random Forest, XGBoost, LightGBM)",
      "Unsupervised Learning & Clustering (K-Means, PCA)",
      "Model Evaluation, Hyperparameter Tuning & Cross-Validation",
      "Feature Engineering & Dimensionality Reduction",
      "MLOps: Model Serialization, APIs & Cloud Deployment",
    ],
    tools: [
      "Python",
      "Scikit-Learn",
      "XGBoost",
      "LightGBM",
      "MLflow",
      "FastAPI",
      "Docker",
    ],
    jobRoles: [
      "Machine Learning Engineer",
      "MLOps Engineer",
      "Data Scientist",
      "Predictive Modeling Specialist",
      "Algorithm Developer",
    ],
    workplaces: [
      "SaaS, fintech, and product tech companies",
      "Enterprise IT solution providers",
      "E-commerce recommendation and fraud detection units",
      "Autonomous systems, IoT, and supply chain analytics teams",
    ],
    highlights: [
      "STED Council recognized certification upon course completion",
      "End-to-end machine learning project shipped to production",
      "Individual mentor assigned for code reviews and architecture guidance",
      "Placement support with technical interview drills and portfolio presentation",
    ],
    prerequisites:
      "Familiarity with basic algebra and logical problem-solving. Python programming basics are covered in the initial modules.",
    certification: {
      short: "Certificate by STED Council",
      full: "Certificate provided by STED Council (Scientific & Technical Education Development Council) on successful course completion.",
    },
    relatedSlugs: ["artificial-intelligence", "data-science", "data-analytics"],
  },

  "data-analytics": {
    slug: "data-analytics",
    route: "/it/data-analytics",
    title: "Data Analytics",
    seoTitle: "Data Analytics Course in Kochi | SQL, Power BI & Tableau Training",
    seoDescription:
      "Job-focused Data Analytics course in Kochi, Kerala by Skyora Group. Master SQL, Power BI, Tableau, Excel automation, and Python analytics with STED Council certification and placement support.",
    tagline:
      "From raw spreadsheets to interactive executive dashboards — SQL, Power BI, Tableau, and business data storytelling.",
    duration: "5 Months",
    overview:
      "The Skyora Data Analytics program trains students to extract, clean, analyze, and visualize complex business data. Through hands-on case studies in retail, finance, and operations, learners master relational database queries with SQL, build dynamic dashboards in Power BI and Tableau, and communicate data insights to stakeholders.",
    skills: [
      "Advanced Excel & Spreadsheet Modeling",
      "SQL for Analytics: Joins, Window Functions, CTEs & Subqueries",
      "Power BI Dashboard Design, Data Modeling & DAX",
      "Tableau Visual Analytics & KPI Reporting",
      "Python for Data Cleaning & Analysis (Pandas, Matplotlib)",
      "Business Intelligence Storytelling & Executive Presentations",
      "Capstone: Real-World Business Case Study Analysis",
    ],
    tools: [
      "SQL",
      "Power BI",
      "Tableau",
      "Excel",
      "Python",
      "Pandas",
      "DAX",
    ],
    jobRoles: [
      "Data Analyst",
      "Business Analyst",
      "MIS Executive",
      "Reporting Analyst",
      "Operations & Revenue Analyst",
    ],
    workplaces: [
      "IT consulting and professional services firms (e.g., TCS, Deloitte, KPMG)",
      "Banking, insurance, and NBFC analytics divisions",
      "E-commerce, logistics, and supply chain enterprises",
      "Global Capability Centers (GCCs) and corporate headquarters",
    ],
    highlights: [
      "STED Council recognized certification upon course completion",
      "Proven student success: 32 students in one batch achieved Microsoft DP-900 certification",
      "Practical portfolio of 5+ industry-grade dashboards",
      "Mock interview series, resume reviews, and placement drive participation",
    ],
    prerequisites:
      "Open to graduates and final-year students of any discipline (B.Tech, BCA, B.Sc, B.Com, BBA). No prior coding background required.",
    certification: {
      short: "Certificate by STED Council",
      full: "Certificate provided by STED Council (Scientific & Technical Education Development Council) on successful course completion.",
    },
    relatedSlugs: ["data-science", "machine-learning", "artificial-intelligence"],
  },
};
