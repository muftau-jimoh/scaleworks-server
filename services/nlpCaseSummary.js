const { NlpManager } = require('node-nlp');
const { trainingLegalQueries } = require('../utils/legalResearchConstants');

const natural = require('natural');
const tokenizer = new natural.SentenceTokenizer();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

const manager = new NlpManager({ languages: ['en'] });

// Train once when the app starts
async function trainNlpModel() {
    trainingLegalQueries.forEach(query => manager.addDocument('en', query, 'search_case_law'));
    await manager.train(); // Train the model once
    await manager.save();  // Save trained model (optional)
}

/**
 * Extractive summarization using TF-IDF
 * @param {string} text - The full court case text
 * @param {number} numSentences - Number of sentences to include in summary
 * @returns {string} - Summarized text
 */
function summarizeText(text, numSentences = 3) {
    const sentences = tokenizer.tokenize(text);  // Split text into sentences

    if (sentences.length <= numSentences) return text;  // If text is short, return as-is

    // Add each sentence to TF-IDF for scoring
    sentences.forEach(sentence => tfidf.addDocument(sentence));

    // Score sentences by their TF-IDF importance
    const sentenceScores = sentences.map((sentence, index) => {
        let score = 0;
        tfidf.listTerms(index).forEach(term => {
            score += term.tfidf;  // Sum TF-IDF scores for each word
        });
        return { sentence, score };
    });

    // Sort sentences by TF-IDF score (descending order)
    sentenceScores.sort((a, b) => b.score - a.score);

    // Get the top sentences for the summary
    const topSentences = sentenceScores.slice(0, numSentences).map(s => s.sentence);

    console.log('topSentences: ', topSentences)

    return topSentences.join(" ");  // Join sentences to form the summary
}

/**
 * Find relevant court cases and summarize them.
 * @param {string} query - Search query
 * @param {Array} courtCases - Array of court case objects { name, text }
 * @returns {Array} - Array of relevant cases with smart summaries
 */
async function findRelevantCases(query, courtCases) {
    const response = await manager.process('en', query);  // NLP processing

    const rankedCases = courtCases
        .map(caseText => {
            const relevanceScore = response.intent === 'find_legal_case' 
                ? (caseText.toLowerCase().includes(query.toLowerCase()) ? 1 : 0.5) 
                : 0;  // Score based on NLP intent
            
            return { caseText, relevanceScore };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 2);


    return rankedCases.map(c => ({
        summary: summarizeText(c.caseText, 5),
    }));
}

module.exports = { findRelevantCases, trainNlpModel};





// Sample court cases
// const courtCases = [
//     {
//         name: "Smith v. TechCorp",
//         summary: "The employer monitored employee emails without consent, violating privacy laws.",
//         fullText: "In Smith v. TechCorp, the employer was found guilty of unauthorized surveillance...",
//     },
//     {
//         name: "Doe v. SecureNet",
//         summary: "Company email monitoring was allowed due to an explicit company policy.",
//         fullText: "In Doe v. SecureNet, the court ruled in favor of the employer, stating that the company's email monitoring policy was clearly communicated...",
//     },
//     {
//         name: "Johnson v. InfoSys",
//         summary: "Court ruled email surveillance is legal only if employees are informed.",
//         fullText: "The decision in Johnson v. InfoSys established that employee email monitoring is lawful if an official policy is in place...",
//     }
// ];