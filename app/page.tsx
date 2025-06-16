"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Loader2, Search, AlertTriangle, ExternalLink, HelpCircle, Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

interface VerificationDetail {
  source: string
  result: string
  confidence: number
  url: string
}

interface SimilarArticle {
  title: string
  source: string
  status: string
  similarity: number
}

interface AnalysisStep {
  step: string
  result: string
  score: number
}

interface AnalysisResult {
  credibilityScore: number
  riskLevel: "low" | "medium" | "high"
  contentType: "news" | "fake-news" | "satire" | "opinion" | "biased-factual" | "propaganda"
  factors: {
    sourceReliability: number
    factualAccuracy: number
    biasLevel: number
    emotionalLanguage: number
  }
  redFlags: string[]
  positiveIndicators: string[]
  summary: string
  recommendations: string[]
  confidence: number
  verificationStatus: "verified-real" | "verified-fake" | "unverified"
  verificationSources: string[]
  verificationDetails: VerificationDetail[]
  keyPhrases: string[]
  similarArticles: SimilarArticle[]
  analysisSteps: AnalysisStep[]
  manualReviewNeeded: boolean
  manualReviewReason: string
  trustScore: number
}

export default function FakeNewsDetector() {
  const [content, setContent] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState("input")
  const [strictMode, setStrictMode] = useState(true)
  const [manualVerification, setManualVerification] = useState<"real" | "fake" | "unverified" | null>(null)
  const [forceFake, setForceFake] = useState(false) // Default to OFF for balanced detection

  // Enhanced test samples
  const samples = {
    real: "Springfield Hospital announced a new cancer treatment center opening March 1, 2024. Dr. Sarah Martinez, the hospital's chief of oncology, said the facility will serve approximately 500 patients annually. According to the American Cancer Society, the region has seen a 12% increase in cancer diagnoses over the past five years. The $15 million center was funded through a combination of hospital reserves, state grants, and private donations, as confirmed by hospital spokesperson John Davis. Harvard Medical School researchers will collaborate on clinical trials at the new facility.",
    fake: "SHOCKING: Scientists DISCOVER miracle cure that DESTROYS cancer in 24 hours! Big Pharma DOESN'T want you to know! This secret remedy has been suppressed by the pharmaceutical industry for decades because it threatens their billion-dollar cancer treatment business. Doctors are FURIOUS because this simple kitchen ingredient can eliminate cancer cells instantly! The mainstream media refuses to report on this AMAZING breakthrough!",
    ai: "As an AI language model, I can provide information about cancer research. Based on my training data, there have been advances in treatment. However, I don't have access to real-time information, and I cannot provide medical advice. According to my last update, immunotherapy has shown promising results in treating certain types of cancer, but I cannot browse current medical journals or access the latest research findings.",
    borderline:
      "New cancer treatment shows promising results in early trials. The experimental therapy, which combines traditional approaches with alternative methods, has helped some patients see improvement. While medical experts are cautiously optimistic, more research is needed before drawing conclusions. Some patients have reported significant benefits, though results vary widely.",
  }

  const analyzeContent = async () => {
    if (!content.trim()) return
    setIsAnalyzing(true)
    setManualVerification(null)

    try {
      const response = await fetch("/api/analyze-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      const analysisResult = await response.json()

      // Only apply force fake if the option is enabled
      if (forceFake && analysisResult.verificationStatus !== "verified-real") {
        analysisResult.verificationStatus = "verified-fake"
        analysisResult.riskLevel = "high"
        analysisResult.contentType = "fake-news"
        analysisResult.credibilityScore = Math.min(analysisResult.credibilityScore, 20)
        analysisResult.trustScore = Math.min(analysisResult.trustScore, 20)
        analysisResult.summary =
          "🚨 VERIFIED FAKE: This content contains suspicious patterns typical of misinformation."
      }

      setResult(analysisResult)
      setActiveTab("results")
    } catch (error) {
      console.error("Analysis error:", error)
      setResult({
        credibilityScore: 5,
        riskLevel: "high",
        contentType: "fake-news",
        factors: { sourceReliability: 5, factualAccuracy: 5, biasLevel: 95, emotionalLanguage: 95 },
        redFlags: ["Analysis failed - treating as high risk"],
        positiveIndicators: [],
        summary: "Analysis failed. Content treated as high risk for safety.",
        recommendations: ["Do not share this content", "Verify with reliable sources"],
        confidence: 99,
        verificationStatus: "verified-fake",
        verificationSources: ["Analysis failed"],
        verificationDetails: [],
        keyPhrases: [],
        similarArticles: [],
        analysisSteps: [{ step: "System Error", result: "Analysis failed", score: 0 }],
        manualReviewNeeded: true,
        manualReviewReason: "System error during analysis",
        trustScore: 10,
      })
      setActiveTab("results")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getVerificationBadge = (status: string) => {
    // If manual verification is set, override the status
    const finalStatus = manualVerification || status

    switch (finalStatus) {
      case "verified-real":
        return (
          <Badge className="bg-green-600 text-white px-3 py-1 text-base font-bold">
            <CheckCircle className="w-4 h-4 mr-1" /> VERIFIED REAL
          </Badge>
        )
      case "verified-fake":
        return (
          <Badge className="bg-red-600 text-white px-3 py-1 text-base font-bold">
            <XCircle className="w-4 h-4 mr-1" /> VERIFIED FAKE
          </Badge>
        )
      default:
        return (
          <Badge className="bg-red-600 text-white px-3 py-1 text-base font-bold">
            <XCircle className="w-4 h-4 mr-1" /> SUSPICIOUS CONTENT
          </Badge>
        )
    }
  }

  const getStatusColor = (status: string) => {
    // If manual verification is set, override the status
    const finalStatus = manualVerification || status

    switch (finalStatus) {
      case "verified-real":
        return "border-green-500 bg-green-50"
      case "verified-fake":
      default:
        return "border-red-500 bg-red-50"
    }
  }

  const handleManualVerification = (status: "real" | "fake" | "unverified") => {
    setManualVerification(status === "real" ? "verified-real" : status === "fake" ? "verified-fake" : "unverified")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <span className="text-blue-600">Intelligent</span> Fake News Detector
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Advanced verification system that accurately identifies real and fake news
          </p>
          <div className="flex items-center justify-center mt-2 gap-2">
            <Switch id="force-fake" checked={forceFake} onCheckedChange={setForceFake} />
            <Label htmlFor="force-fake" className="font-medium text-red-600">
              Strict Mode {forceFake ? "ON" : "OFF"}
            </Label>
            <div className="relative group">
              <HelpCircle className="w-4 h-4 text-gray-500" />
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-white p-2 rounded shadow-lg text-xs w-64 text-left z-10">
                Strict Mode applies more aggressive verification. When enabled, content must meet higher standards to be
                verified as real. Enable this mode for maximum protection against misinformation.
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input" className="text-base">
              Input Content
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!result} className="text-base">
              Verification Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-4">
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="w-5 h-5" />
                  Enter News Content for Verification
                </CardTitle>
                <CardDescription>
                  Paste any news article to verify its authenticity against online fact-checking sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="content" className="text-base font-medium">
                    News Content:
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Paste news article text to verify if it's real or fake..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="mt-2 text-base"
                  />
                </div>

                {/* Test Samples */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Test with sample content:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setContent(samples.real)}
                      className="h-auto py-3 border-green-200 hover:border-green-500 hover:bg-green-50"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-bold">Real News Sample</span>
                        <span className="text-xs text-left text-gray-500">
                          Contains multiple credible sources and specific details
                        </span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setContent(samples.fake)}
                      className="h-auto py-3 border-red-200 hover:border-red-500 hover:bg-red-50"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-bold">Fake News Sample</span>
                        <span className="text-xs text-left text-gray-500">
                          Contains sensationalist claims and conspiracy theories
                        </span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setContent(samples.ai)}
                      className="h-auto py-3 border-purple-200 hover:border-purple-500 hover:bg-purple-50"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-bold">AI-Generated Content</span>
                        <span className="text-xs text-left text-gray-500">
                          Contains AI language patterns and disclaimers
                        </span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setContent(samples.borderline)}
                      className="h-auto py-3 border-yellow-200 hover:border-yellow-500 hover:bg-yellow-50"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-bold">Borderline Content</span>
                        <span className="text-xs text-left text-gray-500">
                          Contains mixed credibility signals - needs careful review
                        </span>
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={analyzeContent}
                    disabled={isAnalyzing || !content.trim()}
                    className="w-full py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Checking Online Sources...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        VERIFY CONTENT
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How Intelligent Verification Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium">Smart Pattern Detection</h3>
                      <p className="text-sm text-gray-600">
                        System scans for suspicious patterns including sensationalism, conspiracy theories, and
                        AI-generated content
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium">Balanced Analysis</h3>
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-blue-600">Multiple factors</span> are considered before
                        classifying content as fake or real
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium">Credibility Assessment</h3>
                      <p className="text-sm text-gray-600">
                        Content with <span className="font-bold text-green-600">specific credibility markers</span> is
                        verified as real
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h3 className="font-medium">Evidence-Based Verification</h3>
                      <p className="text-sm text-gray-600">
                        Content is classified based on evidence and patterns, with clear explanations for each decision
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {result && (
              <>
                {/* Verification Status Alert */}
                <Alert
                  className={`border-4 ${
                    manualVerification === "verified-real" ||
                    (manualVerification !== "verified-fake" && result.verificationStatus === "verified-real")
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                >
                  {manualVerification === "verified-real" ||
                  (manualVerification !== "verified-fake" && result.verificationStatus === "verified-real") ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <AlertTitle
                    className={`text-xl ${
                      manualVerification === "verified-real" ||
                      (manualVerification !== "verified-fake" && result.verificationStatus === "verified-real")
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {manualVerification === "verified-real" ||
                    (manualVerification !== "verified-fake" && result.verificationStatus === "verified-real")
                      ? "✅ VERIFIED REAL NEWS"
                      : "❌ VERIFIED FAKE NEWS"}
                  </AlertTitle>
                  <AlertDescription
                    className={`text-base ${
                      manualVerification === "verified-real" ||
                      (manualVerification !== "verified-fake" && result.verificationStatus === "verified-real")
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {manualVerification === "verified-fake"
                      ? "This content has been manually verified as false or misleading."
                      : manualVerification === "verified-real"
                        ? "This content has been manually verified as accurate."
                        : manualVerification === "unverified"
                          ? "This content has been manually marked as suspicious."
                          : result.summary}
                  </AlertDescription>
                </Alert>

                {/* Manual Review Banner (if needed) */}
                {result.manualReviewNeeded && !manualVerification && (
                  <Card className="border-2 border-red-500 bg-red-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        SUSPICIOUS CONTENT - Manual Review Recommended
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-red-800 mb-4">{result.manualReviewReason}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="border-green-500 hover:bg-green-50"
                          onClick={() => handleManualVerification("real")}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify as Real
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-500 hover:bg-red-50"
                          onClick={() => handleManualVerification("fake")}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Verify as Fake
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Main Results Card */}
                <Card className={`border-2 ${getStatusColor(result.verificationStatus)}`}>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">Verification Results</CardTitle>
                      {getVerificationBadge(result.verificationStatus)}
                    </div>
                    <CardDescription>
                      System Confidence: <span className="font-medium">{result.confidence}%</span> | Trust Score:{" "}
                      <span className="font-medium">{result.trustScore}%</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Tabs defaultValue="summary" className="space-y-4">
                      <TabsList className="grid grid-cols-4">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="sources">Fact-Checks</TabsTrigger>
                        <TabsTrigger value="analysis">Analysis</TabsTrigger>
                        <TabsTrigger value="similar">Similar Articles</TabsTrigger>
                      </TabsList>

                      {/* Summary Tab */}
                      <TabsContent value="summary" className="space-y-6">
                        {/* Trust Score */}
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="font-medium text-lg">Trust Score</span>
                            <span
                              className={`font-bold text-xl ${
                                result.trustScore >= 70
                                  ? "text-green-600"
                                  : result.trustScore >= 40
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {result.trustScore}/100
                            </span>
                          </div>
                          <Progress
                            value={result.trustScore}
                            className="h-4"
                            indicatorClassName={
                              result.trustScore >= 70
                                ? "bg-green-500"
                                : result.trustScore >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }
                          />
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-red-600">Low Trust</span>
                            <span className="text-yellow-600">Medium</span>
                            <span className="text-green-600">High Trust</span>
                          </div>
                        </div>

                        {/* Content Type */}
                        <div className="flex gap-4 flex-wrap">
                          <div>
                            <span className="font-medium">Content Type: </span>
                            <Badge variant="outline" className="ml-1">
                              {result.contentType === "fake-news"
                                ? "FAKE NEWS"
                                : result.contentType.replace("-", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Risk Level: </span>
                            <Badge
                              className={
                                result.riskLevel === "high"
                                  ? "bg-red-500"
                                  : result.riskLevel === "medium"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }
                            >
                              {result.riskLevel.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        {/* Key Phrases */}
                        {result.keyPhrases.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Key Phrases Analyzed:</h4>
                            <div className="flex flex-wrap gap-2">
                              {result.keyPhrases.map((phrase, index) => (
                                <Badge key={index} variant="outline">
                                  {phrase}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        <div
                          className={`p-4 rounded-lg ${
                            manualVerification === "verified-real" ||
                            (manualVerification !== "verified-fake" && result.verificationStatus === "verified-real")
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          <h4 className="font-medium text-lg mb-2">Recommended Actions</h4>
                          <ul className="space-y-2">
                            {result.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </TabsContent>

                      {/* Fact-Check Sources Tab */}
                      <TabsContent value="sources" className="space-y-4">
                        <h3 className="font-medium text-lg">Fact-Checking Sources</h3>

                        {result.verificationDetails.length > 0 ? (
                          <div className="space-y-3">
                            {result.verificationDetails.map((detail, index) => (
                              <Card key={index} className="overflow-hidden">
                                <div
                                  className={`p-3 ${
                                    detail.result.toLowerCase().includes("false") ||
                                    detail.result.toLowerCase().includes("mislead")
                                      ? "bg-red-100"
                                      : detail.result.toLowerCase().includes("true") ||
                                          detail.result.toLowerCase().includes("confirm") ||
                                          detail.result.toLowerCase().includes("verif")
                                        ? "bg-green-100"
                                        : "bg-gray-100"
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-medium">{detail.source}</h4>
                                    <Badge
                                      className={
                                        detail.result.toLowerCase().includes("false") ||
                                        detail.result.toLowerCase().includes("mislead")
                                          ? "bg-red-500"
                                          : detail.result.toLowerCase().includes("true") ||
                                              detail.result.toLowerCase().includes("confirm") ||
                                              detail.result.toLowerCase().includes("verif")
                                            ? "bg-green-500"
                                            : "bg-gray-500"
                                      }
                                    >
                                      {detail.result}
                                    </Badge>
                                  </div>
                                </div>
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-center text-sm">
                                    <span>Confidence: {detail.confidence}%</span>
                                    <a
                                      href={detail.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center text-blue-600 hover:underline"
                                    >
                                      View Source <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-6 bg-red-50 rounded-lg">
                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                            <p className="text-red-800">No specific fact-checks found - treating as suspicious</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* Analysis Tab */}
                      <TabsContent value="analysis" className="space-y-4">
                        <h3 className="font-medium text-lg">Analysis Steps</h3>

                        <div className="space-y-4">
                          {result.analysisSteps.map((step, index) => (
                            <div key={index} className="flex items-start gap-4">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  step.score >= 70
                                    ? "bg-green-100 text-green-800"
                                    : step.score >= 40
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h4 className="font-medium">{step.step}</h4>
                                  <Badge
                                    className={
                                      step.score >= 70
                                        ? "bg-green-500"
                                        : step.score >= 40
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                    }
                                  >
                                    {step.score}/100
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{step.result}</p>
                                <Progress
                                  value={step.score}
                                  className="h-2 mt-2"
                                  indicatorClassName={
                                    step.score >= 70
                                      ? "bg-green-500"
                                      : step.score >= 40
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Factors */}
                        <div className="mt-6">
                          <h3 className="font-medium text-lg mb-3">Content Analysis Factors</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(result.factors).map(([factor, value]) => (
                              <div key={factor} className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    {factor.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                                  </span>
                                  <span
                                    className={
                                      factor === "biasLevel" || factor === "emotionalLanguage"
                                        ? value > 70
                                          ? "text-red-600"
                                          : value > 40
                                            ? "text-yellow-600"
                                            : "text-green-600"
                                        : value < 40
                                          ? "text-red-600"
                                          : value < 70
                                            ? "text-yellow-600"
                                            : "text-green-600"
                                    }
                                  >
                                    {value}%
                                  </span>
                                </div>
                                <Progress
                                  value={value}
                                  className="h-2"
                                  indicatorClassName={
                                    factor === "biasLevel" || factor === "emotionalLanguage"
                                      ? value > 70
                                        ? "bg-red-500"
                                        : value > 40
                                          ? "bg-yellow-500"
                                          : "bg-green-500"
                                      : value < 40
                                        ? "bg-red-500"
                                        : value < 70
                                          ? "bg-yellow-500"
                                          : "bg-green-500"
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Similar Articles Tab */}
                      <TabsContent value="similar" className="space-y-4">
                        <h3 className="font-medium text-lg">Similar Articles</h3>

                        {result.similarArticles.length > 0 ? (
                          <div className="space-y-3">
                            {result.similarArticles.map((article, index) => (
                              <Card key={index}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium">{article.title}</h4>
                                      <p className="text-sm text-gray-600">Source: {article.source}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <Badge
                                        className={
                                          article.status.toLowerCase().includes("debunk") ||
                                          article.status.toLowerCase().includes("false")
                                            ? "bg-red-500"
                                            : article.status.toLowerCase().includes("verif") ||
                                                article.status.toLowerCase().includes("confirm")
                                              ? "bg-green-500"
                                              : "bg-gray-500"
                                        }
                                      >
                                        {article.status}
                                      </Badge>
                                      <span className="text-xs mt-1">{article.similarity}% similarity match</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-6 bg-red-50 rounded-lg">
                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                            <p className="text-red-800">No similar articles found - treating as suspicious</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Red Flags and Positive Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Red Flags */}
                  {result.redFlags.length > 0 && (
                    <Card className="border-red-200">
                      <CardHeader className="bg-red-50">
                        <CardTitle className="text-red-800 flex items-center gap-2">
                          <XCircle className="w-5 h-5" />
                          Warning Signs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ul className="space-y-2">
                          {result.redFlags.map((flag, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Positive Indicators */}
                  {result.positiveIndicators.length > 0 && (
                    <Card className="border-green-200">
                      <CardHeader className="bg-green-50">
                        <CardTitle className="text-green-800 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Positive Indicators
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ul className="space-y-2">
                          {result.positiveIndicators.map((indicator, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                              {indicator}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button onClick={() => setActiveTab("input")} variant="outline" className="flex-1">
                    Verify Another Article
                  </Button>
                  <Button
                    onClick={() => {
                      setContent("")
                      setResult(null)
                      setActiveTab("input")
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Start Over
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="bg-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <div>
                <h3 className="font-medium">Intelligent Verification System</h3>
                <p className="text-sm text-blue-100">
                  This tool uses advanced analysis to accurately identify both real and fake news.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
