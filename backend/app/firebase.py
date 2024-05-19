import firebase_admin
from firebase_admin import credentials, firestore
from app import FIREBASE_SA_PATH, FIREBASE_COLLECTION 
from datetime import datetime

class FirebaseManager:
    def __init__(self) -> None:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(credentials.Certificate(FIREBASE_SA_PATH))
        self.db = firestore.client()
        self.collection = self.db.collection(FIREBASE_COLLECTION)

    def add_document(self, image: str, prediction: str, heatmaps: list[str], boxmaps: list[str], user_id: str, flagged: list[str] = []) -> str:
        current_datetime = datetime.now().isoformat()
        doc_ref = self.collection.add({
            "image": image,
            "prediction": prediction,
            "heatmaps": heatmaps,
            "boxmaps": boxmaps,
            "flagged": flagged,
            "user_id": user_id,
            "created_at": current_datetime,
        })
        doc_id = doc_ref[1].id 
        return doc_id
    
    def update_flagged(self, doc_id: str, flagged: list[int]) -> None:
        doc_ref = self.collection.document(doc_id)
        doc_ref.update({
            "flagged": flagged
        })

