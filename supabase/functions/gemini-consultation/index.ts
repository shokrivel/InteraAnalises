import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interfaces
interface Article {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  abstract: string;
  source: string;
  relevanceScore?: number;
}

interface ScientificQuery {
  query: string;
  year_min: number;
  filters: {
    type: string;
    language: string[];
  };
}

interface GeminiResponse {
  text: string;
  references: Array<{
    id: number;
    title: string;
    authors: string;
    year: number;
    doi?: string;
  }>;
  ESPECIALIDADE_SUGERIDA: {
    specialty: string;
    confidence: number;
  };
}

// Scientific APIs Integration
class ScientificAPIsService {
  private springerApiKey: string;

  constructor() {
    this.springerApiKey = Deno.env.get('SPRINGER_API_KEY') || '';
  }

  // Generate scientific query from symptoms
  generateScientificQuery(symptoms: string[], examResults?: any): ScientificQuery {
    const currentYear = new Date().getFullYear();
    
    // Convert symptoms to medical terms (simplified MeSH-like conversion)
    const medicalTerms = this.convertToMedicalTerms(symptoms);
    
    return {
      query: medicalTerms.join(' AND '),
      year_min: currentYear - 5,
      filters: {
        type: 'journal-article',
        language: ['en', 'pt']
      }
    };
  }

  private convertToMedicalTerms(symptoms: string[]): string[] {
    const meshTerms: { [key: string]: string } = {
      'dor de cabeça': 'headache',
      'enjoo': 'nausea',
      'diarreia': 'diarrhea',
      'vômito': 'vomiting',
      'febre': 'fever',
      'dor no corpo': 'myalgia',
      'manchas vermelhas': 'erythema',
      'dor de garganta': 'pharyngitis',
      'tosse': 'cough',
      'fadiga': 'fatigue',
      'tontura': 'dizziness'
    };

    return symptoms.map(symptom => {
      const cleanSymptom = symptom.toLowerCase().replace(/[*]/g, '');
      return meshTerms[cleanSymptom] || cleanSymptom.replace(/\s+/g, '+');
    });
  }

