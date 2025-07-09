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
} from "lucide-react";
import { Link } from "react-router-dom";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface QuestionType {
  type: string;
  count: string;
  description: string;
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

  const features: Feature[] = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Smart PDF Upload",
      description:
        "Upload any PDF document and our AI instantly analyzes the content to understand key concepts and topics.",
      color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Question Generation",
      description:
        "Advanced algorithms generate diverse question types: multiple choice, short answer, essay questions, and more.",
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Customizable Difficulty",
      description:
        "Set difficulty levels from beginner to advanced. Perfect for different grade levels and learning objectives.",
      color: "bg-gradient-to-r from-green-500 to-emerald-500",
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: "Export & Share",
      description:
        "Download questions as PDF, Word, or integrate directly into your Learning Management System.",
      color: "bg-gradient-to-r from-orange-500 to-red-500",
    },
  ];

  const questionTypes: QuestionType[] = [
    {
      type: "Multiple Choice",
      count: "40%",
      description: "Auto-generated with plausible distractors",
    },
    {
      type: "Short Answer",
      count: "30%",
      description: "Key concept identification questions",
    },
    {
      type: "Essay Questions",
      count: "20%",
      description: "Critical thinking and analysis prompts",
    },
    {
      type: "True/False",
      count: "10%",
      description: "Quick comprehension checks",
    },
  ];

  const testimonials: Testimonial[] = [
    {
      name: "Dr. Sarah Mitchell",
      role: "Professor",
      company: "Stanford University",
      content:
        "QuestGen saves me hours every week. The questions are thoughtful and actually test comprehension, not just memorization.",
      rating: 5,
    },
    {
      name: "Mark Thompson",
      role: "High School Teacher",
      company: "Lincoln High School",
      content:
        "My students are more engaged with these AI-generated questions. They're challenging but fair, and cover all the important material.",
      rating: 5,
    },
    {
      name: "Lisa Chen",
      role: "Training Manager",
      company: "TechCorp",
      content:
        "We use QuestGen for employee training assessments. It's incredibly efficient and the questions are always relevant.",
      rating: 5,
    },
  ];

  const useCases: UseCase[] = [
    {
      icon: <GraduationCap className="w-12 h-12" />,
      title: "Educators & Teachers",
      description:
        "Create assessments, quizzes, and study guides from textbooks, research papers, and course materials.",
      benefits: [
        "Save 5+ hours per week",
        "Consistent question quality",
        "Multiple difficulty levels",
      ],
    },
    {
      icon: <BookOpen className="w-12 h-12" />,
      title: "Students & Learners",
      description:
        "Generate practice questions from lecture notes, textbooks, and study materials for better preparation.",
      benefits: [
        "Active learning approach",
        "Self-assessment tools",
        "Comprehensive coverage",
      ],
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Corporate Training",
      description:
        "Transform training manuals and documents into engaging assessments for employee development.",
      benefits: [
        "Automated assessment creation",
        "Standardized evaluations",
        "Progress tracking",
      ],
    },
  ];

  const stats: Stat[] = [
    { number: "500K+", label: "Questions Generated" },
    { number: "15K+", label: "Educators Using" },
    { number: "99.2%", label: "Accuracy Rate" },
    { number: "4.8/5", label: "User Rating" },
  ];

  const demoSteps: DemoStep[] = [
    {
      title: "Upload Your PDF",
      description: "Drag and drop any educational PDF document",
      visual: "📄",
    },
    {
      title: "AI Analysis",
      description: "Our AI reads and understands the content structure",
      visual: "🧠",
    },
    {
      title: "Question Generation",
      description: "Generate multiple question types automatically",
      visual: "❓",
    },
    {
      title: "Download & Use",
      description: "Export questions in your preferred format",
      visual: "⬇",
    },
  ];

  const handleMenuToggle = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDemoStepClick = (index: number): void => {
    setActiveDemo(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Navigation */}
      <nav className="relative z-50 bg-black bg-opacity-10 border-b border-white border-opacity-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FileQuestion className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">QuestGen</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="#features"
                className="text-white text-opacity-80 hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                to="#how-it-works"
                className="text-white text-opacity-80 hover:text-white transition-colors"
              >
                How it Works
              </Link>
              <Link
                to="#use-cases"
                className="text-white text-opacity-80 hover:text-white transition-colors"
              >
                Use Cases
              </Link>
              <Link
                to="#pricing"
                className="text-white text-opacity-80 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link to="/login" className="text-white text-opacity-80 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to='/signup' className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105">
                Try Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-white"
              onClick={handleMenuToggle}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-black bg-opacity-10 border-t border-white border-opacity-10">
            <div className="px-4 py-4 space-y-4">
              <Link
                to="#features"
                className="block text-white text-opacity-80 hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                to="#how-it-works"
                className="block text-white text-opacity-80 hover:text-white transition-colors"
              >
                How it Works
              </Link>
              <Link
                to="#use-cases"
                className="block text-white text-opacity-80 hover:text-white transition-colors"
              >
                Use Cases
              </Link>
              <Link
                to="#pricing"
                className="block text-white text-opacity-80 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <button className="block w-full text-left text-white text-opacity-80 hover:text-white transition-colors">
                Sign In
              </button>
              <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all">
                Try Free
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 from-opacity-20 to-purple-600 to-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white bg-opacity-10 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-opacity-90 text-sm">
                AI-Powered Question Generation
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Turn Any PDF Into
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {" "}
                Smart Questions
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white text-opacity-80 mb-8 max-w-3xl mx-auto">
              Upload your educational content and let AI generate comprehensive
              questions instantly. Perfect for teachers, students, and trainers
              who want to create engaging assessments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center space-x-2">
                <span>Generate Questions Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="bg-white bg-opacity-10 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-20 transition-all flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>See Demo</span>
              </button>
            </div>
            <p className="text-white text-opacity-60 mt-4">
              No sign-up required • Generate 5 questions free • No credit card
              needed
            </p>
          </div>
        </div>

        {/* Floating Animation Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-indigo-500 bg-opacity-20 rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500 bg-opacity-20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-500 bg-opacity-20 rounded-full"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white bg-opacity-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat: Stat, index: number) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-white text-opacity-60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              See QuestGen in
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {" "}
                Action
              </span>
            </h2>
            <p className="text-xl text-white text-opacity-80 max-w-3xl mx-auto">
              Watch how easy it is to transform any PDF into comprehensive
              questions in just minutes
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
                      ? "bg-gradient-to-r from-yellow-400 to-orange-400 transform scale-110"
                      : "bg-white bg-opacity-10 group-hover:bg-opacity-20"
                  }`}
                >
                  {step.visual}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-white text-opacity-70 text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Demo Visual */}
          <div className="bg-white bg-opacity-10 rounded-2xl p-8 border border-white border-opacity-10">
            <div className="bg-gradient-to-r from-indigo-500 from-opacity-20 to-purple-500 to-opacity-20 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">
                {demoSteps[activeDemo].visual}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {demoSteps[activeDemo].title}
              </h3>
              <p className="text-white text-opacity-80 text-lg">
                {demoSteps[activeDemo].description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white bg-opacity-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features for
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                Smart Assessment
              </span>
            </h2>
            <p className="text-xl text-white text-opacity-80 max-w-3xl mx-auto">
              Everything you need to create comprehensive and engaging questions
              from any PDF content
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature: Feature, index: number) => (
              <div key={index} className="group relative">
                <div className="bg-white bg-opacity-10 rounded-2xl p-8 border border-white border-opacity-10 hover:border-opacity-20 transition-all group-hover:transform group-hover:scale-105">
                  <div
                    className={`w-16 h-16 ${feature.color} rounded-xl flex items-center justify-center mb-6 text-white`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-white text-opacity-70">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Question Types */}
          <div className="bg-white bg-opacity-10 rounded-2xl p-8 border border-white border-opacity-10">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">
              Question Types Generated
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {questionTypes.map((type: QuestionType, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {type.count}
                  </div>
                  <h4 className="text-white font-semibold mb-2">{type.type}</h4>
                  <p className="text-white text-opacity-70 text-sm">
                    {type.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Perfect For Every Learning Environment
            </h2>
            <p className="text-xl text-white text-opacity-80 max-w-3xl mx-auto">
              Whether you're teaching, learning, or training, QuestGen adapts to
              your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase: UseCase, index: number) => (
              <div
                key={index}
                className="bg-white bg-opacity-10 rounded-2xl p-8 border border-white border-opacity-10 hover:border-opacity-20 transition-all group hover:transform hover:scale-105"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white group-hover:scale-110 transition-transform">
                    {useCase.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    {useCase.title}
                  </h3>
                  <p className="text-white text-opacity-70 mb-6">
                    {useCase.description}
                  </p>
                </div>
                <div className="space-y-3">
                  {useCase.benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-white text-opacity-80">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-white bg-opacity-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Trusted by
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                Educators Worldwide
              </span>
            </h2>
            <p className="text-xl text-white text-opacity-80 max-w-3xl mx-auto">
              See what educators and trainers are saying about QuestGen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial: Testimonial, index: number) => (
              <div
                key={index}
                className="bg-white bg-opacity-10 rounded-2xl p-8 border border-white border-opacity-10 hover:border-opacity-20 transition-all"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i: number) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-white text-opacity-80 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-white text-opacity-60">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 from-opacity-20 to-purple-600 to-opacity-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your PDFs into Questions?
          </h2>
          <p className="text-xl text-white text-opacity-80 mb-8">
            Join thousands of educators who save time and create better
            assessments with QuestGen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105">
              Start Generating Questions - It's Free!
            </button>
          </div>
          <p className="text-white text-opacity-60 mt-4">
            No credit card required • 5 free questions • Upgrade anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black bg-opacity-20 border-t border-white border-opacity-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileQuestion className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">QuestGen</span>
              </div>
              <p className="text-white text-opacity-60">
                Transform any PDF into intelligent questions with the power of
                AI. Perfect for educators, students, and trainers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-2">
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  Features
                </Link>
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  API
                </Link>
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  Integrations
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <div className="space-y-2">
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  Blog
                </Link>
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  Tutorials
                </Link>
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  Question Bank
                </Link>
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  Templates
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  Help Center
                </Link>
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  Community
                </Link>
                <Link
                  to="#"
                  className="block text-white text-opacity-60 hover:text-white transition-colors"
                >
                  Status
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white border-opacity-10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-white text-opacity-60">
              © 2025 QuestGen. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <Link
                to="#"
                className="text-white text-opacity-60 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="#"
                className="text-white text-opacity-60 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}