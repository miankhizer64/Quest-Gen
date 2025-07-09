import React, { useState } from "react";
import {
  ChevronRight,
  Upload,
  FileQuestion,
  Download,
  BookOpen,
  Zap,
  Users,
  Star,
  Menu,
  X,
  Play,
  CheckCircle,
  ArrowRight,
  FileText,
  Brain,
  Sparkles,
  GraduationCap,
  Target,
  Clock,
  Award,
  AlarmClock,
  Lightbulb,
  TrendingUp,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface Problem {
  icon: React.ReactNode;
  title: string;
  description: string;
  impact: string;
}

interface Solution {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefit: string;
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
}

interface UseCase {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}

interface Stat {
  number: string;
  label: string;
}

interface DemoStep {
  title: string;
  description: string;
  visual: string;
}

export default function LandingPage(): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeDemo, setActiveDemo] = useState<number>(0);

  const problems: Problem[] = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Time-Intensive Process",
      description: "Extracting important questions from lengthy academic resources requires immense time during the training process.",
      impact: "Teachers spend hours manually creating questions instead of focusing on instruction"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Topic Identification Errors",
      description: "Manual question creation produces frequent topic identification errors that cause students to fail at exam readiness.",
      impact: "Students receive inadequate preparation for examinations"
    },
    {
      icon: <AlarmClock className="w-8 h-8" />,
      title: "Quality Inconsistency",
      description: "Manual methods result in variable results and human mistakes which create obstacles in assessment quality.",
      impact: "Inconsistent question quality affects learning outcomes"
    }
  ];

  const solutions: Solution[] = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "AI-Powered Automation",
      description: "Automated questioning processes with high speed and precision in question generation from academic content.",
      benefit: "Reduces manual labor while maintaining consistent quality"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Intelligent Content Analysis",
      description: "System examines academic concepts and evaluates their value and appropriate knowledge level automatically.",
      benefit: "Ensures questions match educational content accurately"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Scalable & Adaptable",
      description: "Supports various subjects and education levels with continuous AI model upgrades and smooth expansion.",
      benefit: "Adapts to different academic contexts and requirements"
    }
  ];

  const features: Feature[] = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Academic Content Processing",
      description: "Upload PDF documents and our AI analyzes academic concepts, extracting key information for question generation.",
      color: "bg-gradient-to-r from-green-500 to-emerald-600",
    },
    {
      icon: <FileQuestion className="w-8 h-8" />,
      title: "Multiple Question Types",
      description: "Generate various question formats including multiple choice, short answer, and essay-based questions automatically.",
      color: "bg-gradient-to-r from-green-600 to-green-700",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Quality Assurance",
      description: "AI ensures questions directly correspond with educational content while maintaining academic integrity.",
      color: "bg-gradient-to-r from-emerald-500 to-green-600",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "User-Friendly Interface",
      description: "Simple text input system with question organization for educational purposes that improves learning outcomes.",
      color: "bg-gradient-to-r from-green-700 to-emerald-700",
    },
  ];

  const testimonials: Testimonial[] = [
    {
      name: "Dr. Sarah Mitchell",
      role: "Professor",
      company: "Stanford University",
      content: "QuestGen has transformed my approach to exam preparation. The AI-generated questions are contextually accurate and save me hours of manual work.",
      rating: 5,
    },
    {
      name: "Mark Thompson",
      role: "High School Teacher",
      company: "Lincoln High School",
      content: "The system eliminates time-consuming question creation and allows me to focus on actual teaching. My students are better prepared for exams.",
      rating: 5,
    },
    {
      name: "Dr. Emily Chen",
      role: "Education Administrator",
      company: "Metropolitan University",
      content: "QuestGen addresses the gap in automated question generation. It produces relevant questions that match our learning context perfectly.",
      rating: 5,
    },
  ];

  const useCases: UseCase[] = [
    {
      icon: <GraduationCap className="w-12 h-12" />,
      title: "Educational Institutions",
      description: "Support institutional learning activities with automated question generation for both distance education and self-directed study.",
      benefits: [
        "Reduces instructor preparation time",
        "Creates structured examination questions",
        "Maintains academic quality standards",
      ],
    },
    {
      icon: <BookOpen className="w-12 h-12" />,
      title: "Teachers & Educators",
      description: "Eliminate time-consuming manual question creation and focus on essential teaching duties with AI-powered assistance.",
      benefits: [
        "Automated question generation from academic sources",
        "Diverse testing configurations",
        "Consistent question quality",
      ],
    },
    {
      icon: <Brain className="w-12 h-12" />,
      title: "Students & Learners",
      description: "Access well-structured questioning framework that enables focus on critical instruction and better exam preparation.",
      benefits: [
        "Comprehensive topic coverage",
        "Improved exam readiness",
        "Enhanced learning outcomes",
      ],
    },
  ];

  const stats: Stat[] = [
    { number: "85%", label: "Time Reduction in Question Creation" },
    { number: "95%", label: "Topic Coverage Accuracy" },
    { number: "15K+", label: "Educators Using Platform" },
    { number: "99.2%", label: "Content Relevance Score" },
  ];

  const demoSteps: DemoStep[] = [
    {
      title: "Upload Academic Content",
      description: "Upload PDF documents containing academic material for analysis",
      visual: "📚",
    },
    {
      title: "AI Content Analysis",
      description: "System examines academic concepts and evaluates knowledge levels",
      visual: "🔍",
    },
    {
      title: "Automated Question Generation",
      description: "Generate multiple question types with contextual accuracy",
      visual: "⚡",
    },
    {
      title: "Quality Assurance & Export",
      description: "Validate questions and export in preferred formats",
      visual: "✅",
    },
  ];

  const handleMenuToggle = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDemoStepClick = (index: number): void => {
    setActiveDemo(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Navigation */}
      <nav className="relative z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <FileQuestion className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">QuestGen</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-green-600 transition-colors">
                How it Works
              </a>
              <a href="#use-cases" className="text-gray-700 hover:text-green-600 transition-colors">
                Use Cases
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-green-600 transition-colors">
                Pricing
              </a>
              <Link to='/login' className="text-gray-700 hover:text-green-600 transition-colors">
                Sign In
              </Link>
              <Link to='/signup' className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105">
                Try Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden text-gray-700" onClick={handleMenuToggle}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-gray-700 hover:text-green-600 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="block text-gray-700 hover:text-green-600 transition-colors">
                How it Works
              </a>
              <a href="#use-cases" className="block text-gray-700 hover:text-green-600 transition-colors">
                Use Cases
              </a>
              <a href="#pricing" className="block text-gray-700 hover:text-green-600 transition-colors">
                Pricing
              </a>
              <Link to='/login' className="block w-full text-left text-gray-700 hover:text-green-600 transition-colors">
                Sign In
              </Link>
              <Link to='/signup' className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full hover:from-green-600 hover:to-emerald-700 transition-all">
                Try Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-green-100 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-green-700 text-sm font-medium">
                AI-Powered Academic Question Generation
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Solve the Challenge of
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {" "}
                Time-Intensive Question Creation
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Transform lengthy academic resources into precise examination questions instantly. 
              Eliminate manual errors, reduce preparation time, and focus on what matters most - teaching.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to='/signup' className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 flex items-center space-x-2">
                <span>Start Generating Questions</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to='/login' className="bg-white text-gray-700 px-8 py-4 rounded-full text-lg font-semibold border-2 border-gray-200 hover:border-green-500 hover:text-green-600 transition-all flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>See How It Works</span>
              </Link>
            </div>
            <p className="text-gray-500 mt-4">
              No credit card required • AI-powered accuracy • Instant results
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              The Challenge in
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {" "}
                Educational Assessment
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Traditional question creation methods face significant limitations that impact both educators and students
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {problems.map((problem: Problem, index: number) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-green-500 transition-all group">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                  {problem.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{problem.title}</h3>
                <p className="text-gray-600 mb-4">{problem.description}</p>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-700 font-medium">Impact: {problem.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our AI-Powered
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {" "}
                Solution
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              QuestGen addresses these challenges through advanced AI technology and intelligent automation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {solutions.map((solution: Solution, index: number) => (
              <div key={index} className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-green-500 transition-all group shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 text-white">
                  {solution.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{solution.title}</h3>
                <p className="text-gray-600 mb-4">{solution.description}</p>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-green-700 font-medium">Benefit: {solution.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat: Stat, index: number) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How QuestGen
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {" "}
                Works
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple yet powerful process that transforms academic content into quality questions
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {demoSteps.map((step: DemoStep, index: number) => (
              <div
                key={index}
                className="text-center group cursor-pointer"
                onClick={() => handleDemoStepClick(index)}
              >
                <div
                  className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl transition-all ${
                    activeDemo === index
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white transform scale-110"
                      : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                  }`}
                >
                  {step.visual}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Demo Visual */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">{demoSteps[activeDemo].visual}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {demoSteps[activeDemo].title}
              </h3>
              <p className="text-gray-600 text-lg">{demoSteps[activeDemo].description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4ml md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {" "}
                Academic Excellence
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to transform academic content into comprehensive, contextually accurate questions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature: Feature, index: number) => (
              <div key={index} className="group relative">
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-green-500 transition-all group-hover:transform group-hover:scale-105">
                  <div className={`w-16 h-16 ${feature.color} rounded-xl flex items-center justify-center mb-6 text-white`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-24 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Perfect for Every Educational Context
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Supporting institutional learning activities and personalized education across all levels
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase: UseCase, index: number) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-green-500 transition-all group hover:transform hover:scale-105 shadow-sm"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white group-hover:scale-110 transition-transform">
                    {useCase.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{useCase.title}</h3>
                  <p className="text-gray-600 mb-6">{useCase.description}</p>
                </div>
                <div className="space-y-3">
                  {useCase.benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {" "}
                Educators Worldwide
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how QuestGen is transforming question creation across educational institutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial: Testimonial, index: number) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-green-500 transition-all"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i: number) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.role}, {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Question Creation Process?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of educators who have eliminated time-intensive manual question creation 
            and improved their assessment quality with QuestGen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to='/signup' className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105">
              Start Generating Questions - Free Trial
            </Link>
          </div>
          <p className="text-green-200 mt-4">
            No credit card required • Instant setup • AI-powered accuracy
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FileQuestion className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">QuestGen</span>
              </div>
              <p className="text-gray-400">
                Transforming academic content into intelligent questions with AI-powered precision. 
                Perfect for educators who want to focus on teaching, not question creation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Features</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Pricing</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">API</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Integrations</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Documentation</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Best Practices</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Research Papers</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Case Studies</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2">
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">Help Center</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">Contact Us</a>
              <a href="#" className="block text-gray-2400 hover:text-white transition-colors">Community</a>
              <a href="#" className="block text-gray-400 hover:text-white transition-colors">Status</a>
            </div>
          </div>
        </div>
        
        {/* Footer bottom section */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2024 QuestGen. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
    </div>
  );
}