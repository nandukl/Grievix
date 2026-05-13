import os
import joblib
import numpy as np
from typing import List, Dict, Tuple, Optional
from sklearn.metrics.pairwise import cosine_similarity
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from sklearn.linear_model import LinearRegression
import datetime

class GrievixML:
    def __init__(self, model_path: str, vectorizer_path: str, encoder_path: str):
        self.analyzer = SentimentIntensityAnalyzer()
        self.model_path = model_path
        self.vectorizer_path = vectorizer_path
        self.encoder_path = encoder_path
        
        self.model = None
        self.tfidf_vectorizer = None
        self.label_encoder = None
        
        # Regression model for resolution time prediction
        self.regression_model = LinearRegression()
        self.is_regression_trained = False
        
        # Emergency keywords
        self.emergency_keywords = ["fire", "gas leak", "electric short", "short circuit", "sparks", "explosion", "blast", "transformer spark"]
        
        self.load_components()
        self.train_dummy_regression()  # Train with base patterns if no data

    def load_components(self):
        """Loads the ML components from disk."""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
            if os.path.exists(self.vectorizer_path):
                self.tfidf_vectorizer = joblib.load(self.vectorizer_path)
            if os.path.exists(self.encoder_path):
                self.label_encoder = joblib.load(self.encoder_path)
            
            if all([self.model, self.tfidf_vectorizer, self.label_encoder]):
                print("✅ ML Engine components loaded successfully")
            else:
                print("⚠️ Some ML components are missing")
        except Exception as e:
            print(f"❌ Error loading ML components: {e}")

    def get_sentiment_score(self, text: str) -> float:
        """
        Returns a sentiment score between -1 and 1.
        Uses VADER Sentiment.
        """
        scores = self.analyzer.polarity_scores(text)
        return scores['compound']

    def predict_category(self, text: str) -> str:
        """Predicts the category using ML model with a keyword fallback."""
        text_lower = text.lower()
        
        # 1. Try ML model if available
        if all([self.model, self.tfidf_vectorizer, self.label_encoder]):
            try:
                tfidf_vec = self.tfidf_vectorizer.transform([text_lower])
                prediction = self.model.predict(tfidf_vec)[0]
                category = self.label_encoder.inverse_transform([prediction])[0]
                return category
            except Exception as e:
                print(f"ML Prediction failed: {e}")

        # 2. Smart Keyword Fallback (if ML fails or isn't loaded)
        mapping = {
            "Water Issues": ["water", "drinking", "leak", "pipe", "tap", "smell", "taste", "pressure", "scarcity"],
            "Road Issues": ["road", "pothole", "asphalt", "street", "highway", "repair", "damage", "construction", "hump"],
            "Garbage Issues": ["garbage", "trash", "waste", "collection", "dump", "bin", "clean", "disposal", "stink"],
            "Electricity": ["electricity", "power", "outage", "blackout", "wire", "transformer", "voltage", "flickering", "shock"],
            "Drainage Issues": ["drainage", "sewer", "flood", "waterlogging", "blockage", "clog", "overflow", "gutter"]
        }
        
        for category, keywords in mapping.items():
            if any(kw in text_lower for kw in keywords):
                return category
                
        return "Other"

    def train_dummy_regression(self):
        """Train a basic regression model based on category weights."""
        # Mock training data: (category_index, sentiment_score) -> days
        # Categories: Water (0), Road (1), Garbage (2), Electricity (3), Drainage (4), Other (5)
        X = [
            [0, -0.8], [0, 0.2],  # Water: high severity vs low
            [1, -0.9], [1, 0.1],  # Road: complex vs simple
            [2, -0.5], [2, 0.5],  # Garbage: urgent vs regular
            [3, -1.0], [3, 0.0],  # Electricity: dangerous vs minor
            [4, -0.7], [4, 0.3],  # Drainage: blocked vs maintenance
            [5, -0.2], [5, 0.8]   # Other
        ]
        # Average days to resolve
        y = [4, 2, 10, 5, 2, 1, 3, 1, 5, 2, 7, 3]
        
        try:
            self.regression_model.fit(X, y)
            self.is_regression_trained = True
        except:
            pass

    def predict_resolution_time(self, category: str, sentiment: float) -> float:
        """Predicts estimated resolution time in days."""
        if not self.is_regression_trained:
            return 3.0 # Default fallback
            
        try:
            # Map category to index
            categories = ["Water Issues", "Road Issues", "Garbage Issues", "Electricity", "Drainage Issues", "Other"]
            cat_idx = categories.index(category) if category in categories else 5
            
            prediction = self.regression_model.predict([[cat_idx, sentiment]])[0]
            return max(1.0, round(float(prediction), 1))
        except:
            return 3.0

    def detect_emergency(self, text: str) -> bool:
        """Checks if a complaint contains emergency keywords."""
        text_lower = text.lower()
        return any(kw in text_lower for kw in self.emergency_keywords)

    def calculate_priority_boost(self, text: str, initial_severity: int) -> Tuple[float, List[str]]:
        """
        Calculates priority boost based on sentiment and keywords.
        Returns (boosted_score, reasons).
        """
        reasons = []
        sentiment = self.get_sentiment_score(text)
        priority = float(initial_severity)
        
        # Sentiment boost: Highly negative sentiment suggests frustration/urgency
        if sentiment < -0.8:
            priority += 2.0
            reasons.append("Extreme negative sentiment boost")
        elif sentiment < -0.6:
            priority += 1.0
            reasons.append("Negative sentiment boost")
            
        # Emergency detection boost
        if self.detect_emergency(text):
            priority += 3.0
            reasons.append("Emergency situation detected")
            
        return min(10.0, priority), reasons

    def check_duplicates(self, new_complaint: str, existing_complaints: List[Dict], threshold: float = 0.75) -> List[Dict]:
        """
        Checks for potential duplicates using Cosine Similarity.
        """
        if not self.tfidf_vectorizer or not existing_complaints:
            return []
            
        new_vec = self.tfidf_vectorizer.transform([new_complaint.lower()])
        
        duplicates = []
        
        # Extract existing complaint texts
        existing_texts = [c.get('complaint', '') for c in existing_complaints]
        if not existing_texts:
            return []
            
        existing_vecs = self.tfidf_vectorizer.transform(existing_texts)
        
        # Calculate cosine similarity
        similarities = cosine_similarity(new_vec, existing_vecs)[0]
        
        for idx, score in enumerate(similarities):
            if score >= threshold:
                duplicates.append({
                    "id": existing_complaints[idx].get("_id"),
                    "text": existing_texts[idx],
                    "similarity": round(float(score), 4),
                    "status": existing_complaints[idx].get("status", "unknown")
                })
                
        # Sort by similarity descending
        duplicates.sort(key=lambda x: x['similarity'], reverse=True)
        return duplicates
