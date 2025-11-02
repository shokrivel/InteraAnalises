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

  // Fetch from PubMed using eUtils API (more reliable than PMC OAI)
  async fetchFromPubMed(scientificQuery: ScientificQuery): Promise<Article[]> {
    try {
      const sanitizedQuery = this.sanitizeQuery(scientificQuery.query);
      const currentYear = new Date().getFullYear();
      const fromYear = scientificQuery.year_min;
      
      // Step 1: Search for articles using eSearch
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(sanitizedQuery)}+AND+${fromYear}:${currentYear}[dp]&retmax=50&retmode=json&sort=relevance`;
      
      console.log('Fetching from PubMed eSearch:', searchUrl);
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (!searchData.esearchresult?.idlist?.length) {
        console.log('No PubMed articles found');
        return [];
      }
      
      // Step 2: Fetch article details using eFetch
      const ids = searchData.esearchresult.idlist.slice(0, 20).join(',');
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids}&retmode=xml`;
      
      const fetchResponse = await fetch(fetchUrl);
      const xmlText = await fetchResponse.text();
      
      return this.parsePubMedXML(xmlText);
    } catch (error) {
      console.error('PubMed API error:', error);
      return [];
    }
  }

  // Fetch from Springer Nature API (improved error handling)
  async fetchFromSpringerNature(scientificQuery: ScientificQuery): Promise<Article[]> {
    try {
      if (!this.springerApiKey) {
        console.log('Springer API key not configured');
        return [];
      }

      const sanitizedQuery = this.sanitizeQuery(scientificQuery.query);
      const url = `https://api.springernature.com/meta/v2/json?q=${encodeURIComponent(sanitizedQuery)}&s=50&p=1&api_key=${this.springerApiKey}`;
      
      console.log('Fetching from Springer Nature Meta API');
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'InteraSaude-Medical-Assistant/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Springer API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.parseSpringerNatureResponse(data);
    } catch (error) {
      console.error('Springer Nature API error:', error);
      return [];
    }
  }

  // Fetch medical books from Google Books API (fallback for reliable sources)
  async fetchMedicalBooks(scientificQuery: ScientificQuery): Promise<Article[]> {
    try {
      const sanitizedQuery = this.sanitizeQuery(scientificQuery.query);
      const medicalQuery = `${sanitizedQuery} medical diagnosis treatment textbook`;
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(medicalQuery)}&subject=Medical&orderBy=newest&maxResults=20&langRestrict=pt&langRestrict=en`;
      
      console.log('Fetching medical books from Google Books API');
      
      const response = await fetch(url);
      const data = await response.json();
      
      return this.parseGoogleBooksResponse(data, scientificQuery.year_min);
    } catch (error) {
      console.error('Google Books API error:', error);
      return [];
    }
  }

  // Parse PubMed XML response
  private parsePubMedXML(xmlText: string): Article[] {
    const articles: Article[] = [];
    
    try {
      // Extract PubmedArticle elements
      const articleMatches = xmlText.match(/<PubmedArticle>(.*?)<\/PubmedArticle>/gs);
      
      if (articleMatches) {
        articleMatches.slice(0, 15).forEach((article, index) => {
          const titleMatch = article.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/s);
          const abstractMatch = article.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/s);
          const journalMatch = article.match(/<Title>(.*?)<\/Title>/s);
          const yearMatch = article.match(/<PubDate>.*?<Year>(\d{4})<\/Year>/s);
          const pmidMatch = article.match(/<PMID[^>]*>(\d+)<\/PMID>/);
          const doiMatch = article.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);
          
          if (titleMatch) {
            articles.push({
              id: `pubmed_${pmidMatch ? pmidMatch[1] : index}`,
              title: this.cleanXMLText(titleMatch[1]),
              authors: this.extractAuthorsFromPubMed(article),
              journal: journalMatch ? this.cleanXMLText(journalMatch[1]) : 'PubMed Journal',
              year: yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear(),
              doi: doiMatch ? doiMatch[1] : undefined,
              abstract: abstractMatch ? this.cleanXMLText(abstractMatch[1]).substring(0, 800) : '',
              source: 'PubMed'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing PubMed XML:', error);
    }
    
    return articles;
  }

  // Parse Google Books response for medical textbooks
  private parseGoogleBooksResponse(data: any, yearMin: number): Article[] {
    const articles: Article[] = [];
    
    try {
      if (data.items) {
        data.items.forEach((item: any, index: number) => {
          const volumeInfo = item.volumeInfo;
          const publishedYear = volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : 2020;
          
          // Filter by publication year (2020+)
          if (publishedYear >= yearMin) {
            articles.push({
              id: `book_${item.id || index}`,
              title: volumeInfo.title || 'Medical Reference',
              authors: volumeInfo.authors || ['Unknown Author'],
              journal: volumeInfo.publisher || 'Medical Publisher',
              year: publishedYear,
              abstract: volumeInfo.description ? volumeInfo.description.substring(0, 500) : 'Medical textbook reference',
              source: 'Medical Books'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing Google Books response:', error);
    }
    
    return articles;
  }

  // Parse Springer Nature response (unified method)
  private parseSpringerNatureResponse(data: any): Article[] {
    const articles: Article[] = [];
    
    try {
      if (data.records) {
        data.records.slice(0, 15).forEach((record: any, index: number) => {
          const publishYear = record.publicationDate ? new Date(record.publicationDate).getFullYear() : new Date().getFullYear();
          
          articles.push({
            id: `springer_${record.doi?.replace(/[^a-zA-Z0-9]/g, '_') || index}`,
            title: record.title || 'Springer Article',
            authors: this.extractSpringerAuthors(record),
            journal: record.publicationName || record.journalTitle || 'Springer Journal',
            year: publishYear,
            doi: record.doi,
            abstract: record.abstract || record.description || '',
            source: 'Springer Nature'
          });
        });
      }
    } catch (error) {
      console.error('Error parsing Springer Nature response:', error);
    }
    
    return articles;
  }

  private extractSpringerAuthors(record: any): string[] {
    if (record.creators && Array.isArray(record.creators)) {
      return record.creators.map((creator: any) => creator.creator || creator.name || creator).slice(0, 5);
    }
    if (record.authors && Array.isArray(record.authors)) {
      return record.authors.map((author: any) => author.name || author).slice(0, 5);
    }
    return ['Unknown Author'];
  }

  private extractAuthorsFromPubMed(article: string): string[] {
    const authorMatches = article.match(/<Author[^>]*>(.*?)<\/Author>/gs);
    const authors: string[] = [];
    
    if (authorMatches) {
      authorMatches.forEach(authorMatch => {
        const lastNameMatch = authorMatch.match(/<LastName>(.*?)<\/LastName>/);
        const foreNameMatch = authorMatch.match(/<ForeName>(.*?)<\/ForeName>/);
        const initialsMatch = authorMatch.match(/<Initials>(.*?)<\/Initials>/);
        
        if (lastNameMatch) {
          const lastName = this.cleanXMLText(lastNameMatch[1]);
          const firstName = foreNameMatch ? this.cleanXMLText(foreNameMatch[1]) : 
                           initialsMatch ? this.cleanXMLText(initialsMatch[1]) : '';
          authors.push(`${firstName} ${lastName}`.trim());
        }
      });
    }
    
    return authors.slice(0, 5);
  }

  // Fetch articles from all sources with fallback strategy
  async fetchAllArticles(scientificQuery: ScientificQuery): Promise<Article[]> {
    console.log('Fetching articles with query:', scientificQuery);
    
    const [pubmedArticles, springerArticles, medicalBooks] = await Promise.allSettled([
      this.fetchFromPubMed(scientificQuery),
      this.fetchFromSpringerNature(scientificQuery),
      this.fetchMedicalBooks(scientificQuery)
    ]);

    let allArticles: Article[] = [];

    if (pubmedArticles.status === 'fulfilled') {
      allArticles = allArticles.concat(pubmedArticles.value);
      console.log(`PubMed: ${pubmedArticles.value.length} articles`);
    } else {
      console.error('PubMed fetch failed:', pubmedArticles.reason);
    }
    
    if (springerArticles.status === 'fulfilled') {
      allArticles = allArticles.concat(springerArticles.value);
      console.log(`Springer: ${springerArticles.value.length} articles`);
    } else {
      console.error('Springer fetch failed:', springerArticles.reason);
    }
    
    if (medicalBooks.status === 'fulfilled') {
      allArticles = allArticles.concat(medicalBooks.value);
      console.log(`Medical Books: ${medicalBooks.value.length} articles`);
    } else {
      console.error('Medical Books fetch failed:', medicalBooks.reason);
    }

    console.log(`Fetched ${allArticles.length} total articles from all sources`);
    
    // If no articles found, try a broader search
    if (allArticles.length === 0) {
      console.log('No articles found, trying broader search...');
      const broaderQuery = {
        ...scientificQuery,
        query: this.generateBroaderQuery(scientificQuery.query)
      };
      
      const fallbackResults = await Promise.allSettled([
        this.fetchFromPubMed(broaderQuery),
        this.fetchMedicalBooks(broaderQuery)
      ]);
      
      if (fallbackResults[0].status === 'fulfilled') {
        allArticles = allArticles.concat(fallbackResults[0].value);
      }
      if (fallbackResults[1].status === 'fulfilled') {
        allArticles = allArticles.concat(fallbackResults[1].value);
      }
    }

    return allArticles;
  }

  private generateBroaderQuery(originalQuery: string): string {
    // Extract key medical terms and create broader search
    const terms = originalQuery.split(' AND ');
    return terms.slice(0, 2).join(' OR '); // Take first 2 terms with OR
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

  // Helper to clean XML/HTML text safely
  private cleanXMLText(text: string): string {
    try {
      return text
        .replace(/<[^>]+>/g, '') // strip tags
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    } catch (_) {
      return text ?? '';
    }
  }

  // Format articles for Gemini context with diagnostic focus
  formatArticlesForGemini(articles: Article[]): string {
    if (articles.length === 0) {
      return "ATENÇÃO: Nenhuma evidência científica específica foi encontrada nas bases de dados consultadas (PubMed, Springer Nature, Livros Médicos 2020+). A análise será baseada em conhecimento médico geral.";
    }

    let formattedText = `EVIDÊNCIAS CIENTÍFICAS ENCONTRADAS (${articles.length} fontes):\n\n`;
    
    // Group by source type
    const pubmedArticles = articles.filter(a => a.source === 'PubMed');
    const springerArticles = articles.filter(a => a.source === 'Springer Nature');
    const bookArticles = articles.filter(a => a.source === 'Medical Books');
    
    if (pubmedArticles.length > 0) {
      formattedText += `=== ESTUDOS CLÍNICOS (PubMed) - ${pubmedArticles.length} artigos ===\n`;
      pubmedArticles.forEach((article, index) => {
        formattedText += `${index + 1}. ${article.title}\n`;
        formattedText += `   Autores: ${article.authors.join(', ')}\n`;
        formattedText += `   Revista: ${article.journal} (${article.year})\n`;
        if (article.doi) formattedText += `   DOI: ${article.doi}\n`;
        formattedText += `   Resumo: ${article.abstract}\n\n`;
      });
    }
    
    if (springerArticles.length > 0) {
      formattedText += `=== PESQUISAS SPRINGER NATURE - ${springerArticles.length} artigos ===\n`;
      springerArticles.forEach((article, index) => {
        formattedText += `${index + 1}. ${article.title}\n`;
        formattedText += `   Autores: ${article.authors.join(', ')}\n`;
        formattedText += `   Publicação: ${article.journal} (${article.year})\n`;
        if (article.doi) formattedText += `   DOI: ${article.doi}\n`;
        formattedText += `   Resumo: ${article.abstract}\n\n`;
      });
    }
    
    if (bookArticles.length > 0) {
      formattedText += `=== LIVROS MÉDICOS ESPECIALIZADOS (2020+) - ${bookArticles.length} referências ===\n`;
      bookArticles.forEach((article, index) => {
        formattedText += `${index + 1}. ${article.title}\n`;
        formattedText += `   Autores: ${article.authors.join(', ')}\n`;
        formattedText += `   Editora: ${article.journal} (${article.year})\n`;
        formattedText += `   Descrição: ${article.abstract}\n\n`;
      });
    }

    return formattedText;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== START gemini-consultation ===');
    
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey || !lovableApiKey) {
      console.error('Missing required environment variables:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseServiceRoleKey,
        hasLovableKey: !!lovableApiKey
      });
      throw new Error('Missing required environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { consultationData, userId, attachments, reopenData } = await req.json();
    console.log('Request body received:', { 
      consultationData, 
      userId, 
      hasAttachments: !!attachments,
      hasReopenData: !!reopenData 
    });

    // Get user profile with proper error handling
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('profile_type, name, address, city')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    if (!profile) {
      console.error('Profile not found for user:', userId);
      throw new Error('User profile not found');
    }

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

    // Prepare system prompt with evidence-based requirements - PERSONALIZED FOR USER PROFILE
    const systemPrompt = `Você é um assistente médico virtual especializado em análise baseada em evidências científicas.

PERFIL DO USUÁRIO: ${profile?.profile_type || 'patient'} - ${profile?.name || 'Usuário'}
LOCALIZAÇÃO: ${profile?.city || 'Não informada'}

REGRAS OBRIGATÓRIAS:
1. PERSONALIZE completamente a resposta para o perfil "${profile?.profile_type || 'patient'}"
2. Use APENAS os artigos científicos fornecidos para justificar afirmações
3. Não invente conclusões ou use conhecimento não fornecido nos artigos
4. Se a evidência for fraca ou ausente, declare incerteza e recomende consulta médica presencial
5. Cite as fontes no formato: (Autor et al., Ano, DOI se disponível)
6. Retorne OBRIGATORIAMENTE ao final: **ESPECIALIDADE_SUGERIDA:** {"specialty":"nome","confidence":0.##}

FORMATO DE RESPOSTA ESPECÍFICO para perfil "${profile?.profile_type || 'patient'}":

${profile?.profile_type === 'patient' ? `
- Use linguagem SIMPLES e acessível
- Explique termos médicos de forma clara
- Foque em SINAIS DE ALERTA e quando procurar ajuda URGENTE
- Seja EMPÁTICO e tranquilizador quando apropriado
- Evite jargões técnicos
- Priorize orientações práticas para o dia a dia
` : profile?.profile_type === 'academic' ? `
- Use linguagem técnica MODERADA
- Inclua detalhes sobre METODOLOGIAS dos estudos citados
- Mencione LIMITAÇÕES das pesquisas
- Discuta GAPS de conhecimento na área
- Apresente PERSPECTIVAS de pesquisa futura
- Use terminologia científica apropriada
` : `
- Use linguagem técnica COMPLETA
- Detalhe PROTOCOLOS e GUIDELINES relevantes
- Discuta DIAGNÓSTICOS DIFERENCIAIS
- Inclua considerações sobre FARMACOLOGIA e INTERAÇÕES
- Mencione CRITÉRIOS DIAGNÓSTICOS específicos
- Apresente ALGORITMOS de decisão clínica
`}

BUSCA DE ESPECIALISTAS: Baseie a especialidade sugerida ESTRITAMENTE nos sintomas apresentados e evidências dos artigos, priorizando especialistas que realmente tratam a condição identificada.

Ao final da resposta, SEMPRE inclua:
**ESPECIALIDADE_SUGERIDA:** {"specialty":"[especialidade médica ESPECÍFICA para os sintomas]","confidence":[0.0-1.0]}

IMPORTANTE: A confiança deve refletir a qualidade da evidência disponível nos artigos fornecidos e a especificidade dos sintomas para a especialidade sugerida.`;

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

    console.log(`Calling Lovable AI Gateway...`);

    // Call Lovable AI Gateway (OpenAI-compatible)
    const aiResponse = await fetch(
      'https://ai.gateway.lovable.dev/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${articlesContext}\n\n${consultationContext}${imageParts.length > 0 ? '\n\n[Imagens anexadas: analisar se relevante.]' : ''}` }
          ]
        })
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI gateway HTTP error:', aiResponse.status, errText);
      if (aiResponse.status === 429) {
        throw new Error('Limite de requisições atingido. Tente novamente em instantes.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Créditos de IA insuficientes. Por favor, adicione créditos.');
      }
      throw new Error('AI gateway error');
    }

    const aiJson = await aiResponse.json();
    console.log('AI gateway response:', aiJson);

    const aiResponseText = aiJson.choices?.[0]?.message?.content;
    if (!aiResponseText) {
      throw new Error('Invalid AI response');
    }

    // Extract specialty suggestion for internal use (hidden from user)
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

    // Remove the specialty suggestion line from the response shown to user
    const cleanedResponse = aiResponseText.replace(/\*\*ESPECIALIDADE_SUGERIDA:\*\*[^\n]*\n?/g, '').trim();

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
      ai_response: cleanedResponse, // Store cleaned response in database too
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

    // Return response with cleaned text (specialty suggestion hidden from user)
    return new Response(JSON.stringify({
      response: cleanedResponse, // Use cleaned response without specialty line
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