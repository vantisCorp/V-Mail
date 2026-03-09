/**
 * Anomaly Detection Service
 * Issue #32 - V-Mail v1.4.0 AI-Powered Intelligence
 */

import {
  AnomalyDetectionResult,
  AnomalyType,
  AnomalySeverity,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RiskLevel,
  DetectionStatus,
  AnomalyIndicator,
  RecommendedAction,
  ActionType,
  AnomalyDetectionConfig,
  AnomalyDetectionStatistics,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PhishingIndicator,
  PhishingIndicatorType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SpamIndicator,
  SpamIndicatorType,
  SenderReputation,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SenderCategory,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TrustLevel,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SenderHistoricalData,
  SenderFlag,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  BehavioralAnalysis,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  BehavioralPattern,
  PatternType,
  BehavioralBaseline,
  LinkAnalysis,
  LinkCategory,
  AttachmentAnalysis,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  AttachmentIndicator,
  DEFAULT_ANOMALY_CONFIG,
  PHISHING_INDICATOR_WEIGHTS,
  SPAM_INDICATOR_WEIGHTS,
  URGENCY_PHRASES,
  SUSPICIOUS_TLDS,
  MALICIOUS_URL_PATTERNS
} from '../types/anomalyDetection';

export class AnomalyDetectionService {
  private static instance: AnomalyDetectionService;
  private config: AnomalyDetectionConfig;
  private statistics: AnomalyDetectionStatistics;
  private cache: Map<string, AnomalyDetectionResult> = new Map();
  private senderReputationData: Map<string, SenderReputation> = new Map();
  private behavioralBaselines: Map<string, BehavioralBaseline> = new Map();

  private constructor(config?: Partial<AnomalyDetectionConfig>) {
    this.config = { ...DEFAULT_ANOMALY_CONFIG, ...config };
    this.statistics = this.initializeStatistics();
  }

  static getInstance(config?: Partial<AnomalyDetectionConfig>): AnomalyDetectionService {
    if (!AnomalyDetectionService.instance) {
      AnomalyDetectionService.instance = new AnomalyDetectionService(config);
    }
    return AnomalyDetectionService.instance;
  }

