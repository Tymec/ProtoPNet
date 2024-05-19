from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore

from app import FIREBASE_COLLECTION, FIREBASE_SA_PATH


class FirebaseManager:
    def __init__(self) -> None:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(credentials.Certificate(FIREBASE_SA_PATH))
        self.db = firestore.client()
        self.collection = self.db.collection(FIREBASE_COLLECTION)

    def add_document(
        self,
        image: str,
        image_hash: str,
        prediction: str,
        confidence_map: dict[str, float],
        heatmaps: list[str],
        boxmaps: list[str],
        user_id: str,
        flagged: list[str] = [],
    ) -> str:
        doc_ref = self.collection.add(
            {
                "hash": image_hash,
                "image": image,
                "prediction": prediction,
                "confidence": confidence_map,
                "heatmaps": heatmaps,
                "boxmaps": boxmaps,
                "flagged": flagged,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
            }
        )
        return doc_ref[1].id

    def find_by_image(self, image_hash: str, user_id: str) -> tuple[str, dict] | None:
        found = self.collection.where("hash", "==", image_hash).where("user_id", "==", user_id).get()
        if len(found) == 0:
            found = self.collection.where("hash", "==", image_hash).where("user_id", "==", "anonymous").get()
        return (found[0].id, found[0].to_dict()) if found else None

    def update_flagged(self, doc_id: str, flagged: list[int]) -> None:
        doc_ref = self.collection.document(doc_id)
        doc_ref.update({"flagged": flagged})

    def get_user_history(self, user_id: str) -> list[dict]:
        docs = self.collection.where("user_id", "==", user_id).stream()

        user_history = []
        for doc in docs:
            data = doc.to_dict()
            user_history.append(
                {
                    "image": data["image"],
                    "prediction": data["prediction"],
                    "heatmaps": data["heatmaps"],
                    "flagged": data["flagged"],
                    "timestamp": data["timestamp"],
                }
            )

        return user_history