  // Sanitize query for security
  private sanitizeQuery(query: string): string {
    // Remove dangerous characters and limit length
    const sanitized = query
      .replace(/[<>'";&|`$(){}[\]\\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
    
    return sanitized;
  }

  // Fetch from PMC OAI-PMH
  async fetchFromPMC(scientificQuery: ScientificQuery): Promise<Article[]> {
    try {
      const sanitizedQuery = this.sanitizeQuery(scientificQuery.query);
      const fromDate = `${scientificQuery.year_min}-01-01`;
      const toDate = `${new Date().getFullYear()}-12-31`;
      
      const url = `https://www.pubmedcentral.nih.gov/oai/oai.cgi?verb=ListRecords&set=pmc-open&metadataPrefix=pmc&from=${fromDate}&until=${toDate}&query=${encodeURIComponent(sanitizedQuery)}`;
      
      console.log('Fetching from PMC:', url);
      
      const response = await fetch(url);
      const xmlText = await response.text();
      
      return this.parsePMCXML(xmlText);
    } catch (error) {
      console.error('PMC API error:', error);
      return [];
    }
  }

  // Fetch from Springer Open Access
  async fetchFromSpringerOpen(scientificQuery: ScientificQuery): Promise<Article[]> {
    try {
      if (!this.springerApiKey) {
        console.log('Springer API key not configured');
        return [];
      }

      const sanitizedQuery = this.sanitizeQuery(scientificQuery.query);
      const url = `https://api.springernature.com/openaccess/jats?q=${encodeURIComponent(sanitizedQuery)}&p=1&s=50&api_key=${this.springerApiKey}`;
      
      console.log('Fetching from Springer Open Access');
      
      const response = await fetch(url);
      const data = await response.json();
      
      return this.parseSpringerResponse(data);
    } catch (error) {
      console.error('Springer Open Access API error:', error);
      return [];
    }
  }

  // Fetch from Springer Meta
  async fetchFromSpringerMeta(scientificQuery: ScientificQuery): Promise<Article[]> {
    try {
      if (!this.springerApiKey) {
        console.log('Springer API key not configured');
        return [];
      }

      const sanitizedQuery = this.sanitizeQuery(scientificQuery.query);
      const url = `https://api.springernature.com/meta/v2/json?q=${encodeURIComponent(sanitizedQuery)}&p=1&s=50&api_key=${this.springerApiKey}`;
      
      console.log('Fetching from Springer Meta');
      
      const response = await fetch(url);
      const data = await response.json();
      
      return this.parseSpringerMetaResponse(data);
    } catch (error) {
      console.error('Springer Meta API error:', error);
      return [];
    }
  }

  // Parse PMC XML response (simplified)
  private parsePMCXML(xmlText: string): Article[] {
    const articles: Article[] = [];
    
    try {
      // Basic XML parsing - in production use a proper XML parser
      const recordMatches = xmlText.match(/<record>(.*?)<\/record>/gs);
      
      if (recordMatches) {
        recordMatches.slice(0, 10).forEach((record, index) => {
          const titleMatch = record.match(/<article-title>(.*?)<\/article-title>/s);
          const abstractMatch = record.match(/<abstract>(.*?)<\/abstract>/s);
          const journalMatch = record.match(/<journal-title>(.*?)<\/journal-title>/s);
          const yearMatch = record.match(/<year>(\d{4})<\/year>/);
          const doiMatch = record.match(/<article-id pub-id-type="doi">(.*?)<\/article-id>/);
          
          if (titleMatch) {
            articles.push({
              id: `pmc_${index}`,
              title: this.cleanXMLText(titleMatch[1]),
              authors: this.extractAuthorsFromPMC(record),
              journal: journalMatch ? this.cleanXMLText(journalMatch[1]) : 'PMC Journal',
              year: yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear(),
              doi: doiMatch ? doiMatch[1] : undefined,
              abstract: abstractMatch ? this.cleanXMLText(abstractMatch[1]).substring(0, 500) : '',
              source: 'PMC'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing PMC XML:', error);
    }
    
    return articles;
  }

  // Parse Springer Open Access response
  private parseSpringerResponse(data: any): Article[] {
    const articles: Article[] = [];
    
    try {
      if (data.records) {
        data.records.slice(0, 10).forEach((record: any, index: number) => {
          articles.push({
            id: `springer_open_${index}`,
            title: record.title || 'No title',
            authors: record.creators ? record.creators.map((c: any) => c.creator || c) : [],
            journal: record.publicationName || 'Springer Journal',
            year: record.publicationDate ? new Date(record.publicationDate).getFullYear() : new Date().getFullYear(),
            doi: record.doi,
            abstract: record.abstract || record.description || '',
            source: 'Springer Open Access'
          });
        });
      }
    } catch (error) {
      console.error('Error parsing Springer Open response:', error);
    }
    
    return articles;
  }

  // Parse Springer Meta response
  private parseSpringerMetaResponse(data: any): Article[] {
    const articles: Article[] = [];
    
    try {
      if (data.records) {
        data.records.slice(0, 10).forEach((record: any, index: number) => {
          articles.push({
            id: `springer_meta_${index}`,
            title: record.title || 'No title',
            authors: record.creators ? record.creators.map((c: any) => c.creator || c) : [],
            journal: record.publicationName || 'Springer Journal',
            year: record.publicationDate ? new Date(record.publicationDate).getFullYear() : new Date().getFullYear(),
            doi: record.doi,
            abstract: record.abstract || record.description || '',
            source: 'Springer Meta'
          });
        });
      }
    } catch (error) {
      console.error('Error parsing Springer Meta response:', error);
    }
    
    return articles;
  }

  private cleanXMLText(text: string): string {
    return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private extractAuthorsFromPMC(record: string): string[] {
    const authorMatches = record.match(/<name>(.*?)<\/name>/gs);
    const authors: string[] = [];
    
    if (authorMatches) {
      authorMatches.forEach(authorMatch => {
        const surnameMatch = authorMatch.match(/<surname>(.*?)<\/surname>/);
        const givenNamesMatch = authorMatch.match(/<given-names>(.*?)<\/given-names>/);
        
        if (surnameMatch) {
          const surname = this.cleanXMLText(surnameMatch[1]);
          const givenNames = givenNamesMatch ? this.cleanXMLText(givenNamesMatch[1]) : '';
          authors.push(`${givenNames} ${surname}`.trim());
        }
      });
    }
    
    return authors.slice(0, 5); // Limit to 5 authors
  }

  // Fetch articles from all sources
  async fetchAllArticles(scientificQuery: ScientificQuery): Promise<Article[]> {
    console.log('Fetching articles with query:', scientificQuery);
    
    const [pmcArticles, springerOpenArticles, springerMetaArticles] = await Promise.allSettled([
      this.fetchFromPMC(scientificQuery),
      this.fetchFromSpringerOpen(scientificQuery),
      this.fetchFromSpringerMeta(scientificQuery)
    ]);

    let allArticles: Article[] = [];

    if (pmcArticles.status === 'fulfilled') {
      allArticles = allArticles.concat(pmcArticles.value);
    }
    if (springerOpenArticles.status === 'fulfilled') {
      allArticles = allArticles.concat(springerOpenArticles.value);
    }
    if (springerMetaArticles.status === 'fulfilled') {
      allArticles = allArticles.concat(springerMetaArticles.value);
    }

    console.log(`Fetched ${allArticles.length} total articles`);
    return allArticles;
  }

  // Normalize and filter articles
  normalizeAndFilter(articles: Article[]): Article[] {
    const currentYear = new Date().getFullYear();
    const fiveYearsAgo = currentYear - 5;
    
    // Filter by year and deduplicate by DOI/title
    const filtered = articles.filter(article => article.year >= fiveYearsAgo);
    const deduped = this.deduplicateArticles(filtered);
    
    // Calculate relevance scores
    const withScores = deduped.map(article => ({
      ...article,
      relevanceScore: this.calculateRelevanceScore(article)
    }));
    
    // Sort by relevance score and recency
    const sorted = withScores.sort((a, b) => {
      const scoreA = (a.relevanceScore || 0) + (a.year - fiveYearsAgo) * 0.1;
      const scoreB = (b.relevanceScore || 0) + (b.year - fiveYearsAgo) * 0.1;
      return scoreB - scoreA;
    });
    
    return sorted.slice(0, 20); // Top 20 articles
  }

  private deduplicateArticles(articles: Article[]): Article[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.doi || article.title.toLowerCase().replace(/\s+/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateRelevanceScore(article: Article): number {
    // Simple TF-IDF-like scoring based on title and abstract
    let score = 0;
    const text = `${article.title} ${article.abstract}`.toLowerCase();
    
    // Key medical terms scoring
    const medicalTerms = ['symptom', 'diagnosis', 'treatment', 'clinical', 'patient', 'study', 'research'];
    medicalTerms.forEach(term => {
      const matches = (text.match(new RegExp(term, 'g')) || []).length;
      score += matches * 0.1;
    });
    
    // Journal quality indicator (simplified)
    if (article.journal.toLowerCase().includes('medicine') || 
        article.journal.toLowerCase().includes('medical') ||
        article.journal.toLowerCase().includes('clinical')) {
      score += 0.5;
    }
    
    return score;
  }

  // Format articles for Gemini context
  formatArticlesForGemini(articles: Article[]): string {
    if (articles.length === 0) {
      return "Nenhum artigo científico encontrado para os sintomas relatados.";
    }

    let formattedText = "ARTIGOS CIENTÍFICOS PARA ANÁLISE:\n\n";
    
    articles.forEach((article, index) => {
      formattedText += `${index + 1}. TÍTULO: ${article.title}\n`;
      formattedText += `   AUTORES: ${article.authors.join(', ')}\n`;
      formattedText += `   REVISTA: ${article.journal}\n`;
      formattedText += `   ANO: ${article.year}\n`;
      if (article.doi) {
        formattedText += `   DOI: ${article.doi}\n`;
      }
      formattedText += `   RESUMO: ${article.abstract}\n`;
      formattedText += `   FONTE: ${article.source}\n\n`;
    });

    return formattedText;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { consultationData, userId, attachments, reopenData } = await req.json();
    console.log('Request body received:', { consultationData, userId });

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('profile_type, name, address, city')
      .eq('user_id', userId)
      .single();

    console.log('User profile:', profile);

    // Initialize Scientific APIs Service
    const scientificService = new ScientificAPIsService();

    // Generate scientific query from symptoms
    const scientificQuery = scientificService.generateScientificQuery(
      consultationData.symptoms || [],
      consultationData.exam_results
    );

    // Fetch scientific articles
    const allArticles = await scientificService.fetchAllArticles(scientificQuery);
    
    // Normalize and filter articles
    const filteredArticles = scientificService.normalizeAndFilter(allArticles);
    console.log(`Using ${filteredArticles.length} filtered articles`);

    // Format articles for Gemini
    const articlesContext = scientificService.formatArticlesForGemini(filteredArticles);

    // Prepare system prompt with evidence-based requirements
    const systemPrompt = `Você é um assistente médico virtual especializado em análise baseada em evidências científicas.

REGRAS OBRIGATÓRIAS:
1. Use APENAS os artigos científicos fornecidos para justificar afirmações
2. Não invente conclusões ou use conhecimento não fornecido nos artigos
3. Se a evidência for fraca ou ausente, declare incerteza e recomende consulta médica presencial
4. Cite as fontes no formato: (Autor et al., Ano, DOI se disponível)
5. Retorne OBRIGATORIAMENTE ao final: **ESPECIALIDADE_SUGERIDA:** {"specialty":"nome","confidence":0.##}

FORMATO DE RESPOSTA OBRIGATÓRIO para perfil ${profile?.profile_type || 'patient'}:
- Para 'patient': linguagem simples, educativa, foco em quando procurar ajuda
- Para 'academic': linguagem técnica moderada, mais detalhes sobre estudos
- Para 'health_professional': linguagem técnica completa, metodologias, limitações

Ao final da resposta, SEMPRE inclua:
**ESPECIALIDADE_SUGERIDA:** {"specialty":"[especialidade médica apropriada]","confidence":[0.0-1.0]}

IMPORTANTE: A confiança deve refletir a qualidade da evidência disponível nos artigos fornecidos.`;

    // Build consultation context
    let consultationContext = '';
    
    if (reopenData) {
      consultationContext = `REAVALIAÇÃO DE CONSULTA:
Consulta original: ${reopenData.originalResponse}
Nova pergunta: ${reopenData.newQuestion}
Sintomas originais: ${reopenData.originalSymptoms?.join(', ') || 'N/A'}`;
    } else {
      consultationContext = `NOVA CONSULTA MÉDICA:
Sintomas: ${consultationData.symptoms?.join(', ') || 'N/A'}
Duração dos sintomas: ${consultationData.symptom_duration || 'Não informado'} dias
${consultationData.escala_de_dor ? `Escala de dor: ${consultationData.escala_de_dor}/10` : ''}
${consultationData.family_symptoms ? 'Sintomas familiares: Sim' : ''}
${consultationData.epidemiological_info ? `Informações epidemiológicas: ${JSON.stringify(consultationData.epidemiological_info)}` : ''}`;
    }

    // Process attachments
    const imageParts = [];
    if (attachments && attachments.length > 0) {
      console.log(`Processing ${attachments.length} attachments...`);
      
      for (const attachment of attachments) {
        try {
          const { data } = await supabaseClient.storage
            .from('consultation-attachments')
            .download(attachment.file_path);
          
          if (data) {
            const arrayBuffer = await data.arrayBuffer();
            const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            imageParts.push({
              inlineData: {
                data: base64String,
                mimeType: attachment.file_type
              }
            });
          }
        } catch (error) {
          console.error('Error processing attachment:', error);
        }
      }
    }

    // Prepare request for Gemini with scientific articles
    const requestParts = [
      { text: `${systemPrompt}\n\n${articlesContext}\n\n${consultationContext}` }
    ];
    
    if (imageParts.length > 0) {
      requestParts.push(...imageParts);
    }

    console.log(`Sending request to Gemini API with ${requestParts.length} parts...`);

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GOOGLE_AI_API_KEY')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: requestParts }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    const geminiData = await geminiResponse.json();
    console.log('Gemini API response:', geminiData);

    if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    const aiResponseText = geminiData.candidates[0].content.parts[0].text;

    // Extract specialty suggestion
    let suggestedSpecialty = 'Clínico Geral';
    let confidence = 0.5;
    
    const specialtyMatch = aiResponseText.match(/\*\*ESPECIALIDADE_SUGERIDA:\*\*\s*({[^}]+})/);
    if (specialtyMatch) {
      try {
        const specialtyData = JSON.parse(specialtyMatch[1]);
        suggestedSpecialty = specialtyData.specialty || 'Clínico Geral';
        confidence = specialtyData.confidence || 0.5;
      } catch (error) {
        console.error('Error parsing specialty suggestion:', error);
      }
    }

    // Map specialty to search keyword - Portuguese to English mapping
    const mapSpecialtyToKeyword = (specialty: string): string => {
      const lower = specialty.toLowerCase();
      
      // Cardiology
      if (lower.includes('cardio') || lower.includes('coração') || lower.includes('pressão')) return 'cardiologist';
      
      // Dermatology
      if (lower.includes('dermat') || lower.includes('pele') || lower.includes('acne')) return 'dermatologist';
      
      // Neurology
      if (lower.includes('neuro') || lower.includes('cabeça') || lower.includes('enxaqueca') || lower.includes('dor de cabeça')) return 'neurologist';
      
      // Gastroenterology
      if (lower.includes('gastro') || lower.includes('estômago') || lower.includes('náusea') || lower.includes('vômito') || lower.includes('enjoo') || lower.includes('digestão')) return 'gastroenterologist';
      
      // General Medicine - common symptoms
      if (lower.includes('medicina geral') || lower.includes('clínico geral') || lower.includes('febre') || lower.includes('dor') || lower.includes('mal-estar')) return 'general practitioner';
      
      // Gynecology
      if (lower.includes('gineco') || lower.includes('mulher')) return 'gynecologist';
      
      // Orthopedics
      if (lower.includes('ortop') || lower.includes('osso') || lower.includes('fratura')) return 'orthopedist';
      
      // Pediatrics
      if (lower.includes('pedi') || lower.includes('criança') || lower.includes('infantil')) return 'pediatrician';
      
      // Psychiatry
      if (lower.includes('psiq') || lower.includes('mental') || lower.includes('ansiedade') || lower.includes('depressão')) return 'psychiatrist';
      
      // Psychology
      if (lower.includes('psico') || lower.includes('terapia')) return 'psychologist';
      
      // Ophthalmology
      if (lower.includes('oftalmo') || lower.includes('olho') || lower.includes('visão')) return 'ophthalmologist';
      
      // ENT (Otolaryngology)
      if (lower.includes('otorr') || lower.includes('ouvido') || lower.includes('nariz') || lower.includes('garganta')) return 'otolaryngologist';
      
      // Urology
      if (lower.includes('urolog') || lower.includes('urina') || lower.includes('rim')) return 'urologist';
      
      // Pulmonology
      if (lower.includes('pneumo') || lower.includes('pulmão') || lower.includes('respiração')) return 'pulmonologist';
      
      // Rheumatology
      if (lower.includes('reuma') || lower.includes('articulação') || lower.includes('artrite')) return 'rheumatologist';
      
      // Nephrology
      if (lower.includes('nefro') || lower.includes('rim')) return 'nephrologist';
      
      // Endocrinology
      if (lower.includes('endocr') || lower.includes('diabetes') || lower.includes('hormônio')) return 'endocrinologist';
      
      // Infectious diseases
      if (lower.includes('infect') || lower.includes('infecção')) return 'infectious disease specialist';
      
      // Emergency medicine
      if (lower.includes('emergência') || lower.includes('urgência')) return 'emergency medicine';
      
      return 'doctor';
    };

    const specialtyKeyword = mapSpecialtyToKeyword(suggestedSpecialty);

    console.log(`Extracted specialty: ${suggestedSpecialty} -> keyword: ${specialtyKeyword} (confidence: ${confidence})`);

    // Search for nearby specialists
    let specialists = [];
    let searchPerformed = false;
    
    // Try with user address first
    if (profile?.address && profile?.city) {
      const userAddress = `${profile.address}, ${profile.city}`;
      console.log(`Searching for specialists near: ${userAddress}`);
      
      try {
        const specialistResponse = await supabaseClient.functions.invoke('find-healthcare-providers', {
          body: {
            address: userAddress,
            keyword: specialtyKeyword,
            radius: 15000
          }
        });

        console.log('Specialist response:', specialistResponse);
        searchPerformed = true;

        if (specialistResponse.data?.providers) {
          specialists = specialistResponse.data.providers.slice(0, 5);
          console.log(`Found ${specialists.length} specialists for ${suggestedSpecialty} near ${userAddress}`);
        } else {
          console.log('No providers found in response:', specialistResponse.data);
        }
      } catch (error) {
        console.error('Error finding specialists with address:', error);
      }
    }
    
    // Fallback: try with just city if full address didn't work or wasn't available
    if (!searchPerformed && profile?.city) {
      console.log(`Fallback: Searching for specialists in city: ${profile.city}`);
      
      try {
        const specialistResponse = await supabaseClient.functions.invoke('find-healthcare-providers', {
          body: {
            address: profile.city,
            keyword: specialtyKeyword,
            radius: 25000 // Increase radius for city search
          }
        });

        if (specialistResponse.data?.providers) {
          specialists = specialistResponse.data.providers.slice(0, 5);
          console.log(`Found ${specialists.length} specialists for ${suggestedSpecialty} in ${profile.city}`);
        }
      } catch (error) {
        console.error('Error finding specialists with city:', error);
      }
    } else if (!searchPerformed) {
      console.log('No address or city available for user, skipping specialist search');
    }

    // Save consultation to database with audit trail
    const consultationRecord = {
      user_id: userId,
      consulta_original_id: reopenData?.consultationId || null,
      symptoms: consultationData.symptoms || [],
      symptom_duration: consultationData.symptom_duration,
      family_symptoms: consultationData.family_symptoms || false,
      epidemiological_info: consultationData.epidemiological_info || null,
      exam_results: consultationData.exam_results || null,
      ai_response: aiResponseText,
      attachments: attachments || [],
      status: 'finalizada'
    };

    const { data: savedConsultation, error: saveError } = await supabaseClient
      .from('consultation_history')
      .insert(consultationRecord)
      .select('id')
      .single();

    if (saveError) {
      console.error('Error saving consultation:', saveError);
      throw saveError;
    }

    console.log(`Consultation saved successfully: ${savedConsultation.id}`);

    // Save audit trail for scientific articles used
    if (filteredArticles.length > 0) {
      const auditData = {
        consultation_id: savedConsultation.id,
        scientific_query: scientificQuery,
        articles_used: filteredArticles.map(a => ({
          id: a.id,
          title: a.title,
          doi: a.doi,
          source: a.source,
          relevanceScore: a.relevanceScore
        })),
        articles_count: filteredArticles.length,
        timestamp: new Date().toISOString()
      };
      
      console.log('Scientific articles audit:', auditData);
    }

    // Return response with scientific evidence and specialists
    return new Response(JSON.stringify({
      response: aiResponseText,
      consultationId: savedConsultation.id,
      profileType: profile?.profile_type || 'patient',
      specialists,
      suggestedSpecialty,
      confidence,
      articlesUsed: filteredArticles.length,
      scientificEvidence: filteredArticles.slice(0, 5).map(article => ({
        title: article.title,
        authors: article.authors.join(', '),
        year: article.year,
        doi: article.doi,
        source: article.source
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-consultation function:', error);
    
    // Fallback response without scientific evidence
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor. Por favor, tente novamente.',
      fallback: true,
      response: 'No momento não foi possível acessar as bases científicas. Recomendamos que procure atendimento médico presencial para uma avaliação adequada.',
      suggestedSpecialty: 'Clínico Geral',
      confidence: 0.3,
      specialists: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});