  private initializeStatistics(): AnomalyDetectionStatistics {
    return {
      totalAnalyzed: 0,
      anomaliesDetected: 0,
      phishingDetected: 0,
      spamDetected: 0,
      falsePositives: 0,
      avgAnalysisTime: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      detectionsByType: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      detectionsBySeverity: {} as any,
      accuracy: 0,
      lastReset: Date.now()
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async detectAnomalies(email: any): Promise<AnomalyDetectionResult> {
    const startTime = Date.now();
    this.statistics.totalAnalyzed++;

    // Check cache
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cacheKey = `${email.id}-${Date.now()}`;
    if (this.cache.has(email.id)) {
      return this.cache.get(email.id)!;
    }

    const result: AnomalyDetectionResult = {
      id: this.generateId(),
      emailId: email.id,
      type: AnomalyType.UNKNOWN,
      severity: AnomalySeverity.INFO,
      riskScore: 0,
      confidence: 0,
      status: DetectionStatus.ANALYZING,
      timestamp: Date.now(),
      description: '',
      indicators: [],
      recommendedActions: []
    };

    try {
      const analyses = await Promise.all([
        this.detectPhishing(email),
        this.detectSpam(email),
        this.analyzeSenderReputation(email),
        this.analyzeBehavior(email),
        this.scanLinks(email),
        this.scanAttachments(email)
      ]);

      const [phishingResult, spamResult, senderResult, behaviorResult, linkResult, attachmentResult] = analyses;

      // Aggregate results
      const indicators: AnomalyIndicator[] = [];
      let totalRiskScore = 0;
      let maxConfidence = 0;

      if (phishingResult && this.config.enablePhishingDetection) {
        indicators.push(...phishingResult.indicators);
        totalRiskScore += phishingResult.riskScore;
        maxConfidence = Math.max(maxConfidence, phishingResult.confidence);
        this.statistics.phishingDetected++;
      }

      if (spamResult && this.config.enableSpamDetection) {
        indicators.push(...spamResult.indicators);
        totalRiskScore += spamResult.riskScore;
        maxConfidence = Math.max(maxConfidence, spamResult.confidence);
        this.statistics.spamDetected++;
      }

      if (senderResult && this.config.enableSenderReputation) {
        indicators.push(...senderResult.indicators);
        totalRiskScore += senderResult.riskScore;
        maxConfidence = Math.max(maxConfidence, senderResult.confidence);
      }

      if (behaviorResult && this.config.enableBehavioralAnalysis) {
        indicators.push(...behaviorResult.indicators);
        totalRiskScore += behaviorResult.riskScore;
        maxConfidence = Math.max(maxConfidence, behaviorResult.confidence);
      }

      if (linkResult && this.config.enableLinkScan) {
        indicators.push(...linkResult.indicators);
        totalRiskScore += linkResult.riskScore;
        maxConfidence = Math.max(maxConfidence, linkResult.confidence);
      }

      if (attachmentResult && this.config.enableAttachmentScan) {
        indicators.push(...attachmentResult.indicators);
        totalRiskScore += attachmentResult.riskScore;
        maxConfidence = Math.max(maxConfidence, attachmentResult.confidence);
      }

      // Normalize risk score
      result.riskScore = Math.min(totalRiskScore / 6, 1);
      result.confidence = maxConfidence;
      result.indicators = indicators;

      // Determine anomaly type and severity
      const analysis = this.determineAnomalyType(result);
      result.type = analysis.type;
      result.severity = analysis.severity;
      result.description = analysis.description;
      result.recommendedActions = this.generateRecommendedActions(result);

      result.status = DetectionStatus.COMPLETED;

      if (result.riskScore >= this.config.riskScoreThreshold) {
        this.statistics.anomaliesDetected++;
        this.updateStatisticsByType(result.type);
        this.updateStatisticsBySeverity(result.severity);
      }

      // Cache result
      if (this.cache.size < this.config.cacheSize) {
        this.cache.set(email.id, result);
      }
    } catch (error) {
      result.status = DetectionStatus.FAILED;
      result.description = error instanceof Error ? error.message : 'Analysis failed';
    }

    const analysisTime = Date.now() - startTime;
    this.updateAnalysisTime(analysisTime);

    return result;
  }

  private async detectPhishing(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    email: any
  ): Promise<{ riskScore: number; confidence: number; indicators: AnomalyIndicator[] } | null> {
    const indicators: AnomalyIndicator[] = [];
    let totalScore = 0;
    let indicatorCount = 0;

    // Check sender display name vs email
    if (email.sender && email.sender.email) {
      const domainMatch = this.checkDomainMismatch(email);
      if (domainMatch) {
        indicators.push(domainMatch);
        totalScore += PHISHING_INDICATOR_WEIGHTS[PhishingIndicatorType.DOMAIN_MISMATCH];
        indicatorCount++;
      }
    }

    // Check for urgency language
    const urgencyCheck = this.checkUrgencyLanguage(email);
    if (urgencyCheck) {
      indicators.push(urgencyCheck);
      totalScore += PHISHING_INDICATOR_WEIGHTS[PhishingIndicatorType.URGENCY_LANGUAGE];
      indicatorCount++;
    }

    // Check for credential requests
    const credentialCheck = this.checkCredentialRequests(email);
    if (credentialCheck) {
      indicators.push(credentialCheck);
      totalScore += PHISHING_INDICATOR_WEIGHTS[PhishingIndicatorType.CREDENTIAL_REQUEST];
      indicatorCount++;
    }

    // Check for suspicious URLs
    const urlCheck = this.checkSuspiciousUrls(email);
    if (urlCheck) {
      indicators.push(...urlCheck);
      totalScore += PHISHING_INDICATOR_WEIGHTS[PhishingIndicatorType.SUSPICIOUS_URL];
      indicatorCount++;
    }

    // Check for generic greetings
    const greetingCheck = this.checkGenericGreeting(email);
    if (greetingCheck) {
      indicators.push(greetingCheck);
      totalScore += PHISHING_INDICATOR_WEIGHTS[PhishingIndicatorType.GENERIC_GREETING];
      indicatorCount++;
    }

    if (indicatorCount === 0) {
      return null;
    }

    const riskScore = totalScore / indicatorCount;
    const confidence = Math.min(riskScore + 0.1, 1);

    return { riskScore, confidence, indicators };
  }

  private async detectSpam(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    email: any
  ): Promise<{ riskScore: number; confidence: number; indicators: AnomalyIndicator[] } | null> {
    const indicators: AnomalyIndicator[] = [];
    let totalScore = 0;
    let indicatorCount = 0;

    // Check for promotional language
    const promoCheck = this.checkPromotionalLanguage(email);
    if (promoCheck) {
      indicators.push(promoCheck);
      totalScore += SPAM_INDICATOR_WEIGHTS[SpamIndicatorType.PROMOTIONAL_LANGUAGE];
      indicatorCount++;
    }

    // Check for excessive caps
    const capsCheck = this.checkExcessiveCaps(email);
    if (capsCheck) {
      indicators.push(capsCheck);
      totalScore += SPAM_INDICATOR_WEIGHTS[SpamIndicatorType.EXCESSIVE_CAPS];
      indicatorCount++;
    }

    // Check for excessive punctuation
    const punctCheck = this.checkExcessivePunctuation(email);
    if (punctCheck) {
      indicators.push(punctCheck);
      totalScore += SPAM_INDICATOR_WEIGHTS[SpamIndicatorType.EXCESSIVE_PUNCTUATION];
      indicatorCount++;
    }

    // Check for price mentions
    const priceCheck = this.checkPriceMentions(email);
    if (priceCheck) {
      indicators.push(priceCheck);
      totalScore += SPAM_INDICATOR_WEIGHTS[SpamIndicatorType.PRICE_MENTION];
      indicatorCount++;
    }

    if (indicatorCount === 0) {
      return null;
    }

    const riskScore = totalScore / indicatorCount;
    const confidence = Math.min(riskScore + 0.1, 1);

    return { riskScore, confidence, indicators };
  }

  private async analyzeSenderReputation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    email: any
  ): Promise<{ riskScore: number; confidence: number; indicators: AnomalyIndicator[] } | null> {
    if (!email.sender || !email.sender.email) {
      return null;
    }

    const senderEmail = email.sender.email;
    const domain = senderEmail.split('@')[1];
    const indicators: AnomalyIndicator[] = [];

    let riskScore = 0;
    let confidence = 0.8;

    // Check if sender is new
    if (!this.senderReputationData.has(senderEmail)) {
      indicators.push({
        type: SenderFlag.NEW_SENDER,
        value: 'New sender detected',
        confidence: 0.6,
        source: 'sender-reputation'
      });
      riskScore += 0.3;
      confidence = 0.7;
    }

    // Check for suspicious domain
    if (this.isSuspiciousDomain(domain)) {
      indicators.push({
        type: SenderFlag.SUSPICIOUS_DOMAIN,
        value: `Suspicious domain: ${domain}`,
        confidence: 0.8,
        source: 'sender-reputation'
      });
      riskScore += 0.7;
      confidence = 0.9;
    }

    if (indicators.length === 0) {
      return null;
    }

    return { riskScore, confidence, indicators };
  }

  private async analyzeBehavior(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    email: any
  ): Promise<{ riskScore: number; confidence: number; indicators: AnomalyIndicator[] } | null> {
    if (!email.sender || !email.sender.email) {
      return null;
    }

    const senderEmail = email.sender.email;
    const baseline = this.behavioralBaselines.get(senderEmail);

    if (!baseline) {
      return null;
    }

    const indicators: AnomalyIndicator[] = [];
    let totalDeviation = 0;
    let indicatorCount = 0;

    // Check email volume
    const volumeCheck = this.checkEmailVolume(senderEmail, baseline);
    if (volumeCheck) {
      indicators.push(volumeCheck);
      totalDeviation += volumeCheck.confidence;
      indicatorCount++;
    }

    if (indicatorCount === 0) {
      return null;
    }

    const riskScore = totalDeviation / indicatorCount;
    const confidence = 0.7;

    return { riskScore, confidence, indicators };
  }

  private async scanLinks(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    email: any
  ): Promise<{ riskScore: number; confidence: number; indicators: AnomalyIndicator[] } | null> {
    const body = email.body || '';
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const urls = body.match(urlRegex);

    if (!urls || urls.length === 0) {
      return null;
    }

    const indicators: AnomalyIndicator[] = [];
    let riskScore = 0;
    let confidence = 0;

    for (const url of urls) {
      const linkAnalysis = this.analyzeLink(url);
      if (linkAnalysis.isMalicious || linkAnalysis.riskScore > 0.5) {
        indicators.push({
          type: LinkCategory.SUSPICIOUS,
          value: url,
          confidence: linkAnalysis.riskScore,
          source: 'link-scan'
        });
        riskScore = Math.max(riskScore, linkAnalysis.riskScore);
        confidence = Math.max(confidence, linkAnalysis.riskScore);
      }
    }

    if (indicators.length === 0) {
      return null;
    }

    return { riskScore, confidence, indicators };
  }

  private async scanAttachments(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    email: any
  ): Promise<{ riskScore: number; confidence: number; indicators: AnomalyIndicator[] } | null> {
    if (!email.attachments || email.attachments.length === 0) {
      return null;
    }

    const indicators: AnomalyIndicator[] = [];
    let riskScore = 0;
    let confidence = 0;

    for (const attachment of email.attachments) {
      const attachmentAnalysis = this.analyzeAttachment(attachment);
      if (attachmentAnalysis.isMalicious || attachmentAnalysis.riskScore > 0.5) {
        indicators.push({
          type: 'MALICIOUS_ATTACHMENT',
          value: attachment.filename,
          confidence: attachmentAnalysis.riskScore,
          source: 'attachment-scan'
        });
        riskScore = Math.max(riskScore, attachmentAnalysis.riskScore);
        confidence = Math.max(confidence, attachmentAnalysis.riskScore);
      }
    }

    if (indicators.length === 0) {
      return null;
    }

    return { riskScore, confidence, indicators };
  }

  private analyzeLink(url: string): LinkAnalysis {
    const result: LinkAnalysis = {
      url,
      isMalicious: false,
      riskScore: 0,
      categories: []
    };

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Check for suspicious TLD
      const tld = domain.slice(domain.lastIndexOf('.'));
      if (SUSPICIOUS_TLDS.includes(tld)) {
        result.categories.push(LinkCategory.SUSPICIOUS);
        result.riskScore += 0.3;
      }

      // Check for malicious patterns
      for (const pattern of MALICIOUS_URL_PATTERNS) {
        if (pattern.test(url) || pattern.test(urlObj.pathname)) {
          result.categories.push(LinkCategory.PHISHING);
          result.riskScore += 0.5;
          result.isMalicious = result.riskScore >= 0.5;
          break;
        }
      }

      // Check for URL shorteners
      const shortenerDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co'];
      if (shortenerDomains.includes(domain)) {
        result.categories.push(LinkCategory.SHORTENER);
        result.riskScore += 0.2;
      }
    } catch {
      // Invalid URL
      result.riskScore = 0.1;
    }

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private analyzeAttachment(attachment: any): AttachmentAnalysis {
    const result: AttachmentAnalysis = {
      filename: attachment.filename || 'unknown',
      mimeType: attachment.mimeType || 'application/octet-stream',
      size: attachment.size || 0,
      isMalicious: false,
      riskScore: 0,
      indicators: []
    };

    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js'];
    const ext = result.filename.slice(result.filename.lastIndexOf('.')).toLowerCase();

    if (suspiciousExtensions.includes(ext)) {
      result.riskScore += 0.7;
      result.isMalicious = result.riskScore >= 0.7;
      result.indicators.push({
        type: 'SUSPICIOUS_EXTENSION',
        value: ext,
        confidence: 0.7
      });
    }

    // Check for suspicious MIME types
    const suspiciousMimeTypes = ['application/x-msdownload', 'application/x-msdos-program'];
    if (suspiciousMimeTypes.includes(result.mimeType)) {
      result.riskScore += 0.6;
      result.isMalicious = result.riskScore >= 0.6;
      result.indicators.push({
        type: 'SUSPICIOUS_MIME_TYPE',
        value: result.mimeType,
        confidence: 0.6
      });
    }

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkDomainMismatch(email: any): AnomalyIndicator | null {
    if (!email.sender || !email.sender.name || !email.sender.email) {
      return null;
    }

    const senderName = email.sender.name.toLowerCase();
    const senderEmail = email.sender.email.toLowerCase();
    const domain = senderEmail.split('@')[1];

    // Simple check: does display name contain domain?
    if (!senderName.includes(domain) && !domain.includes(senderName)) {
      return {
        type: PhishingIndicatorType.DOMAIN_MISMATCH,
        value: 'Display name does not match domain',
        confidence: 0.6,
        source: 'phishing-detection'
      };
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkUrgencyLanguage(email: any): AnomalyIndicator | null {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    const combined = subject + ' ' + body;

    for (const phrase of URGENCY_PHRASES) {
      if (combined.includes(phrase)) {
        return {
          type: PhishingIndicatorType.URGENCY_LANGUAGE,
          value: `Found urgency phrase: "${phrase}"`,
          confidence: 0.7,
          source: 'phishing-detection'
        };
      }
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkCredentialRequests(email: any): AnomalyIndicator | null {
    const body = (email.body || '').toLowerCase();
    const credentialWords = ['password', 'username', 'credential', 'social security', 'credit card', 'bank account'];

    for (const word of credentialWords) {
      if (body.includes(word)) {
        return {
          type: PhishingIndicatorType.CREDENTIAL_REQUEST,
          value: `Credential request detected: "${word}"`,
          confidence: 0.9,
          source: 'phishing-detection'
        };
      }
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkSuspiciousUrls(email: any): AnomalyIndicator[] {
    const body = email.body || '';
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const urls = body.match(urlRegex);

    if (!urls) {
      return [];
    }

    const indicators: AnomalyIndicator[] = [];
    for (const url of urls) {
      const analysis = this.analyzeLink(url);
      if (analysis.riskScore > 0.5) {
        indicators.push({
          type: PhishingIndicatorType.SUSPICIOUS_URL,
          value: url,
          confidence: analysis.riskScore,
          source: 'link-scan'
        });
      }
    }

    return indicators;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkGenericGreeting(email: any): AnomalyIndicator | null {
    const body = (email.body || '').toLowerCase();
    const genericGreetings = ['dear customer', 'dear user', 'dear sir', 'dear madam', 'dear valued customer'];

    for (const greeting of genericGreetings) {
      if (body.startsWith(greeting)) {
        return {
          type: PhishingIndicatorType.GENERIC_GREETING,
          value: `Generic greeting: "${greeting}"`,
          confidence: 0.5,
          source: 'phishing-detection'
        };
      }
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkPromotionalLanguage(email: any): AnomalyIndicator | null {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    const combined = subject + ' ' + body;

    const promoWords = ['free', 'discount', 'offer', 'sale', 'promotion', 'limited time', 'exclusive', 'save'];

    let count = 0;
    for (const word of promoWords) {
      if (combined.includes(word)) {
        count++;
      }
    }

    if (count >= 3) {
      return {
        type: SpamIndicatorType.PROMOTIONAL_LANGUAGE,
        value: `Multiple promotional words found: ${count}`,
        confidence: 0.6,
        source: 'spam-detection'
      };
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkExcessiveCaps(email: any): AnomalyIndicator | null {
    const subject = email.subject || '';
    const body = email.body || '';
    const combined = subject + body;

    const capsCount = (combined.match(/[A-Z]/g) || []).length;
    const totalChars = combined.replace(/\s/g, '').length;

    if (totalChars > 0 && capsCount / totalChars > 0.5) {
      return {
        type: SpamIndicatorType.EXCESSIVE_CAPS,
        value: 'Excessive capitalization detected',
        confidence: 0.7,
        source: 'spam-detection'
      };
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkExcessivePunctuation(email: any): AnomalyIndicator | null {
    const subject = email.subject || '';
    const body = email.body || '';
    const combined = subject + body;

    const punctCount = (combined.match(/[!?.]{2,}/g) || []).length;

    if (punctCount > 2) {
      return {
        type: SpamIndicatorType.EXCESSIVE_PUNCTUATION,
        value: 'Excessive punctuation detected',
        confidence: 0.6,
        source: 'spam-detection'
      };
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkPriceMentions(email: any): AnomalyIndicator | null {
    const subject = email.subject || '';
    const body = email.body || '';
    const combined = subject + body;

    const priceRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+\s*(?:dollars?|usd|eur|gbp)/gi;
    const prices = combined.match(priceRegex);

    if (prices && prices.length >= 2) {
      return {
        type: SpamIndicatorType.PRICE_MENTION,
        value: `Multiple price mentions: ${prices.length}`,
        confidence: 0.5,
        source: 'spam-detection'
      };
    }

    return null;
  }

  private isSuspiciousDomain(domain: string): boolean {
    const suspiciousDomains = ['tempmail.com', 'throwaway.email', 'guerrillamail.com'];
    return suspiciousDomains.some((d) => domain.includes(d));
  }

  private checkEmailVolume(senderEmail: string, baseline: BehavioralBaseline): AnomalyIndicator | null {
    // Simplified check - in real implementation, would query recent email count
    const recentCount = Math.random() * baseline.avgEmailsPerDay * 2;
    const deviation = Math.abs(recentCount - baseline.avgEmailsPerDay) / baseline.avgEmailsPerDay;

    if (deviation > 2) {
      return {
        type: PatternType.UNUSUAL_VOLUME,
        value: `Unusual email volume: ${recentCount.toFixed(0)} vs baseline ${baseline.avgEmailsPerDay.toFixed(0)}`,
        confidence: 0.8,
        source: 'behavioral-analysis'
      };
    }

    return null;
  }

  private determineAnomalyType(result: AnomalyDetectionResult): {
    type: AnomalyType;
    severity: AnomalySeverity;
    description: string;
  } {
    if (result.riskScore < 0.3) {
      return {
        type: AnomalyType.UNKNOWN,
        severity: AnomalySeverity.INFO,
        description: 'No significant anomalies detected'
      };
    }

    // Determine type based on indicators
    const phishingCount = result.indicators.filter((i) => i.source === 'phishing-detection').length;
    const spamCount = result.indicators.filter((i) => i.source === 'spam-detection').length;
    const linkCount = result.indicators.filter((i) => i.source === 'link-scan').length;
    const attachmentCount = result.indicators.filter((i) => i.source === 'attachment-scan').length;

    let type = AnomalyType.UNKNOWN;
    let description = 'Potential security threat detected';

    if (phishingCount >= 2 || (phishingCount > 0 && result.riskScore >= 0.7)) {
      type = AnomalyType.PHISHING;
      description = 'Phishing attempt detected';
    } else if (spamCount >= 2) {
      type = AnomalyType.SPAM;
      description = 'Spam pattern detected';
    } else if (linkCount >= 2) {
      type = AnomalyType.MALICIOUS_LINK;
      description = 'Malicious links detected';
    } else if (attachmentCount >= 1) {
      type = AnomalyType.SUSPICIOUS_ATTACHMENT;
      description = 'Suspicious attachment detected';
    }

    // Determine severity
    let severity = AnomalySeverity.LOW;
    if (result.riskScore >= 0.8) {
      severity = AnomalySeverity.CRITICAL;
    } else if (result.riskScore >= 0.6) {
      severity = AnomalySeverity.HIGH;
    } else if (result.riskScore >= 0.4) {
      severity = AnomalySeverity.MEDIUM;
    }

    return { type, severity, description };
  }

  private generateRecommendedActions(result: AnomalyDetectionResult): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    if (result.riskScore >= 0.8) {
      actions.push({
        type: ActionType.DELETE_EMAIL,
        description: 'Delete this email immediately',
        priority: 1,
        automated: false
      });
    }

    if (result.type === AnomalyType.PHISHING) {
      actions.push({
        type: ActionType.REPORT_PHISHING,
        description: 'Report as phishing attempt',
        priority: 1,
        automated: false
      });
      actions.push({
        type: ActionType.BLOCK_SENDER,
        description: 'Block the sender',
        priority: 2,
        automated: true
      });
    }

    if (result.type === AnomalyType.SPAM) {
      actions.push({
        type: ActionType.MARK_AS_SPAM,
        description: 'Mark as spam',
        priority: 1,
        automated: true
      });
    }

    actions.push({
      type: ActionType.ALERT_USER,
      description: 'Alert user about potential threat',
      priority: 2,
      automated: false
    });

    return actions.sort((a, b) => a.priority - b.priority);
  }

  private updateStatisticsByType(type: AnomalyType): void {
    if (!this.statistics.detectionsByType[type]) {
      this.statistics.detectionsByType[type] = 0;
    }
    this.statistics.detectionsByType[type]++;
  }

  private updateStatisticsBySeverity(severity: AnomalySeverity): void {
    if (!this.statistics.detectionsBySeverity[severity]) {
      this.statistics.detectionsBySeverity[severity] = 0;
    }
    this.statistics.detectionsBySeverity[severity]++;
  }

  private updateAnalysisTime(time: number): void {
    const currentAvg = this.statistics.avgAnalysisTime;
    const count = this.statistics.totalAnalyzed;
    this.statistics.avgAnalysisTime = (currentAvg * (count - 1) + time) / count;
  }

  updateConfig(newConfig: Partial<AnomalyDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AnomalyDetectionConfig {
    return { ...this.config };
  }

  getStatistics(): AnomalyDetectionStatistics {
    return { ...this.statistics };
  }

  resetStatistics(): void {
    this.statistics = this.initializeStatistics();
  }

  clearCache(): void {
    this.cache.clear();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
